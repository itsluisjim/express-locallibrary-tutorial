const passport = require("passport");
var app = require("../app");
const User = require("../models/user");
const LocalStrategy = require("passport-local").Strategy;
const validPassword = require("../lib/passwordUtils").validPassword;

require("./connection");

const verifyCallback = async (username, password, done) => {
  const user = await User.findOne({ username: username }).exec();

  if (!user) {
    return done(null, false);
  }

  const isValid = validPassword(password, user.hash, user.salt);

  if (isValid) {
    return done(null, user);
  } else {
    return done(null, false);
  }
};

const strategy = new LocalStrategy(verifyCallback);

passport.use(strategy);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (userId, done) => {  
  const user = await User.findById(userId).exec();

  if(user){
    done(null, user);
  } else {
    done(null, false);
  }
});
