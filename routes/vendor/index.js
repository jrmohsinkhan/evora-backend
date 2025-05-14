const express = require("express");
const router = express.Router();

// router.use("/reviews", require("./reviews"));
router.use("/hall", require("./hall"));
router.use("/car", require("./car"));
router.use("/catering", require("./catering"));
router.use("/auth",require("./auth"));
router.use("/profile", require("./profile"));
router.use("/decoration", require("./decoration"));
router.use("/booking", require("./booking"));
router.use("/services",require("./services"));

module.exports = router;
