import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import User from "../database/models/userModel";
import { UserRole } from "../globals/types";
import { envConfig } from "./config";

if (
  envConfig.googleClientId &&
  envConfig.googleClientSecret &&
  envConfig.googleCallbackUrl
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: envConfig.googleClientId,
        clientSecret: envConfig.googleClientSecret,
        callbackURL: envConfig.googleCallbackUrl,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new Error("Google account email not available"), false);
          }

          let user = await User.findOne({
            where: {
              googleId,
            },
          });

          if (!user) {
            user = await User.findOne({
              where: {
                email,
              },
            });
          }

          if (user) {
            if (!user.googleId) {
              user.googleId = googleId;
              await user.save();
            }

            return done(null, user);
          }

          const userName = email.split("@")[0];

          const newUser = await User.create({
            userName,
            email,
            password: null,
            googleId,
            fullName: profile.displayName || userName,
            profileImage: profile.photos?.[0]?.value || null,
            role: UserRole.User,
            isActive: true,
          });

          return done(null, newUser);
        } catch (error) {
          console.error("Google Authentication Error:", error);
          return done(error, false);
        }
      },
    ),
  );
} 

export default passport;
