// routes/payment.js

const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payment/create-checkout-session
router.post("/create-checkout-session", async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd", // or 'pkr'
            product_data: {
              name: "Service Booking",
            },
            unit_amount: amount * 100, // Convert to smallest unit (cents/paisa)
          },
          quantity: 1,
        },
      ],
      success_url: "https://evora-backend.onrender.com/",
      cancel_url: "https://evora-backend.onrender.com/cancel",
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    res.status(500).json({ error: "Checkout session creation failed" });
  }
});

module.exports = router;
