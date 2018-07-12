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
            console.log(err);
        }

        if(data === null){
            connection.query("SELECT * FROM Users WHERE email = ?",[req.body.email], function(err, rows) {
                if (err)
                    return done(err);
                if (rows.length) {
                    res.render('login');
                    //let rand = Math.floor((Math.random() * 100) + 54);
                    let encodedMail = new Buffer(req.body.email).toString('base64');
                    //let link="http://"+req.get('host')+"/verify?mail="+encodedMail+"&id="+rand;
                    let link="http://"+req.get('host')+"/auth/verify?mail="+encodedMail;

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
                }
            });
        }
    });

};



module.exports.sendEmailVerification = sendEmailVerification;



let verifyEmail = async function(req, res, next){
    console.log(req.query);
    var email = Buffer.from(req.query.mail, 'base64').toString('ascii');
    console.log(email);
    redisClient.get(email,function(err,reply) {
        if (err) {
            console.log('errorAA' + err);
            res.redirect('/404');
        }
        if (reply === null) {
            console.log('verifyEmail email null');
            res.redirect('/404');
        }
        if (reply === req.query.mail){
            connection.query("SELECT activation FROM Users WHERE email = ?",[email], function(err, rows) {
                if(err){
                    console.log(err);
                }
                if(rows.length){
                    console.log(rows);
                    connection.query("UPDATE Users SET activation = ? WHERE email = ?", ['1', email], function (err) {
                        if(err){
                            console.log(err);
                        }
                    });
                    redisClient.del(email, function(err,reply) {
                        if(!err) {
                            if(reply === 1) {
                                console.log("Key is deleted");
                            } else {
                                console.log("Does't exists");
                            }
                        }});
                }
            });
        }
    });
    res.redirect('/auth/users/login');
};

module.exports.verifyEmail = verifyEmail;

