module.exports = {
	name: 'info',
  cooldown: 5,
	description: 'Get information about the bot',
	execute(client, message, args) {
		const Discord = client.Discord;
    var owner = client.application.owner;
    if(owner.owner){
      owner = owner.owner.user;
    }
    const infoembed = new Discord.MessageEmbed()
      .setTitle(`${client.user.username} info`)
      .addFields(
    		{ name: 'What am I?', value: `I'm ${client.user.username}! I use OpenAI's GPT-3 to power my responses, the most powerful text processing AI __in the world__.\nWanna saying something to me? Run \`${client.config.bot.prefix}ask <message>\`!` },
    		{ name: 'Disclaimer', value: `All messages I generate are the responsibility of ${owner.username}#${owner.discriminator} and **the user that generated the message**, and aren't associated with OpenAI in any way.` }
    	).setColor("RANDOM");
		message.inlineReply(infoembed);
	},
};
