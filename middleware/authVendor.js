const jwt = require("jsonwebtoken");
const Vendor = require("../models/vendor");

const authVendor = async (req, res, next) => {
  const token = req.cookies.token_vendor;
  if (!token) {
    console.log("No token, authorization denied");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const vendor = await Vendor.findById(decoded.id).select("-password");

    if (!vendor) {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    req.vendor = vendor;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ msg: "Invalid token" });
  }
};

module.exports = authVendor;
