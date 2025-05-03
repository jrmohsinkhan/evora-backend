const { ExtractJwt } = require('passport-jwt');
const mongoose = require('mongoose');
const Customer = require('../models/customer');
const Vendor = require('../models/vendor');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

require('dotenv').config();

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

module.exports = passport => {
    // JWT Strategy for Customer (login using JWT)
    passport.use(
        'customer-jwt',
        new (require('passport-jwt').Strategy)(opts, async (jwt_payload, done) => {
            try {
                const customer = await Customer.findById(jwt_payload.id);
                if (customer) {
                    return done(null, customer);
                }
                return done(null, false);
            } catch (err) {
                console.error(err);
                return done(err, false);
            }
        })
    );

    // JWT Strategy for Vendor (login using JWT)
    passport.use(
        'vendor-jwt',
        new (require('passport-jwt').Strategy)(opts, async (jwt_payload, done) => {
            try {
                const vendor = await Vendor.findById(jwt_payload.id);
                if (vendor) {
                    return done(null, vendor);
                }
                return done(null, false);
            } catch (err) {
                console.error(err);
                return done(err, false);
            }
        })
    );

    // Google OAuth Strategy for Customer
    passport.use(
        'google-customer',
        new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL_CUSTOMER,
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let customer = await Customer.findOne({ googleId: profile.id });

                if (!customer) {
                    // Register the new customer if not found
                    customer = new Customer({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        password: null, // Not needed for OAuth
                        isVerified: true,
                        googleId: profile.id,
                        provider: 'google',
                    });
                    await customer.save();
                }

                return done(null, customer);
            } catch (err) {
                console.error(err);
                return done(err, null);
            }
        })
    );

    // Google OAuth Strategy for Vendor
    passport.use(
        'google-vendor',
        new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL_VENDOR,
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                let vendor = await Vendor.findOne({ googleId: profile.id });

                if (!vendor) {
                    // Register the new vendor if not found
                    vendor = new Vendor({
                        name: profile.displayName,
                        email: profile.emails[0].value,
                        password: null, // Not needed for OAuth
                        isVerified: true,
                        googleId: profile.id,
                        provider: 'google',
                        isActive: true,  // Set active status for vendors
                    });
                    await vendor.save();
                }

                return done(null, vendor);
            } catch (err) {
                console.error(err);
                return done(err, null);
            }
        })
    );
};
