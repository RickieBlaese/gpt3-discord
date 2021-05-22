module.exports = {
	name: 'ref',
  cooldown: 5,
	description: 'Get your referral code',
	indms: true,
	execute(client, message, args) {
		const Discord = client.Discord;
    client.database.getRef(message.author.id)
      .then(ref=>{
        message.inlineReply(`Your referral code is \`${ref.code}\`. It has ${client.lib.thousands(ref.uses)} uses.\nGet users to invite the bot with your code by sending them this link: <https://honeybot.xyz/${ref.code}>.\nEvery invite you get will give you **250 tokens**.`);
      });
	},
};
