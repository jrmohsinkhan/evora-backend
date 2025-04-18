const { Strategy, ExtractJwt } = require('passport-jwt');
const mongoose = require('mongoose');
const User = require('../models/User'); // Correct import
const GoogleStrategy = require('passport-google-oauth20').Strategy;

require('dotenv').config();

const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
};

module.exports = passport => {
    passport.use(
        new Strategy(opts, async (jwt_payload, done) => {
            try {
                const user = await User.findById(jwt_payload.id);
                if (user) return done(null, user);
                return done(null, false);
            } catch (err) {
                console.error(err);
                return done(err, false);
            }
        })
    );

    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ email: profile.emails[0].value });

            if (!user) {
                // Register the new user
                user = new User({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    password: null, // Not needed for OAuth
                    role: 'customer',
                    isVerified: true, // Mark as verified by default
                    googleId: profile.id,
                    provider: 'google'
                });
                await user.save();
            }

            return done(null, user);
        } catch (err) {
            console.error(err);
            return done(err, null);
        }
    }));
};
