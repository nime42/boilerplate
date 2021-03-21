var fs = require('fs');
var http = require('http');
var https = require('https');
var db=require('./db/dbFunctions.js');
var mailSender=require('./utils/mailSender.js');
var sessionHandler=require('./utils/sessionHandler.js');

require('log-timestamp');

sessionHandler.resumeSessions(db.getDbInstance());


var config=require('../resources/config.js');


var privateKey  = fs.readFileSync(config.certs.privateKey, 'utf8');
var certificate = fs.readFileSync(config.certs.certificate, 'utf8');
var ca = fs.readFileSync(config.certs.ca, 'utf8');

var credentials = {key: privateKey, cert: certificate,ca:ca};
var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies


const cookieParser = require('cookie-parser');
app.use(cookieParser());


app.use((req, res, next) => {

    if(req.url.startsWith("/.well-known/pki-validation")) {
        next();
        return;
    }



    if (!req.headers.host) {
        res.sendStatus(406);
        return;
    }

    if (req.headers.host.indexOf('localhost') > -1 || req.secure) {
        next()
    } else {
        res.redirect('https://' + req.headers.host + req.url);
    }

}); 



app.use((req,res,next)=>{
    if(sessionHandler.getSession(req)) {
        next();
        return;
    }

 
    if(
        req.url.startsWith("/handlebars") || 
        req.url.startsWith("/.well-known") ||
        req.url.startsWith("/js") || 
        req.url.startsWith("/css") ||
        req.url.startsWith("/img") ||
        req.url.startsWith("/favicon.ico") ||   
        req.url.startsWith("/main.html") ||
        req.url.startsWith("/login") ||
        req.url.startsWith("/register") ||
        req.url.startsWith("/forgotPassword") ||
        req.url.startsWith("/resetPassword") ||
        req.url.startsWith("/shutdown")
    ) {
        next();
        return;
    }

    res.redirect('/main.html');

    });






app.enable("trust proxy"); //So Morgan logging displays remote-address


//---------------------------
var morgan = require('morgan')
var path = require('path')
var rfs = require('rotating-file-stream') // version 2.x

morgan.token('remote-user', function (req, res) { let session=sessionHandler.getSession(req); if(session) {return session.userId} else {return ""}});

// create a rotating write stream
var accessLogStream = rfs.createStream('access.log', {
    interval: '7d', // rotate daily
    path: path.join('log')
  })
  
  // setup the logger
  app.use(morgan('common', { stream: accessLogStream }))
  
  app.use(express.static('public'))


//---------------------------



app.get("/shutdown",(req,res) => {
    var isLocal = (req.connection.localAddress === req.connection.remoteAddress);
    if(isLocal) {
        console.log("Shutting down!");
        res.sendStatus(200);
        try {
            sessionHandler.saveSessions(db.getDbInstance(),function(err) {process.exit()});
        } catch(e) {
            console.log("Failed to save sessions",e);
            process.exit();
        }
    }

})


 
app.get('/', (req, res) => {
    res.redirect('/main.html');
       
})

app.post('/login',(req,res)=> {
    var username = req.body.username;
    var password = req.body.password;
    db.authenticateUser(username,password,function(status,userId){
        if(status) {
            sessionHandler.addSession(req,res,userId);
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    });
})


app.get('/logout',(req,res)=> {
    sessionHandler.invalidateSession(req,res);
    res.sendStatus(200);
})

app.post('/register',(req,res)=> {
    var username = req.body.username;
    try {
        db.getDbInstance().transaction(() => {
            db.createUser(username, function (status, id, err) {
                if (status) {
                    db.updateUserInfo(id, req.body, function (status, err) {
                        if (status) {
                            sessionHandler.addSession(req, res, id);
                            res.sendStatus(200);
                        } else {
                            res.sendStatus(500);
                            throw "rollback";
                        }
                    })
                } else {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        res.sendStatus(403);
                    } else {
                        res.sendStatus(500);
                    }
                }
            });


        })();
    } catch (err) {
        if (err !== "rollback") {
            console.log("register",err);
        }
    }

})

app.post('/forgotPassword',(req,res)=> {
    var email,userName;

    if(req.body.identityType==="by-mail-adress") {
        email=req.body.identity;
    } else {
        userName=req.body.identity;
    }    

    db.getUserInfoByUserNameOrEmailOrPhone(userName,email,null,function(status,row) {
        if(status) {
            if(row.length===0) {
                res.sendStatus(404);
                return;
            } else {
                var userId=row.userid;
                var mailAdr=row.email;
                mailSender.sendPasswordReset(userId,mailAdr,req,res);
            }
        } else {
            res.sendStatus(500);
        }
    })

});


app.post('/resetPassword', (req, res) => {
    var token = req.body.resetToken;
    var password = req.body.password;
    db.resetPassword(token, password, function (status, userIdOrErr) {
        if(status) {
            sessionHandler.addSession(req,res,userIdOrErr);
            res.sendStatus(200);
        } else {
            if(userIdOrErr) {
                console.log("Failed to resetPassword",userIdOrErr);
                res.sendStatus(500);
            } else {
                res.sendStatus(404);  
            }
        }
    });

})


app.get('/getUserInfo',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;
    db.getUserInfo(userId,function(status,userInfo){
        if(status) { 
            res.json(userInfo); 
        } else {
            console.log('getUserInfo',userInfo);
            res.sendStatus(404);  

        }
    })

})


app.post('/updateUserInfo',(req,res)=> {
    var userId=sessionHandler.getSession(req).userId;

    db.updateUserInfo(userId,req.body, function(status,err) {
        if(status) {
            res.sendStatus(200);                    
        } else {
            console.log("updateUserInfo",err);
            res.sendStatus(500);
        }
    })

})

process.on('SIGINT', function(e) {
    console.log("exit");
    sessionHandler.saveSessions(db.getDbInstance(),function(err) {process.exit()});
});



var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

httpServer.listen(config.app.http,() => console.log('App listening at http://localhost:'+config.app.http));
httpsServer.listen(config.app.https,() => console.log('App listening at https://localhost:'+config.app.https));

