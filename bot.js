// DEFINITIONS
const fs = require('fs');
const Discord = require('discord.js');
const config = require('./config.json');
const token = config.bot.token;
const prefix = config.bot.prefix;
const client = new Discord.Client();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const cooldowns = new Discord.Collection();
const errors = {};
client.lib = require('./ext/lib');
client.database = require('./ext/database');
client.Discord = Discord;
client.config = config;
client.tips = require('./tips.json').list;
const webhooks = {};

client.fetchWebhook(config.bot.webhooks.servers.id, config.bot.webhooks.servers.secret).then(webhook=>{
	webhooks.servers = webhook;
});
// EXTENTIONS
require("./ext/inline");

// SETTING UP COMMANDS
client.commands = new Discord.Collection();

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(`${command.name}`, command);
}

errors.default = require(`./errors/default.js`);
errors.cooldown = require(`./errors/cooldown.js`);

// EVENTS
client.once('ready', () => {
	client.user.setActivity(`${config.bot.prefix}help | ${config.bot.prefix}info`);
	client.fetchApplication().then((info)=>{
		client.application = info;
	});
});

client.on('guildCreate', guild => {
	client.shard.fetchClientValues('guilds.cache.size')
		.then(results=>{
			const infoembed = new Discord.MessageEmbed()
			.setTitle(`Added to ${guild.name}`)
			.addFields(
				{ name: 'Server name', value: guild.name, inline: true },
				{ name: 'Server ID', value: guild.id, inline: true },
				{ name: 'Member count', value: client.lib.thousands(guild.memberCount), inline: true },
			).setColor(`#57F287`)
			.setFooter(`Total servers: ${client.lib.thousands(results.reduce((acc, guildCount) => acc + guildCount, 0))}`)
			.setThumbnail(guild.iconURL());
			webhooks.servers.send(infoembed);
		});
});

client.on('guildDelete', guild => {
	client.shard.fetchClientValues('guilds.cache.size')
		.then(results=>{
			const infoembed = new Discord.MessageEmbed()
			.setTitle(`Left ${guild.name}`)
			.addFields(
				{ name: 'Server name', value: guild.name, inline: true },
				{ name: 'Server ID', value: guild.id, inline: true },
				{ name: 'Member count', value: client.lib.thousands(guild.memberCount), inline: true },
			).setColor(`#ED4245`)
			.setFooter(`Total servers: ${client.lib.thousands(results.reduce((acc, guildCount) => acc + guildCount, 0))}`)
			.setThumbnail(guild.iconURL());
			webhooks.servers.send(infoembed);
		});
});

client.on('message', message => {
	if (!message.content.toLowerCase().startsWith(prefix.toLowerCase()) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
  if (!client.commands.has(command)) return;
  const commandObj = client.commands.get(command);
	if(message.guild == undefined && (!commandObj.indms)) return message.inlineReply("This command doesn't work in DMs.");
	client.database.getUser(message.author.id).then(user=>{
		if(commandObj.perms){
			if(commandObj.perms>user.perms){
				return;
			}
		}
		if(client.config.beta && user.perms==0){
			return;
		}
		if(user.banned){
			return;
		}
		if(!user.eula){
			return message.inlineReply("To use Honeybot, you must agree to our EULA (<https://honeybot.xyz/eula>). To agree, please react to this message with 👍.")
				.then(agreemessage=>{
					agreemessage.react('👍').then(()=>{
						const filter = (reaction, user) => reaction.emoji.name === '👍' && user.id === message.author.id;
						agreemessage.awaitReactions(filter, { time: 15000, max: 1, errors: ['time']})
						  .then(collected => {
								client.database.db.serialize(function(){
									client.database.db.run("UPDATE users SET eula = 1 WHERE userid = $1", [message.author.id], function(err){
										if(err){
											throw new Error(err);
										}
										agreemessage.inlineReply("Thanks for agreeing to our EULA! You can now use Honeybot.");
									});
								});
							})
							.catch(()=>{});
					});
				});
		}
		if (!cooldowns.has(commandObj.name)) {
	  	cooldowns.set(commandObj.name, new Discord.Collection());
	  }
	  const now = Date.now();
	  const timestamps = cooldowns.get(commandObj.name);
	  const cooldownAmount = (commandObj.cooldown || 0) * 1000;
	  if (timestamps.has(message.author.id)) {
	    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
	  	if (now < expirationTime) {
	  		const timeLeft = (expirationTime - now);
	      return errors.cooldown.execute(client, message, timeLeft);
	  	}
	  }
	  timestamps.set(message.author.id, now);
	  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
	  try {
	  	commandObj.execute(client, message, args);
	  } catch (error) {
			if (error.code !== Discord.Constants.APIErrors.MISSING_PERMISSIONS) {
				errors.default.execute(client, message, error);
			}
	  }
	});
});

// LOGIN
client.login(token);
