const database = require("./database");
const OpenAI = require("openai-api");
const config = require("../config.json");
const openai = new OpenAI(config.openai.token);
var natural = require('natural');
var tokenizer = new natural.WordTokenizer();
var wordfilter = require('wordfilter');
wordfilter.clearList();
wordfilter.addWords(require("../bad.json").list);

isBadInput = wordfilter.blacklisted;

module.exports = {
  getAnswer(message){
    return new Promise((resolve, reject)=>{
      database.getTokens(message.author.id).then(remainingtokens=>{
        database.getMessages(message.author.id).then(messages=>{
          var toask = `You and honbot are having a conversation on Discord.\n\n`;
          messages.reverse();
          for(const message of messages){
            toask = toask + `You: ${message.question}\nhonbot:${message.answer}\n`
          }
          toask = toask + `You: ${message.cleanContent.substring(6)}\nhonbot:`
          tokenlength = tokenizer.tokenize(toask).length;
          if(tokenlength>remainingtokens){
            return reject({code:0, needed:tokenlength, has:remainingtokens});
          }
          if(isBadInput(message.cleanContent.substring(6))){
            return reject({code:2});
          }
          database.takeTokens(message.author.id, tokenlength).then(newuser=>{
            openai.complete({
              engine: 'ada',
              prompt: toask,
              maxTokens: 25,
              temperature: 1,
              topP: 1,
              presencePenalty: 0,
              frequencyPenalty: 0.3,
              bestOf: 1,
              stream: false,
              stop: [`A:`, '\n', ':'],
              file: config.openai.botfile
            }).then(response=>{
              resolve(response.data.choices[0].text);
              database.addMessage(message.cleanContent.substring(6), response.data.choices[0].text, message.author.id);
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
