const { ShardingManager } = require('discord.js');
const Discord = require('discord.js');
const token = require('./config.json').bot.token;
const manager = new ShardingManager('./bot.js', { token: token });
const database = require('./ext/database');
const botlib = require('./ext/lib');

manager.on('shardCreate', shard => console.log(`Launched shard ${shard.id}`));
manager.spawn();



// WEB SERVER

function staticpage(page) {
    return function(req, res) {
        res.render(page);
    }
}
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
const config = require('./config.json');
const expressport = config.web.port;
const sessionOptions = {
  httpOnly: true,
  secure : true
};
app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.set("views", path.join(__dirname, './views'));
app.engine("html", require("dot-emc").init(
    {
        app: app,
        fileExtension: "html",
        options: {
            templateSettings: {
                cache: false
            }
        }
    }
).__express);
app.set("view engine", "html");
app.set('trust proxy', 1);
app.use(session({
  secret: config.web.cookiesecret,
  resave: false,
  saveUninitialized: true,
  store: new SQLiteStore,
  cookie: { secure: true, cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 * 4 } } // 4 week long cookie
}))
app.use('/static', express.static('static'));
app.get('/', staticpage("index"));
app.get('/callback', (req, res) => {
  res.render('callback');
  database.getPurchase(req.query.session_id).then(purchase=>{
    sessionid = new Buffer.from(req.query.session_id);
		sessionid = sessionid.toString('base64');
    database.validatePurchase(sessionid, purchase.userid)
      .then(purchasedata=>{
        manager.broadcastEval(`
          (async () => {
             let theguy = await this.users.fetch('${purchase.userid}');
             await theguy.send("Thanks for supporting us! ${botlib.thousands(purchasedata.amount)} tokens have been added to your account.");
          })();
          `, 0)
          .then(theuser=>{
          }).catch();
        })
        .catch(err=>{
        });
      })
      .catch();
});
app.get('/added', (req, res) => {
  if(req.query.guild_id){
    manager.broadcastEval(`
      (async () => {
        let theguy = await this.guilds.fetch('${req.query.guild_id}');
        if(theguy){
          return theguy;
        }
      })();
      `, 0)
      .then(theguild=>{
        return res.render('added', {guild:theguild});
      }).catch(err=>{
        return res.render('added');
      });
  }else{
    return res.render('added');
  }
});
app.get('/checkout', staticpage("checkout"));

app.get('/guild/added', (req, res) => {
  if(1){
    database.db.serialize(function(){
      req.session.ref = 'YltGw';
      database.db.get("SELECT * FROM ref WHERE code = $1;", [req.session.ref], function(err, data){
        req.session.ref = undefined;
        res.redirect(`/added?guild_id=${req.query.guild_id}`);
        if(!data){
          return
        }
        database.db.get("SELECT * FROM servers WHERE serverid = $1", [req.query.guild_id], function(err, serverdata){
          if(serverdata){
            return
          }
          database.db.run("INSERT INTO servers(serverid, time) VALUES($1, $2)", [req.query.guild_id, new Date().getTime()], function(err){
            if(err){
              return console.error(err);
            }
            database.db.run("UPDATE ref SET uses = uses + 1 WHERE id = $1", [data.id], function(err){

            });
            manager.broadcastEval(`
              (async () => {
                let theguild = await this.guilds.fetch('${req.query.guild_id}');
                let theguy = await this.users.fetch('${data.userid}');
                if(theguild.ownerID == theguy.id){
                  return {error:true, code: 1}
                }
                if(theguy){
                  return {user:theguy, guild:theguild};
                }
              })();
              `, 0)
              .then(theuser=>{
                if(theuser){
                  if(theuser.error){
                    switch(theuser.error){
                      case 1:
                        // user owned the guild
                        break;
                      default:
                        break;
                    }
                    return;
                  }
                  manager.broadcastEval(`
                    (async () => {
                      let theguy = await this.users.fetch('${theuser.user.id}');
                      try{
                        await theguy.send("Your referral code was used! I was invited to ${theuser.guild.name}! Your account has been given 100 tokens.\nTotal uses: ${botlib.thousands(data.uses+1)}");
                      }catch(e){

                      }
                    })();
                    `, 0);
                  database.addTokens(theuser.user.id, 100);
                }
              });
          });
        });
      });
    });
  }else{
    res.redirect(`/added?guild_id=${req.query.guild_id}`);
  }
});

app.get('/invite', (req, res) => {
  return res.redirect("https://discord.com/api/oauth2/authorize?client_id=843137574536478731&permissions=238143552&redirect_uri=https%3A%2F%2Fhoneybot.xyz%2Fguild%2Fadded&response_type=code&scope=bot%20identify");
});

app.get('/support', (req, res) => {
  return res.redirect("https://discord.gg/7Wh6FVa7rT");
});

app.get('/eula', staticpage('eula'));

app.get('/:id', (req, res) => {
  var ref = req.params.id;
  database.db.serialize(function(){
    database.db.get("SELECT * FROM ref WHERE code = $1;", [ref], function(err, data){
      if(!data){
        return res.render('404');
      }
      req.session.ref = ref;
      return res.redirect("/invite");
    });
  });
});

app.listen(expressport, "0.0.0.0", function(){
  console.log(`Web server started at 0.0.0.0:${expressport}`);
});
