module.exports = {
	name: 'invite',
  cooldown: 5,
	description: 'Get the invite link',
	indms: true,
	execute(client, message, args) {
		message.inlineReply("You can invite me at <https://honeybot.xyz/invite>!");
	},
};
