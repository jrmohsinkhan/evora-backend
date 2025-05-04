const express = require("express");
const router = express.Router();

// router.use("/reviews", require("./reviews"));
router.use("/hall", require("./hall"));
router.use("/car", require("./car"));
router.use("/catering", require("./catering"));
router.use("/auth",require("./vendor/auth"));
router.use("/profile", require("./vendor/profile"));

module.exports = router;
