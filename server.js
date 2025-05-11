const express = require('express');
const connectDB = require('./config/db');
const passport = require('passport');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./utils/swagger');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:8081', // Replace with your frontend URL
  credentials: true
}));

// Connect Database
connectDB();

// Passport Middleware
app.use(passport.initialize());
require('./config/passport')(passport);

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Routes
app.use('/api/customer', require('./routes/customer'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/notification', require('./routes/notification'));
// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
