var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data');
const config = require('../config.json');
const stripe = require('stripe')(config.stripe.live.secretkey);

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

function refreshTokens(userid) {
	return new Promise((resolve, reject) => {
		getUser(userid).then(user=>{
			db.serialize(function(){
				db.run("UPDATE users SET tokensleft = $1, tokensgiventime = $2 WHERE id = $3", [config.dailytokens, new Date().getTime(), user.id], function(err){
					if(err){
						return reject(err);
					}
					getUser(userid).then(newuser=>{
						resolve(newuser);
					});
				});
			});
		});
	});
}

function getTokens(userid) {
	return new Promise((resolve, reject) => {
		getUser(userid).then(user=>{
			if(user.tokensgiventime < new Date().getTime()-86400000 && user.tokensleft < config.dailytokens){
				refreshTokens(userid).then(newuser=>{
					resolve(newuser.tokensleft);
				});
			}else{
				resolve(user.tokensleft);
			}
		});
	});
}

function addMessage(q, a, userid){
	return new Promise((resolve, reject) => {
		db.serialize(function(){
			db.run("INSERT INTO messages(userid, question, answer, time) VALUES($1, $2, $3, $4)", [userid, q, a, new Date().getTime()], function(err){
				if(err){
					return reject(err);
				}
				resolve();
			});
		});
	});
}

function moreTokens(amount, userid){
	return new Promise((resolve, reject)=>{
		var botlib = require('./lib');
		stripe.checkout.sessions.create({
	    success_url: 'https://solithcy.xyz/gpt3/callback?session_id={CHECKOUT_SESSION_ID}',
	    cancel_url: 'https://solithcy.xyz/gpt3',
	    payment_method_types: ['card'],
	    line_items: [
				{
					price_data: {
          	currency: 'gbp',
          	product_data: {
            	name: `${botlib.thousands(amount)} tokens`,
          	},
          	unit_amount: Math.ceil((config.tokenprice*100)*amount),
        	},
        	quantity: 1,
      },
	    ],
	    mode: 'payment',
	    allow_promotion_codes: true,
	  })
	  .then(session => {
			getUser(userid).then(user=>{
				db.serialize(function(){
					db.run("INSERT INTO purchases(token, userid, amount) VALUES($1, $2, $3)", [session.id, userid, amount], function(err){
						if(err){
							return reject(err);
						}
						resolve(session);
					})
				});
			})
	  });
	});
}

function validatePurchase(sessionkey, userid){
	return new Promise((resolve, reject)=>{
		sessionkey = new Buffer.from(sessionkey, 'base64');
		sessionkey = sessionkey.toString('ascii');
		db.serialize(function(){
			db.get("SELECT * FROM purchases WHERE token = $1 AND done = 0", [sessionkey], function(err, data){
				if(!data){
					return reject({code: 1});
				}
				if(data.userid != userid){
					console.log(data);
					console.log(data.userid);
					console.log(userid);
					return reject({code: 1});
				}
				stripe.checkout.sessions.retrieve(sessionkey)
				.then(session => {
					if(!session.customer){
						return reject({code: 0});
					}
					db.run("UPDATE purchases SET done = 1 WHERE id = $1", [data.id], function(err){
						if(err){
							return reject(err);
						}
						addTokens(userid, data.amount).then(tokens=>{
							resolve({amount:data.amount});
						}).catch(console.error);
					});
				});
			});
		});
	});
}

function addTokens(userid, tokens) {
	return new Promise((resolve, reject) => {
		getUser(userid).then(user=>{
			db.serialize(function(){
				db.run("UPDATE users SET tokensleft = tokensleft + $1 WHERE id = $2", [tokens, user.id], function(err){
					if(err){
						return reject(err);
					}
					getUser(userid).then(resolve).catch(reject);
				});
			});
		});
	});
}

function getMessages(userid, limit = 2, time = 6000){
	return new Promise((resolve, reject) =>{
		db.serialize(function(){
			db.all("SELECT * FROM messages WHERE userid = $1 AND time < $2 ORDER BY id desc LIMIT $3", [userid, new Date().getTime() - time, limit], function(err, data){
				if(err){
					return reject(err);
				}
				resolve(data);
			})
		});
	});
}

function takeTokens(userid, tokens) {
	return new Promise((resolve, reject) => {
		getUser(userid).then(user=>{
			db.serialize(function(){
				db.run("UPDATE users SET tokens = tokens + $1, tokensleft = tokensleft - $1 WHERE id = $2", [tokens, user.id], function(err){
					if(err){
						return reject(err);
					}
					getUser(userid).then(resolve).catch(reject);
				});
			});
		});
	});
}

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
	getTokens: getTokens,
	takeTokens: takeTokens,
	addTokens: addTokens,
	getMessages: getMessages,
	addMessage: addMessage,
	validatePurchase: validatePurchase,
	moreTokens: moreTokens
};
