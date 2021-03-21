var crypto = require('crypto');
var sqlite3 = require('better-sqlite3');

var path = require('path');
const { debugPort } = require('process');
var db = new sqlite3('./resources/mydb.db');
db.pragma("foreign_keys = ON");

var salt = "bolierplate-salt";


function hashPassword(password) {
    var hash = crypto.createHash('sha256');
    hash.update(password);
    hash.update(salt);
    return hash.digest('hex');
}

function authenticateUser(username, password, callback=console.log) {
    var hashed = hashPassword(password);
    db.prepare("select * from v_userinfo where (lower(username)=lower(?) or lower(email)=lower(?)) and password=?").get(username,username, hashed);
    const row=db.prepare("select * from v_userinfo where (lower(username)=lower(?) or lower(email)=lower(?)) and password=?").get(username,username, hashed);
        if (!row) {
            callback(false);
        } else {
            callback(true, row.userid);
        }
}


function createUser(username, callback=console.log) {
    try {
        const res = db.prepare("insert into users(username) values(?)").run(username);
        callback(true, res.lastInsertRowid, null);
    } catch (err) {
        callback(false, -1, err);
    }

}


function updateUserInfo(userid, userprops, callback=console.log) {
    userprops.userid = userid;
    if (userprops.password) {
        userprops.password = hashPassword(userprops.password);
    } else {
        userprops.password=null;
    }

    let sql = "INSERT INTO userinfo(userid,password,email,phonenr,name,sendremainder) VALUES(@userid,@password,@email,@phonenr,@name,@sendremainder)\
        ON CONFLICT(userid) DO UPDATE SET password=coalesce(excluded.password,password),email=excluded.email,phonenr=excluded.phonenr,name=excluded.name,sendremainder=excluded.sendremainder";

    try {
        const res = db.prepare(sql).run(userprops);
        callback(true, null);
    } catch (err) {
        callback(false, err);
    }    
}



function getUserInfo(userId, callback=console.log) {
    const row = db.prepare('SELECT * FROM v_userinfo WHERE userid = ?').get(userId);   
    if (row !== undefined) {
        delete row.password;
        callback(true, row);
    } else {
        callback(false);
    }
}

function getUserInfoByUserNameOrEmailOrPhone(userName,email,phonenr, callback=console.log) {
    email=(email===""?undefined:email);
    phonenr=(phonenr===""?undefined:phonenr);
    const row=db.prepare('SELECT distinct * FROM v_userinfo WHERE lower(username)=lower(?) or lower(email) = lower(?) or phonenr=?').get(userName, email,phonenr);
    if(row!==undefined) {
        delete row.password;
        callback(true, row);
    } else {
        callback(false);
    }
 
}




function createPassWordResetToken(userId, callback=console.log) {
    var token = new Date().getTime() + "" + Math.floor(Math.random() * Math.floor(1000));
    var sql = "INSERT INTO password_reset_tokens(userid,token) VALUES(?,?)\
    ON CONFLICT(userid) DO UPDATE SET token=excluded.token,created=CURRENT_TIMESTAMP";
    try {
        db.prepare(sql).run(userId, token);
        callback(true, token);
    } catch (err) {
        callback(false, err);
    }
}





function resetPassword(token, password, callback=console.log) {
    try {
    db.transaction(()=>{
        var sql = "select userid from password_reset_tokens where token=?";
        var row=db.prepare(sql).get(token);
        if(row!==undefined) {
            var userid = row.userid;
            password = hashPassword(password);
            sql = "update userinfo set password=? where userid=?";
            db.prepare(sql).run(password,userid);
            sql="delete from password_reset_tokens where token=?";
            db.prepare(sql).run(token);
            callback(true,userid);
        } else {
            callback(false);
        }

    })();
    } catch(err) {
        callback(false, err);
    }
}



function getDbInstance() {
    return db;
}


module.exports = {
    createUser: createUser,
    authenticateUser: authenticateUser,
    updateUserInfo: updateUserInfo,
    getUserInfo:getUserInfo,

    getUserInfoByUserNameOrEmailOrPhone:getUserInfoByUserNameOrEmailOrPhone,
    createPassWordResetToken:createPassWordResetToken,
    resetPassword:resetPassword,
    getDbInstance:getDbInstance
}

