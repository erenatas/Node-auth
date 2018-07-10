var nodemailer  = require("nodemailer");
var redisClient = require("redis").createClient(6379, '127.0.0.1');
var connection = require('./../models/database');


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'youremail@address.com',
        pass: 'yourpassword'
    }
});

let sendEmailVerification = async function(req, res, next){
    console.log(req.body.email);

    redisClient.get(req.body.email, function (err, data) {
        if(err){
            //handle error
        }

        if(data === null){
            connection.query("SELECT * FROM Users WHERE email = ?",[req.body.email], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    let rand = Math.floor((Math.random() * 100) + 54);
                    let encodedMail = new Buffer(req.body.email).toString('base64');
                    let link="http://"+req.get('host')+"/verify?mail="+encodedMail+"&id="+rand;

                    const mailOptions = {
                        from: 'sender@email.com', // sender address
                        to: 'to@email.com', // list of receivers
                        subject: 'Subject of your email', // Subject line
                        html: '<p>Your html here</p><a href='+link+'>Click here to verify</a>'// plain text body
                    };

                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err)
                            console.log(err);
                        else
                            console.log(info);
                    });

                    console.log("Message sent: " + JSON.stringify(response));
                    // Adding hash key.
                    redisClient.set(req.body.email,link, 'EX', 600);
                }});
        }
    });
};



