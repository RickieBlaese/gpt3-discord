module.exports = {
	name: 'reset',
  cooldown: 30,
	description: 'Reset your conversation by deleting your message history',
	execute(client, message, args) {
    client.database.db.serialize(function(){
      client.database.db.run("DELETE FROM messages WHERE userid = $1;", [message.author.id], function(err){
        if(err){
          throw new Error(err);
        }
        message.inlineReply("Your message history has been deleted, resetting your conversation.");
      });
    });
	},
};
