module.exports = {
	name: 'altertokens',
  perms: 3,
	description: 'give users more tokens',
  indms: true,
	execute(client, message, args) {
		const Discord = client.Discord;
    if(args.length<=1){
      return message.inlineReply("dumbass");
    }
    var user;
    user = client.lib.getUserFromMention(args[0], client);
    if(!user){
      user=client.users.cache.get(args[0]);
    }
    if(!user){
      return message.inlineReply("user not found");
    }
    try{
      tokens = Math.floor(parseInt(args[1]));
    }catch(e){
      return message.inlineReply("please provide a valid number");
    }
    client.database.addTokens(user.id, tokens).then(user=>{
      return message.inlineReply(`${client.lib.thousands(tokens)} tokens have been added to ${user.username}'s account.`);
    })
	},
};
