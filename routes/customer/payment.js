// routes/payment.js

const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payment/create-payment-intent
router.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // convert to cents if using USD
      currency: "usd", // or your desired currency like 'pkr'
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Payment initiation failed" });
  }
});

module.exports = router;
