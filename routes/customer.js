const express = require("express");
const router = express.Router();

router.use("/auth",require("./customer/auth"));
router.use("/profile", require("./customer/profile"));

module.exports = router;