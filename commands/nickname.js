const OpenAI = require("openai-api");
const config = require("../config.json");
const openai = new OpenAI(config.openai.token);
module.exports = {
	name: 'nickname',
  cooldown: 20,
	description: 'Get the bot to generate a new nickname for you!',
	execute(client, message, args) {
		const Discord = client.Discord;
    if(!message.member.hasPermission(Discord.Permissions.CHANGE_NICKNAME)){
      return message.inlineReply("You must have the `change_nickname` permission to run this command.");
    }
    if(!message.guild.me.hasPermission(Discord.Permissions.MANAGE_NICKNAMES)){
      return message.inlineReply("I don't have the `manage_nicknames` permission. Update my role and try again.");
    }
    if(message.guild.owner.id == message.author.id){
      return message.inlineReply("You're the owner, I can't manage your nickname.");
    }
    if(message.member.roles.highest.position>=message.guild.me.roles.highest.position){
      return message.inlineReply("My role isn't high enough to manage your nickname, put my role higher than yours and try again.")
    }
    client.database.getUser(message.author.id).then(user=>{
      if(user.tokensleft<150){
        return message.inlineReply(`This command costs 150 tokens. You have ${client.lib.thousands(user.tokensleft)}.`);
      }
      message.inlineReply(`This command costs 150 tokens. Continue? [Y/N]`).then(continuemessage=>{
        var filter = m => m.author.id === message.author.id;
        message.channel.awaitMessages(filter, {
            max: 1,
            time: 30*1000,
            errors: ['time']
          })
          .then(responsemessage => {
            responsemessage = responsemessage.first()
            if(responsemessage.content.toLowerCase()=="y"){
              client.database.takeTokens(message.author.id, 150).then(user=>{
                responsemessage.inlineReply("Generating your nickname..");
                openai.complete({
                  engine: client.config.openai.nicknamemodel,
                  prompt: `Generate a nickname for ${message.author.username}. The nickname should be short, funny and make people laugh.\nGenerated nickname:`,
                  maxTokens: config.openai.maxanswer,
                  temperature: 1,
                  topP: 1,
                  presencePenalty: 0,
                  frequencyPenalty: 0.7,
                  bestOf: 2,
                  stream: false,
                  stop: ['\n']
                }).then(response=>{
                  var nickname = response.data.choices[0].text;
                  if(nickname.replace(" ", "")=="" || nickname.length>32){
                    return client.database.addTokens(message.author.id, 150).then(user=>{
                      responsemessage.inlineReply("The AI returned nothing or the nickname was too long, please try again.");
                    });
                  }
                  responsemessage.inlineReply(`Your generated nickname is${nickname}.`);
                  message.member.edit({nick:nickname})
                    .catch(err=>{
											console.error(err);
                      responsemessage.inlineReply("I couldn't change your nickname, please do it manually.");
                    });
                  client.fetchWebhook(client.config.bot.webhooks.messages.id, client.config.bot.webhooks.messages.secret).then(webhook=>{
                    const nicknameembed = new Discord.MessageEmbed()
          			      .setTitle(`Nickname`)
          			      .addFields(
          			        { name: 'User', value: `${message.author.id} <@${message.author.id}>` },
          							{ name: 'Nickname', value: `${message.author.username} => ${nickname}`},
          							{ name: 'Model', value: `curie-instruct-beta`}
          						).setColor(config.brandcolour).setTimestamp();
                    webhook.send(nicknameembed);
                  });
                });
              });
            }else{
              responsemessage.inlineReply("Command aborted.");
            }
          })
          .catch(collected => {
          });
      });
    });
	},
};
