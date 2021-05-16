module.exports = {
	execute(client, message, timeleft) {
    const Discord = require(`discord.js`);
    const cooldownembed = new Discord.MessageEmbed()
      .setTitle("Woah there, slow it down")
      .setDescription(`You can use that command again ${client.lib.parsetime(timeleft, "in ")}`)
      .setColor(`#ED4245`);
    message.inlineReply(cooldownembed)
			.then(msg=>{
				setTimeout(function(){
					msg.delete().then().catch()
				}, 5000)
			});
  }
};
