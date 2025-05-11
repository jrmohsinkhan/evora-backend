const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");

const authCustomer = async (req, res, next) => {
  const token = req.cookies.token_customer;
  console.log(token);
  console.log(req.cookies);
  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id).select("-password");

    if (!customer) {
      return res.status(404).json({ msg: "Customer not found" });
    }

    req.customer = customer;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = authCustomer;
