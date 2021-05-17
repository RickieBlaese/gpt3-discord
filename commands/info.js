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
    		{ name: 'What\'s a token?', value: `Think of a token like a currency. You use tokens to interact with me! The token price depends on how long your message is and how long your previous messages were. We make it like this because the OpenAI API costs us money to use and we'd rather not go bankrupt. 500 tokens a day not enough for you? You can buy tokens! Find out more by running \`${client.config.bot.prefix}tokens\`.` },
    		{ name: 'Disclaimer', value: `All messages I generate are the responsibility of **the user that generated the message**, and aren't associated with OpenAI in any way.` }
    	).setColor(`#${client.config.brandcolour}`).setFooter(`By rosee#0001 | Ran and operated by ${owner.username}#${owner.discriminator}`);
		message.inlineReply(infoembed);
	},
};
