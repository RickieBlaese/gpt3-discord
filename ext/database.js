var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data');

function getUser(userid) {
	return new Promise((resolve, reject) => {
    db.serialize(function(){
      db.get("SELECT * FROM users WHERE userid = $1", [userid], function(err, user){
        if(user){
          return resolve(user);
        }
        createUser(userid).then(user=>{
          resolve(user);
        }).catch(reject);
      });
    });
  });
};

function createUser(userid) {
	return new Promise((resolve, reject) => {
    db.serialize(function(){
      db.run("INSERT INTO users(userid) VALUES($1)", [userid], function(err){
        if(err){
          return reject(err);
        }
        getUser(userid).then(resolve).catch(reject);
      });
    });
  });
};

function isAdmin(userid) {
	return new Promise((resolve, reject) => {
    getUser(userid).then(user=>{
      if(user.perms>=3){
        return resolve(true);
      }
      resolve(false);
    });
  });
};

module.exports = {
  db: db,
  getUser: getUser,
  createUser: createUser,
  isAdmin: isAdmin,
};
