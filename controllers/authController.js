const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const genPassword = require("../lib/passwordUtils").genPassword;
require('dotenv').config();

require("../config/connection");

exports.user_auth_options = (req, res, next) => {
  res.redirect('/auth/login');
};

exports.user_create_get = (req, res, next) => {
  res.render("sign_up_form", {
    title: "Signup",
    errors: [],
  });
};

exports.user_create_post = [
  body("username")
    .trim()
    .isLength({ min: 8 })
    .escape()
    .withMessage("Username must be longer than 8 characters.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("password")
    .trim()
    .isLength({ min: 8 })
    .escape()
    .matches(/^(?=.*[A-Z])/)
    .withMessage("Username must have an uppercase letter.")
    .matches(/^(?=.*[a-z])/)
    .withMessage("Password must have a lowercase letter.")
    .matches(/^(?=.*\d)/)
    .withMessage("Password must have at least one digit.")
    .matches(/^(?=.*[!@#$%])/)
    .withMessage(
      "Password must have at least one of the following symbols (!,@,#,$,%)"
    ),
  body('admincode')
  .optional({values: "falsy"})
  .trim()
  .escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("sign_up_form", {
        title: "Create Account",
        errors: errors.array(),
      });
    } else {
      const usernameExists = await User.findOne({ username: req.body.username })
        .collation({ locale: "en", strength: 2 })
        .exec();

      if (usernameExists) {

        errors.errors.push({msg: 'Username is taken!'});

        return res.render("sign_up_form", {
            title: "Create Account",
            errors: errors.array(),
          })
      } else {
        const saltHash = genPassword(req.body.password);

        const salt = saltHash.salt;
        const hash = saltHash.hash;

        const isValidAdminCode = req.body.admincode === process.env.ADMIN_CODE? true : false;

        const newUser = new User({
          username: req.body.username,
          hash: hash,
          salt: salt,
          admin: isValidAdminCode,
        });

        await newUser.save();
        req.login(newUser, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect("/catalog");
        });
      }
    }
  }),
];

exports.user_login_get = (req, res, next) => {
  res.render("login_form", {
    title: "Login",
    errors: [],
  });
};

exports.user_logout = (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/auth");
  });
};
