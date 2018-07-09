const userController = require('./../controllers/UserController');

const express         = require('express');
const router         = express.Router();

const passport         = require('passport');
const path              = require('path');
const base32 = require('thirty-two');
const crypto = require('crypto');
var sprintf = require('sprintf-js').sprintf;
var connection = require('./../models/database');




require('./../middleware/passport')(passport);



function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        console.log('authenticated');
        next();
    } else {
        console.log('notAuthenticated');
        res.redirect('/auth/users/login');
    }
}

router.get('/', isLoggedIn, ensureTotp, function(req, res) {
    res.redirect('/auth/totp-setup');
});

function ensureTotp(req, res, next) {
    console.log(req.session.method);
    if((req.user.authkey && req.session.method == 'totp') ||
        (!req.user.authkey && req.session.method == 'plain')) {
        next();
    } else {
        console.log('redirect to login');
        res.redirect('/auth/users/login');
    }
}

function ensureTwoFASession(req, res, next){
    console.log(req.session.ensuretwofasession);
    if(req.session.ensuretwofasession == 'totp'){
        next();
    } else {
        res.redirect('/auth/users/login');
    }
}

router.post('/users/login', passport.authenticate('local', {failWithError: true}),
    function(req, res) {
    console.log('user '+req.user.authkey);
    if(req.user.authkey) {
        req.session.method = 'totp';
        return res.status(200).send({result: 'redirect', url:'/auth/totp-input'});
        //res.redirect('/auth/totp-input');
    } else {
        req.session.method = 'plain';
        res.redirect('/auth/totp-setup');
    }
}, function(err, req, res, next) {
    if(req.body.email == '' && req.body.password == ''){
        return res.status(400).send({result: 'err', message: "Kullanıcı adı ve şifre boş."});
    } else if(req.body.email = ''){
        return res.status(400).send({result: 'err', message: "Kullanıcı adı boş."});
    } else if(req.body.password == '') {
        return res.status(400).send({result: 'err', message: "Şifre boş."});
    } else{
        return res.status(401).send({result: 'err', message: "Yanlış kullanıcı adı veya şifre."});
    }
    });

router.get('/users/login', function(req, res, next) {
    res.render('login', { title: 'Login' });
});

router.get('/totp-setup',
    isLoggedIn,
    ensureTotp,
    function(req, res) {

            req.session.method = 'totp';

            var secret = base32.encode(crypto.randomBytes(16));
            //Discard equal signs (part of base32,
            //not required by Google Authenticator)
            //Base32 encoding is required by Google Authenticator.
            //Other applications
            //may place other restrictions on the shared key format.
            secret = secret.toString().replace(/=/g, '');
            req.user.authkey = secret;


        var url = null;
        if(req.user.authkey) {
            var qrData = sprintf('otpauth://totp/%1$s?secret=%2$s',
                req.user.email, req.user.authkey);
            url = "https://chart.googleapis.com/chart?chs=166x166&chld=L|0&cht=qr&chl=" +
                qrData;
        }
        console.log(url);

        connection.query('UPDATE Users SET authkey = ? WHERE email = ?',[secret, req.user.email], function (err, result, fields) {
            if (err){
                res.send({
                    "code": 400,
                    "failed": "Database error"
                })
            };
            //console.log(result);
        });


        res.render('totp-setup', {
            user: req.user,
            qrUrl: url
        });
    }
);

router.post('/totp-setup',
    isLoggedIn,
    ensureTotp,
    function(req, res) {
        res.redirect('/auth/totp-input');
    });

router.get('/totp-input', isLoggedIn, function(req, res) {
    if(!req.user.authkey) {
        console.log("Logic error, totp-input requested with no key set");
        res.redirect('/auth/users/login');
    }
    res.render('totp-input');
});

router.post('/totp-input', isLoggedIn, passport.authenticate('totp', {
    failureRedirect: '/auth/totp-input'}),
    function(req, res){
        console.log('ensuresession');
        req.session.ensuretwofasession = 'totp';
        console.log(req.session.ensuretwofasession);
        res.redirect('/auth/hello');
    });

router.get('/hello', isLoggedIn, ensureTwoFASession,
    function(req, res){
        res.render('index', { title: req.user.email });
    });

router.post('/users/signup', userController.create, passport.authenticate('local', {failureRedirect: '/auth/users/signup'}),
    function(req, res) {
        console.log('user '+req.user.authkey);
        if(req.user.authkey) {
            req.session.method = 'totp';
            res.redirect('/auth/totp-input');
        } else {
            req.session.method = 'plain';
            res.redirect('/auth/totp-setup');
        }
    });

router.get('/users/signup', function (req, res) {
   res.render('signup');

});

router.get('/users/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/');
})


router.post('/users/checkemail', function (req, res){
    connection.query("SELECT * FROM Users WHERE email = ?",[req.body.email], function(err, rows) {
        if (err)
            return done(err);
        if (rows.length) {
            return res.status(400).send({
                result: 'err',
                message: "E-posta adresi kullanılmakta."
            });
        } else{
            return res.status(200).send({
                result: 'success',
                message: "Bu e-posta adresi kullanılabilir."
            });
        }
    });
});

module.exports = router;

