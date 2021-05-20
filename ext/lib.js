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
const Discord = require('discord.js');
const client = new Discord.Client();
const webhooks = {};

client.fetchWebhook(config.bot.webhooks.messages.id, config.bot.webhooks.messages.secret).then(webhook=>{
	webhooks.messages = webhook;
});


isBadInput = wordfilter.blacklisted;

module.exports = {
  getAnswer(message){
    return new Promise((resolve, reject)=>{
      var botlib = require('./lib');
      if(message.cleanContent.substring(6).length>250){
        return reject({code:5, has:message.cleanContent.substring(6).length});
      }
      database.getTokens(message.author.id).then(remainingtokens=>{
        database.getMessages(message.author.id).then(messages=>{
          var toask = `This user is talking on Discord are having a conversation. Only talk about video games, cooking and art.\n\n`;
          messages.reverse();
          for(const message of messages){
            toask = toask + `User: ${message.question}\nPolite Response:${message.answer}\n`
          }
          toask = toask + `User: ${message.cleanContent.substring(6)}\nPolite Response:`
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
              engine: config.openai.model,
              prompt: toask,
              maxTokens: config.openai.maxanswer,
              temperature: 0.9,
              topP: 1,
              presencePenalty: 0,
              frequencyPenalty: 0.3,
              bestOf: 1,
              stream: false,
              stop: [`User:`, '\n', ':'],
              file: config.openai.botfile,
							user: message.author.id
            }).then(response=>{
              openai.complete({
                engine:"content-filter-alpha-c4",
                prompt:"<|endoftext|>"+response.data.choices[0].text+"\n--\nLabel:",
                temperature:0,
                max_tokens:1,
                top_p:1,
                frequency_penalty:0,
                presence_penalty:0,
                logprobs:10,
								user: message.author.id
              }).then(contentfilter=>{
                var toxicitythresh = config.openai.toxicitythresh;
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
                    if((!filter.check(response.data.choices[0].text)) && output_label == "2"){
                      output_label = "1";
                    }
                  }
                }
                switch (output_label) {
                  case "0":
                  case "1":
                    resolve(response.data.choices[0].text);
                    database.addMessage(message.cleanContent.substring(6), response.data.choices[0].text, message.author.id);
                    outputlength = tokenizer.tokenize(response.data.choices[0].text).length;
                    const prices = {
                      davinci: 0.06/1000,
                      "davinci-instruct-beta": 0.06/1000,
                      curie: 0.0060/1000,
                      "curie-instruct-beta": 0.0060/1000,
                      babbage: 0.0012/1000,
                      ada: 0.0008/1000
                    }
                    var theoutput = response.data.choices[0].text;
                    if(theoutput.replace(" ", "")==""){
                      theoutput = "`[EMPTY MESSAGE]`"
                    }
                    var theinput = message.cleanContent.substring(6);
                    if(theinput.replace(" ", "")==""){
                      theinput = "`[EMPTY MESSAGE]`"
                    }
                    var messageembed = new Discord.MessageEmbed()
                      .setTitle(`Message`)
                      .addFields(
                        { name: 'User', value: `${message.author.id} <@${message.author.id}>` },
                        { name: 'Input', value: `${theinput}`},
                        { name: 'Output', value: `${theoutput}`},
                        { name: 'Tokens used', value: `${botlib.thousands(tokenlength)} + ${botlib.thousands(outputlength)} = ${botlib.thousands(tokenlength + outputlength)}`, inline:true},
                        { name: 'Cost', value: `$${(prices[config.openai.model]*tokenlength).toFixed(7)} + $${(prices[config.openai.model]*outputlength).toFixed(7)} = $${(prices[config.openai.model]*(tokenlength+outputlength)).toFixed(7)}`, inline:true},
                        { name: 'Model', value: config.openai.model },
                      ).setColor(config.brandcolour).setTimestamp();
                    webhooks.messages.send(messageembed);
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
