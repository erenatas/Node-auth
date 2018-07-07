var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var session = require('express-session');
var _myRedis = require('redis');                           // additional redis store
var myRedisCli = _myRedis.createClient();
var RedisStore = require('connect-redis')(session);
var flash = require('express-flash-messages');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var authRouter  = require('./routes/auth');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(flash());


/*app.use(session({ secret: 'erensecret',
    resave: false,
    saveUninitialized: true,
    cookie: {}}));*/

app.use(session({
    store: new RedisStore({
        client: myRedisCli,
        host: '127.0.0.1',
        port: 6379,
        ttl: 60,
        rolling: true
    }),
    secret: 'keyboard cat',
    resave: true
}));


app.use(passport.initialize());
app.use(passport.session());



app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;