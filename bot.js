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

client.on('message', message => {
	if (!message.content.toLowerCase().startsWith(prefix.toLowerCase()) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const command = args.shift().toLowerCase();
  if (!client.commands.has(command)) return;
  const commandObj = client.commands.get(command);
	client.database.getUser(message.author.id).then(user=>{
		if(commandObj.perms){
			if(commandObj.perms>user.perms){
				return;
			}
		}
		if(user.banned==1){
			return;
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
	    errors.default.execute(client, message, error);
	  }
	});
});

// LOGIN
client.login(token);
