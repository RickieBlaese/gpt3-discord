module.exports = {
	execute(client, message, error) {
    var token = require('crypto').randomBytes(5).toString('hex');
    require('fs').writeFile(`./errors/logs/${token}.txt`, `${new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')}\nError from ${message.author.username}#${message.author.discriminator} (${message.author.id}), running the command ${message.content}\n\n${error.stack}`,
      function(err) {
        if(err) {
            return console.log(err);
        }
        message.inlineReply(`Uh oh, something's gone wrong. Please give my developers the following error code so that they can fix the issue: \`${token}\``);
      }
    );
	},
};
