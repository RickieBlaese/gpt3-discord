module.exports = {
	name: 'tokens',
  cooldown: 5,
	description: 'See how many tokens you have',
	execute(client, message, args) {
    client.database.getTokens(message.author.id).then(tokens=>{
      client.database.getUser(message.author.id).then(user=>{
        var msg = ""
        var timeleft = user.tokensgiventime+86400000 - new Date().getTime()
        if(user.tokensgiventime < new Date().getTime()-86400000){
          msg = `You currently have ${client.lib.thousands(user.tokensleft)} tokens. As soon as your tokens dip under ${client.lib.thousands(client.config.dailytokens)}, your tokens will be set to ${client.lib.thousands(client.config.dailytokens)}.`
        }else if(user.tokensleft > client.config.dailytokens){
          msg = `You currently have ${client.lib.thousands(user.tokensleft)} tokens. In ${client.lib.parsetime(timeleft, "in ")}, if your tokens dip under ${client.lib.thousands(client.config.dailytokens)} your tokens will be set to ${client.lib.thousands(client.config.dailytokens)}.`
        }else{
          msg = `You currently have ${client.lib.thousands(user.tokensleft)} tokens. Your tokens will be set to ${client.lib.thousands(client.config.dailytokens)} in ${client.lib.parsetime(timeleft, "in ")}.`
        }
        msg = msg+`\nYou can buy tokens at a rate of **£${client.config.tokenprice} per token** (\`${client.config.bot.prefix}buy\`).`;
        message.inlineReply(msg);
      });
    });
	},
};
