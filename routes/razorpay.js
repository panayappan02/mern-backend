const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const { razorpayPayment } = require("../controllers/razorpay");

router.post("/getPaymentOrder", razorpayPayment);

module.exports = router;
