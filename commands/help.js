module.exports = {
	name: 'help',
  cooldown: 0,
	description: 'See this message',
	usage: '[command]',
  indms: true,
	execute(client, message, args) {
    client.database.getUser(message.author.id).then(user=>{
      const Discord = require(`discord.js`);
      var end = `To get more detailed help about a command, run \`${client.config.bot.prefix}help [command]\`\n`;
  		if(args.length>0){
				if(args[0].startsWith(client.config.bot.prefix)){
					args[0] = args[0].substring(client.config.bot.prefix.length);
				}
  			if(client.commands.has(args[0])){
  				var command = client.commands.get(args[0]);
					if(user.perms >= command.perms || (!command.perms)){
						// TODO: add more details
						var cooldown="No cooldown"
						if(command.cooldown>=1){
							cooldown=client.lib.parsetime(command.cooldown*1000)
						}
						message.channel.send(`\`${client.config.bot.prefix}${command.name}\`:
>>> Description: ${command.description}
Cooldown: ${cooldown}
Usage: \`${client.config.bot.prefix}${command.name}${command.usage ? ` ${command.usage}` : ''}\`
Works in DMs: ${command.indms ? "Yes" : "No"}
Required permission level: ${command.perms || "0"}`)
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
