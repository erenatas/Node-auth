var connection = require('./../models/database');
var bcrypt     = require('bcrypt');
const passport         = require('passport');
require('./../middleware/passport')(passport);


const create = async function(req, res, next) {
    var today = new Date();

    connection.query("SELECT * FROM Users WHERE email = ?",[req.body.email], function(err, rows) {
        if (err)
            return done(err);
        if (rows.length) {
            return res.status(400).send({
                result: 'err',
                message: "email has already taken"
            })
        }
        else if(req.body.email == null){
            return res.status(400).send({
                result: 'err',
                message: "email cannot be empty"
            })
        }
        else if(req.body.password == null){
            return res.status(400).send({
                result: 'err',
                message: "password cannot be empty"
            })
        }
        else if(req.body.first == null){
            return res.status(400).send({
                result: 'err',
                message: "first name cannot be empty"
            })
        }
        else if(req.body.last == null){
            return res.status(400).send({
                result: 'err',
                message: "last name cannot be empty"
            })
        }
        else if(req.body.password != req.body.passwordrepeat){
            return res.status(400).send({
                result: 'err',
                message: "passwords do not match."
            })
        }
            else {
            var insertQuery = "INSERT INTO Users ( email, password, first, last, phone, createdAt, updatedAt) values (?,?,?,?,?,?,?)";

            const saltRounds = 10;
            var hashpw;

            bcrypt.genSalt(saltRounds, function(err, salt) {
                bcrypt.hash(req.body.password, salt, function(err, hash) {
                    connection.query(insertQuery,[req.body.email, hash, req.body.first, req.body.last, req.body.phone, today, today]);
                    console.log('success signup');
                    next();
                });
            });

        }
    });
};

module.exports.create = create;


/*
const login = async function(req, res){
    const body = req.body;
    let err, user;

    connection.query('SELECT * FROM Users WHERE email = ?',[body.email], function (error, results, fields) {
        if (error) {
            res.send({
                "code":400,
                "failed": 'error'
            })
        }else{
            if(results.length >0){
                if(results[0].password == body.password){
                   res.send({
                        "code":200,
                        "success":"login successful"
                    });
                    res.render('')
                }
                else{
                    res.send({
                        "code":204,
                        "success":"Email or password does not match"
                    });
                }
            }
            else{
                res.send({
                    "code":204,
                    "success":"Email does not exits"
                });
            }
        }
    });
    if(err) return ReE(res, err, 422);

    //res.cookie('auth',user.getJWT(), { expires: new Date(Date.now() + 900000), httpOnly: true, secure: true });


    //return ReS(res, {token:user.getJWT(), user:user.toWeb()});
}
module.exports.login = login;

*/