var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data');
db.serialize(function(){
  db.run("CREATE TABLE users(id INTEGER PRIMARY KEY AUTOINCREMENT, userid TEXT, perms int DEFAULT 0, credits int DEFAULT 0, premium int DEFAULT 0, tokens int DEFAULT 0, tokensgiventime int DEFAULT 0, tokensleft int DEFAULT 0)", function(err){
    console.log(err);
    console.log("done");
  });
});
