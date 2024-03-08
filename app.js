var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");
const MongoStore = require('connect-mongo')
const passport = require('passport')
const session = require('express-session');

var indexRouter = require('./routes/index');
const catalogRouter = require("./routes/catalog");
const authRouter = require('./routes/auth')

require('dotenv').config();


var app = express();

require('./config/connection');

const sessionStore = MongoStore.create({mongoUrl: process.env.DB_URL, collectionName: 'sessions'});

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  store: sessionStore,
  cookie: {
      maxAge: 1000 * 60 * 60 * 24 // Equals 1 day (1 day * 24 hr/1 day * 60 min/1 hr * 60 sec/1 min * 1000 ms / 1 sec)
  }
}));

require('./config/passport');

app.use(passport.initialize());
app.use(passport.session());

app.use(compression());
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      "script-src": ["'self'", "https://kit.fontawesome.com"],
      "connect-src": ["'self'", "https://kit.fontawesome.com", "https://ka-f.fontawesome.com"]
    },
  }),
);

// for dev (prevents http request from being upgraded to https)
// app.use(
//   helmet({
//     contentSecurityPolicy: false,
//   })
// );
app.use(limiter);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

app.use('/', indexRouter);
app.use('/catalog', catalogRouter);
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
