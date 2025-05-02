const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', ''); // Get the token from the Authorization header

    if (!token) {
        return res.status(401).json({ msg: 'No token provided, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const vendor = await Vendor.findById(decoded.id); // Find vendor by the id decoded from the token

        if (!vendor) {
            return res.status(404).json({ msg: 'Vendor not found' });
        }

        req.vendor = vendor; // Attach vendor object to the request
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        console.error(err);
        return res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
