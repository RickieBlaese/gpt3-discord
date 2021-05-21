module.exports = {
	name: 'ban',
  perms: 2,
	description: 'ban users',
	usage: '<user>',
  indms: true,
	execute(client, message, args) {
		const Discord = client.Discord;
    if(args.length<=0){
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
    client.database.getUser(user.id).then(user=>{
      if(user.perms>0){
        return message.inlineReply("you can only ban and unban staff through the console");
      }
      client.database.db.serialize(function(){
        client.database.db.run("UPDATE users SET banned = 1 WHERE id = $1", [user.id], function(){
          return message.inlineReply("user banned");
        });
      });
    });
	},
};
