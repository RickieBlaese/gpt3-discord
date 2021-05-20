var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data');
db.serialize(function(){
  db.run("CREATE TABLE purchases(id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT, userid TEXT, amount INT, done INT DEFAULT 0)", function(err){
    console.log(err);
    console.log("done (purchases)");
  });
  db.run("CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT, userid TEXT, perms int DEFAULT 0, credits int DEFAULT 0, premium int DEFAULT 0, tokens int DEFAULT 0, tokensgiventime int DEFAULT 0, tokensleft int DEFAULT 0, banned int DEFAULT 0, eula int DEFAULT 0)", function(err){
    console.log(err);
    console.log("done (users)");
  });
  db.run("CREATE TABLE messages(id INTEGER PRIMARY KEY AUTOINCREMENT, userid TEXT, question TEXT, answer TEXT, time INT)", function(err){
    console.log(err);
    console.log("done (messages)");
  });
  db.run("CREATE TABLE ref(id INTEGER PRIMARY KEY AUTOINCREMENT, userid TEXT, code TEXT, uses INT)", function(err){
    console.log(err);
    console.log("done (ref)");
  });
  db.run("CREATE TABLE servers(id INTEGER PRIMARY KEY AUTOINCREMENT, serverid TEXT, time INT)", function(err){
    console.log(err);
    console.log("done (servers)");
  });
});
