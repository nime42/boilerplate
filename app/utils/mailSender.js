var nodemailer = require('nodemailer');

var db=require('../db/dbFunctions.js');

var config=require('../../resources/config.js');



var transporter = nodemailer.createTransport({
    service: config.mail.service,//smtp.gmail.com  //in place of service use host...
    secure: false,//true
    port: config.mail.port,//465
    tls: {
        rejectUnauthorized: false
    },
    auth: {
      user: config.mail.user,
      pass: config.mail.passwd
    }

  });
  

function sendMail(from,to,cc,subject,text,html, callback) {
    var mailOptions = {
        from: from,
        to: to,
        cc:cc,
        subject: subject,
        text: text,
        html:html
      };
      console.log("Sending mail with subject '"+mailOptions.subject+"' to "+mailOptions.to);
      transporter.sendMail(mailOptions, callback);      
}


function sendPasswordReset(userId,mailadress,req,res,callback) {
    db.createPassWordResetToken(userId,function(status,token) {
        if(status) {
            var resetLink = req.protocol + '://' + req.get('host') +"/main.html?reset-token="+token;
            var from="tipsy.nu@gmail.com";
            var to=mailadress;
            var subject="Uppdatera lösenord";
            var message="Hej!\nAnvänd nedanstående länk för att återställa dit lösenord på tipsy.nu:\n"+resetLink+"\n"
            sendMail(from,to,undefined,subject,message,undefined, function(err) {
                if(err!==null) {
                    res.sendStatus(500);
                } else {
                    res.sendStatus(200);          
                }
            });
        } else {
            res.sendStatus(500);
        }

    });

} 






module.exports = {
    sendMail:sendMail,
    sendPasswordReset:sendPasswordReset
}