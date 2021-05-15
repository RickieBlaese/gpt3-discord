module.exports = {
	execute(client, message, timeleft) {
    function secondsToDhms(seconds) {
      seconds = Number(seconds);
      if(seconds<1){
        return "soon";
      }
      var d = Math.floor(seconds / (3600*24));
      var h = Math.floor(seconds % (3600*24) / 3600);
      var m = Math.floor(seconds % 3600 / 60);
      var s = Math.floor(seconds % 60);

      var dDisplay = d > 0 ? d + (d == 1 ? " day, " : " days, ") : "";
      var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
      var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
      var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
      return "in " + dDisplay + hDisplay + mDisplay + sDisplay;
    }
    const Discord = require(`discord.js`);
    const cooldownembed = new Discord.MessageEmbed()
      .setTitle("Woah there, slow it down")
      .setDescription(`You can use that command again ${secondsToDhms(timeleft)}`)
      .setColor(`#ED4245`);
    message.inlineReply(cooldownembed);
  }
};
