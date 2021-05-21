module.exports = {
	name: 'activate',
  cooldown: 5,
	description: 'Activate your token purchase.',
	usage: '<code>',
  indms: true,
	execute(client, message, args) {
		const Discord = client.Discord;
    if(args.length<=0){
      return message.inlineReply(`Please provide a token, i.e \`${client.config.bot.prefix}activate skbgskdjfbg\`.`);
    }
    message.inlineReply("Looking for your purchase..")
    client.database.validatePurchase(args[0], message.author.id)
      .then(data=>{
        message.inlineReply(`Thanks for supporting us! ${client.lib.thousands(data.amount)} tokens have been added to your account.`);
      })
      .catch(err=>{
        switch(err.code){
          case 0:
            message.inlineReply(`This purchase hasn't been paid for, please follow the link in your DMs.`);
            break;
          case 1:
            message.inlineReply(`This purchase either isn't yours or doesn't exist.`);
            break;
          default:
            throw new Error(err);
        }
      });
	},
};
