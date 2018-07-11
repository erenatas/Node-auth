var nodemailer  = require("nodemailer");
var redisClient = require("redis").createClient(6379, '127.0.0.1');
var connection = require('./../models/database');


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'denemenode@gmail.com',
        pass: '123'
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
                    //let rand = Math.floor((Math.random() * 100) + 54);
                    let encodedMail = new Buffer(req.body.email).toString('base64');
                    //let link="http://"+req.get('host')+"/verify?mail="+encodedMail+"&id="+rand;
                    let link="http://"+req.get('host')+"/verify?mail="+encodedMail;

                    const mailOptions = {
                        from: 'denemenode@gmail.com', // sender address
                        to: req.body.email, // list of receivers
                        subject: 'Subject of your email', // Subject line
                        html: '<p>Your html here</p><a href='+link+'>Click here to verify</a>'// plain text body
                    };

                    console.log(link);


                    transporter.sendMail(mailOptions, function (err, info) {
                        if(err)
                            console.log(err);
                        else
                            console.log(info);
                    });


                    //console.log("Message sent: " + JSON.stringify(response));
                    // Adding hash key.
                    redisClient.set(req.body.email,encodedMail, 'EX', 600);
                }});
        }
        next();
    });
};



module.exports.sendEmailVerification = sendEmailVerification;



let verifyEmail = async function(req, res, next){
    var url = req.query.size === 'mail';
    redisClient.get(url,function(err,reply) {
        if (err) {
            return callback(true, "Error in redis");
        }
        if (reply === null) {
            return callback(true, "Invalid email address");
        }
    });
};

