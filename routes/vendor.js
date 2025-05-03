const express = require("express");
const router = express.Router();

// router.use("/reviews", require("./reviews"));
router.use("/hall", require("./hall"));
router.use("/car", require("./car"));
router.use("/catering", require("./catering"));

module.exports = router;
