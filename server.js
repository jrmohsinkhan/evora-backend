<<<<<<< HEAD
const express = require("express");
const connectDB = require("./config/db");
const passport = require("passport");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");
require("dotenv").config();
const cors = require("cors");
=======
const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
require('dotenv').config();
const cors = require('cors');
>>>>>>> 0f8a39084dbc0de4838639fe2616353052b81753

const app = express();

// Middleware
app.use(express.json());
<<<<<<< HEAD
app.use(
  cors({
    origin: "http://localhost:8081", // Replace with your frontend URL
    credentials: true,
  })
);
=======
app.use(cors({
  origin: 'http://localhost:8081', // Replace with your frontend URL
  credentials: true
}));
>>>>>>> 0f8a39084dbc0de4838639fe2616353052b81753

// Connect Database
connectDB();

// Passport Middleware
app.use(passport.initialize());
require("./config/passport")(passport);

app.use(
  cors({
    origin: "http://localhost:8081",
    credentials: true,
  })
);

const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Routes
<<<<<<< HEAD
const paymentRoutes = require("./routes/payment");
app.use("/api/payment", paymentRoutes);

app.use("/api/customer", require("./routes/customer"));
app.use("/api/vendor", require("./routes/vendor"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/notification", require("./routes/notification"));
=======
app.use('/api/customer', require('./routes/customer'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notification', require('./routes/notification'));
>>>>>>> 0f8a39084dbc0de4838639fe2616353052b81753
// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
