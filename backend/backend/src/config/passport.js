const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        async (accessToken, refreshToken, profile, done) => {
            try {

                const userProfile = {
                    id: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    picture: profile.photos?.[0]?.value || null
                };

                return done(null, userProfile);

            } catch (error) {
                return done(error, null);
            }
        }
    )
);
passport.use(
    new GitHubStrategy(
        {
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: process.env.GITHUB_CALLBACK_URL,
            scope: ["user:email"]
        },
        async (accessToken, refreshToken, profile, done) => {
            try {

                const email =
                    profile.emails && profile.emails.length > 0
                        ? profile.emails[0].value
                        : null;

                const userProfile = {
                    id: profile.id,
                    name: profile.displayName || profile.username,
                    email,
                    username: profile.username,
                    picture: profile.photos?.[0]?.value || null
                };

                return done(null, userProfile);

            } catch (error) {
                return done(error, null);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;