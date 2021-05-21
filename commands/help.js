module.exports = {
	name: 'help',
  cooldown: 0,
	description: 'See this message',
  indms: true,
	execute(client, message, args) {
    client.database.getUser(message.author.id).then(user=>{
      const Discord = require(`discord.js`);
      var end = `To get more detailed help about a command, run \`${client.config.bot.prefix}help [command]\`\n`;
  		if(args.length>0){
  			if(client.commands.has(args[0])){
  				var command = client.commands.get(args[0]);
					if(user.perms >= command.perms || (!command.perms)){
						// TODO: add more details
						var cooldown="no cooldown"
						if(command.cooldown>=1){
							cooldown=client.lib.parsetime(command.cooldown)
						}
						message.channel.send(`\`${client.config.bot.prefix}${command.name}\`: ${command.description}
Cooldown: ${cooldown}
Works in DMs: ${command.indms}
Required permission level ${command.perms || "0"}`)
							return;
					}
  			}
  		}
      for (var entry of client.commands.entries()) {
        var command = entry[1];
  			if(command.hideinhelp){
  				continue;
  			}
        if(command.perms){
          if(command.perms>user.perms){
            continue;
          }
        }
        end=end+`\`${client.config.bot.prefix}${command.name}\`: ${command.description}\n`
      }
      message.author.send(end)
        .then(msg=>{
  				if(message.guild!=null){
  					message.channel.send("Check your DMs");
  				}
        })
        .catch(err=>{
          message.channel.send("Please turn on your DMs");
        });
    });

	},
};
