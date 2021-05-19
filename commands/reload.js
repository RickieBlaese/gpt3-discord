module.exports = {
	name: 'reload',
  perms: 4,
	description: 'reload everything (duh)',
  indms: true,
	execute(client, message, args) {
    client.database.isAdmin(message.author.id).then(isadmin=>{
      if(isadmin){
        message.channel.send("Reloading commands and external files...")
        .then((msg) => {
          client.shard.broadcastEval(`function requireUncached(module) {
            delete require.cache[require.resolve(module)];
            return require(module);
          }
          const Discord = requireUncached('discord.js');
          this.commands = new Discord.Collection();
          this.Discord = Discord;
          this.errors = {};
          this.errors.default = requireUncached('./../../../../errors/default.js');
          this.errors.cooldown = requireUncached('./../../../../errors/cooldown.js');
          const commandFiles = require('fs').readdirSync('./commands').filter(file => file.endsWith('.js'));
          for (const file of commandFiles) {
            const commandreq = requireUncached(\`./../../../../commands/\${file}\`);
            this.commands.set(\`\${commandreq.name}\`, commandreq);
          }
          this.lib = requireUncached('./../../../../ext/lib');
          this.database = requireUncached('./../../../../ext/database');`);
          msg.edit("Commands and external files reloaded!");
        });
      }
    }).catch(console.log);
	},
};
