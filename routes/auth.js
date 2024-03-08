const express = require("express");
const router = express.Router();
const passport = require('passport');

require("../config/connection")

const auth_controller = require("../controllers/authController");

router.get('/', auth_controller.user_auth_options);

router.get('/signup', auth_controller.user_create_get);
router.post('/signup', auth_controller.user_create_post);

router.get('/login', auth_controller.user_login_get);
router.post('/login', passport.authenticate('local', { failureRedirect: '/auth/login', successRedirect: '/catalog' }));


// Visiting this route logs the user out
router.get('/logout', auth_controller.user_logout);

module.exports = router;