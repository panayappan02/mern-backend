const User = require("../models/user");
const { check, validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const expressJwt = require("express-jwt");
const nodemailer = require("nodemailer");

exports.sendMail = (req, res) => {
  const { name, email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: errors.array()[0].msg,
      param: errors.array()[0].param,
    });
  }

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const verifyToken = jwt.sign(
    { name, email, password },
    process.env.VERIFYSECRET,
    { expiresIn: "20m" }
  );

  const data = {
    from: "17euit100@skcet.ac.in",
    to: email,
    subject: "Account Activation Link",
    text: "Verify your E-mail",
    html: `
    <h3>Please Click on a given link to activate your account</h3>
    <a href="http://localhost:3000/email-verify/${verifyToken}">http://localhost:3000/email-verify/${verifyToken}</a>
    `,
  };

  transporter.sendMail(data, (err, data) => {
    if (err) {
      return res.json({
        error: err.message,
      });
    } else {
      res.json({ message: "Email Sent Kindly Activate Your Account" });
    }
  });
};

exports.signup = (req, res) => {
  const { verifyToken } = req.body;

  if (verifyToken) {
    jwt.verify(verifyToken, process.env.VERIFYSECRET, (err, decodedToken) => {
      if (err) {
        return res.status(400).json({
          error: "Incorrect or Expired Link",
        });
      }

      const { name, email, password } = decodedToken;

      const user = new User({ name, email, password });

      user.save((err, user) => {
        if (err) {
          return res.status(400).json({
            error: "NOT ABLE TO SAVE USER IN DB",
          });
        }

        res.json({
          name: user.name,
          email: user.email,
          id: user._id,
        });
      });
    });
  } else {
    return res.json({
      error: "Something Went Wrong",
    });
  }
};

exports.signin = (req, res) => {
  const { email, password } = req.body;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
      param: errors.array()[0].param,
    });
  }

  User.findOne({ email }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User with this email does not exist",
      });
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: "email and password do not match",
      });
    }

    // CREATE TOKEN
    const token = jwt.sign({ _id: user._id }, process.env.SECRET);

    // PUT TOKEN IN COOKIE
    res.cookie("token", token, { expire: new Date() + 9999 });

    // SEND RESPONSE TO FRONT END
    const { _id, name, email, role } = user;

    return res.json({
      token,
      user: {
        _id,
        name,
        email,
        role,
      },
    });
  });
};

exports.signout = (req, res) => {
  res.clearCookie("token");

  return res.json({
    message: "User Signout",
  });
};

// PROTECTED ROUTE

exports.isSignedIn = expressJwt({
  secret: process.env.SECRET,
  userProperty: "auth",
});

//CUSTOM  MIDDLEWARES
exports.isAuthenticated = (req, res, next) => {
  let checker = req.profile && req.auth && req.profile._id == req.auth._id;

  if (!checker) {
    return res.status(403).json({
      error: "ACCESS DENIED",
    });
  }

  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.profile.role === 0) {
    return res.status(403).json({
      error: "You are not Admin,Access Denied",
    });
  }

  next();
};
