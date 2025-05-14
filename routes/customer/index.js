const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/profile", require("./profile"));
router.use("/booking", require("./booking"));
router.use("/payment", require("./payment"));

module.exports = router;
