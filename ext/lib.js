const database = require("./database");
const OpenAI = require("openai-api");
const config = require("../config.json");
const openai = new OpenAI(config.openai.token);
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var wordfilter = require('wordfilter');
var filter = require('leo-profanity');
wordfilter.clearList();
wordfilter.addWords(require("../bad.json").list);

isBadInput = wordfilter.blacklisted;

module.exports = {
  getAnswer(message){
    return new Promise((resolve, reject)=>{
      database.getTokens(message.author.id).then(remainingtokens=>{
        database.getMessages(message.author.id).then(messages=>{
          var toask = `This user is talking on Discord are having a conversation on Discord.\n\n`;
          messages.reverse();
          for(const message of messages){
            toask = toask + `User: ${message.question}\nresponse:${message.answer}\n`
          }
          toask = toask + `User: ${message.cleanContent.substring(6)}\npolite response:`
          tokenlength = tokenizer.tokenize(toask).length;
          if(tokenlength>remainingtokens){
            return reject({code:0, needed:tokenlength, has:remainingtokens});
          }
          if(tokenlength>150){
            return reject({code:3, has:tokenlength});
          }
          if(isBadInput(message.cleanContent.substring(6))){
            return reject({code:2});
          }
          database.takeTokens(message.author.id, tokenlength).then(newuser=>{
            openai.complete({
              engine: 'ada',
              prompt: toask,
              maxTokens: config.openai.maxanswer,
              temperature: 1,
              topP: 1,
              presencePenalty: 0,
              frequencyPenalty: 0.3,
              bestOf: 1,
              stream: false,
              stop: [`You:`, '\n', ':'],
              file: config.openai.botfile
            }).then(response=>{
              openai.complete({
                engine:"content-filter-alpha-c4",
                prompt:"<|endoftext|>"+response.data.choices[0].text+"\n--\nLabel:",
                temperature:0,
                max_tokens:1,
                top_p:1,
                frequency_penalty:0,
                presence_penalty:0,
                logprobs:10
              }).then(contentfilter=>{
                var toxicitythresh = -0.355;
                var output_label = contentfilter.data.choices[0].text;
                if (output_label == "2"){
                  logprobs = contentfilter.data.choices[0].logprobs.top_logprobs[0];
                  if(logprobs["2"]<toxicitythresh){
                    logprob_0 = logprobs["0"];
                    logprob_1 = logprobs["1"];
                    if (logprob_0 != undefined && logprob_1 != undefined){
                      if (logprob_0 >= logprob_1){
                        output_label = "0"
                      }else{
                        output_label = "1"
                      }
                    } else if (logprob_0 != undefined) {
                      output_label = "0"
                    } else if (logprob_1 != undefined){
                      output_label = "1"
                    }
                  }
                }
                switch (output_label) {
                  case "0":
                  case "1":
                    resolve(response.data.choices[0].text);
                    database.addMessage(message.cleanContent.substring(6), response.data.choices[0].text, message.author.id);
                    break;
                  case "2":
                    // var tosend = filter.clean(response.data.choices[0].text, "\\♥", 1);
                    // resolve(tosend);
                    // database.addMessage(message.cleanContent.substring(6), tosend, message.author.id);
                    // break;
                    reject({code:4, contentfilter:contentfilter.data.choices[0].text});
                    database.takeTokens(message.author.id, -tokenlength).then(newuser=>{
                    }).catch(console.error);
                    break;
                  default:
                    reject({code:1, error:contentfilter});
                    break;
                }
              }).catch(err=>{
                reject({code:1, error:err});
              });;
            }).catch(err=>{
              reject({code:1, error:err});
            });
          });
        });
      });
    });
  },
  thousands(number){
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  },
  parsetime(time, before = ""){
    seconds = Number(Math.floor(time/1000));
    if(seconds<1){
      return "soon";
    }
    var d = Math.floor(seconds / (3600*24));
    var h = Math.floor(seconds % (3600*24) / 3600);
    var m = Math.floor(seconds % 3600 / 60);
    var s = Math.floor(seconds % 60);

    var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return before + dDisplay + hDisplay + mDisplay + sDisplay;
  },
  getUserFromMention(mention, client) {
    const matches = mention.match(/^<@!?(\d+)>$/);
    if (!matches) return;
    const id = matches[1];
    return client.users.cache.get(id);
  },
  isBadInput: isBadInput
};
