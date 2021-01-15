const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// CONTROLLERS IMPORT
const {
  signup,
  signout,
  signin,
  isSignedIn,
  sendMail,
} = require("../controllers/auth");

router.post(
  "/signup",
  [
    check("name", "Username must be atleast 3 char").isLength({ min: 3 }),

    check("email", "Please Check Your E-mail").isEmail(),
    check("password", "Password should be atleast 6 char").isLength({ min: 6 }),
  ],
  sendMail
);

router.post("/email-activate", signup);

router.post(
  "/signin",
  [
    check("email", "Please Check Your E-mail").isEmail(),
    check("password", "Password check your password").isLength({ min: 6 }),
  ],
  signin
);

router.get("/signout", signout);

module.exports = router;
