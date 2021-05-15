const database = require("./database");
const OpenAI = require("openai-api");
const config = require("../config.json");
const openai = new OpenAI(config.openai.token);
var natural = require('natural');
var tokenizer = new natural.WordTokenizer()

module.exports = {
  getAnswer(message){
    return new Promise((resolve, reject)=>{
      console.log("getting tokens");
      database.getTokens(message.author.id).then(remainingtokens=>{
        console.log(remainingtokens);
        database.getMessages(message.author.id).then(messages=>{
          var toask = `A is asking G something.\n\n`;
          messages.reverse();
          for(const message of messages){
            toask = toask + `A: ${message.question}\nG:${message.answer}\n`
          }
          toask = toask + `A: ${message.cleanContent.substring(6)}\nG:`
          console.log("getting length");
          console.log(toask);
          tokenlength = tokenizer.tokenize(toask).length;
          console.log(tokenlength);
          if(tokenlength>remainingtokens){
            return reject({code:0, needed:tokenlength, has:remainingtokens});
          }
          console.log("taking tokens");
          database.takeTokens(message.author.id, tokenlength).then(newuser=>{
            console.log(newuser);
            console.log("getting answer");
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
              stop: [`A:`, '\n', ':']
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
  }
};
