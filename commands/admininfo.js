module.exports = {
	name: 'admininfo',
  cooldown: 0,
  perms: 3,
	description: 'Info that admin\'s can see (wow)',
	indms: true,
	execute(client, message, args) {
    client.shard.fetchClientValues('guilds.cache.size')
    	.then(results => {
        message.inlineReply(`
> Server count: ${client.lib.thousands(results.reduce((acc, guildCount) => acc + guildCount, 0))}
> Shard count: ${client.lib.thousands(client.shard.ids.length)}`);
    	});
  };
};
