var express = require('express');
var router = express.Router();
var auth = require('./auth');
var emailController = require('./../controllers/emailController');

/* GET users listing. */
router.get('/profile', auth.isLoggedIn, emailController.emailVerifySession, function(req, res, next) {
    res.render('auth-profile', {mailActivate: req.session.activated});
});

module.exports = router;
