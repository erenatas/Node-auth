var express = require('express');
var router = express.Router();
var auth = require('./auth');

/* GET users listing. */
router.get('/profile', auth.isLoggedIn, function(req, res, next) {

    res.render('auth-profile', {mailActivate: req.session.activated});
});

module.exports = router;
