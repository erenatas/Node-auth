var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var TotpStrategy = require('passport-totp').Strategy;
var connection = require('./../models/database');
var bcrypt = require('bcrypt');
var base32 = require('thirty-two');


var keys = {};

function findKeyForUserId(id, fn) {
    return fn(null, keys[id]);
}

/*function saveKeyForUserId(id, key, fn) {
    keys[id] = key;
    return fn(null);
}*/

module.exports = function(passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        connection.query('SELECT * FROM Users WHERE id = ?', [id], function(err, rows) {
            done(err, rows[0]); //handle db conn failure here?
        });
    });

    // Local Strategy login
    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password',
        },
        function(username, password, done) {

        // Match Username
        let sql = 'SELECT * FROM Users WHERE email = ?';
        connection.query(sql, [username], function(err, rows) {
            console.log(rows);
            if (err)
                return done(err);
            if (!rows.length) {
                return done(null, false, {message: 'Wrong user or password'});
            }

            //  Match Password
            bcrypt.compare(password, rows[0].password, function(err, isMatch) {
                if(err)
                    return done(err);
                if(isMatch){
                    return done(null, rows[0]);
                } else {
                    return done(null, false, {message: 'Wrong user or password'});
                }
            });
        });
    }));

    passport.use(new TotpStrategy(
        function(user, done) {
            // setup function, supply key and period to done callback
            var key = user.authkey;
            console.log('passKey' + key);
            if(!key) {
                console.log('No key');
                return done(new Error('No key'));
            } else {
                console.log(base32.decode(key));
                return done(null, base32.decode(key), 30); //30 = valid key period
            }
        }
    ));
};