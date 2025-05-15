const express = require("express");
const connectDB = require("./config/db");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json({ limit: "5mb" }));       // For JSON payloads
app.use(express.urlencoded({ limit: "5mb", extended: true })); // For form data
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:8081", // Replace with your frontend URL
    credentials: true,
  })
);

// Connect Database
connectDB();

// Passport Middleware
app.use(passport.initialize());
require("./config/passport")(passport);

// Routes
//app.use("/api/payment", require("./routes/customer/"));
app.use("/api/customer", require("./routes/customer"));
app.use("/api/vendor", require("./routes/vendor"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/notification", require("./routes/notification"));
// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
