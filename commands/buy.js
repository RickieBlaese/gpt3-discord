module.exports = {
	name: 'buy',
  cooldown: 2,
	description: 'Buy tokens',
  indms: true,
	execute(client, message, args) {
		const Discord = client.Discord;
    if(args.length<=0){
      return message.inlineReply("Please provide an amount of tokens to buy.");
    }
    try{
      var amount = Math.floor(parseInt(args[0]));
    }catch{
      return message.inlineReply("Please provide a number");
    }
    if(amount<Math.ceil(client.config.minpurchase/client.config.tokenprice)){
      return message.inlineReply(`The minimum purchase is ${client.lib.thousands(Math.ceil(client.config.minpurchase/client.config.tokenprice))} tokens.`);
    }
    message.author.send(`Generating your checkout link..`).catch(err=>{
      message.inlineReply("Please turn on your DMs so I can send you more info.");
    }).then(msg=>{
      message.inlineReply("Please check your DMs.");
      client.database.moreTokens(amount, message.author.id).then(session=>{
        message.author.send(`Checkout here: https://solithcy.xyz/gpt3/checkout?id=${session.id}`).catch(err=>{
          message.inlineReply("Please turn on your DMs so I can send you more info.");
        })
      });
    });
	},
};
