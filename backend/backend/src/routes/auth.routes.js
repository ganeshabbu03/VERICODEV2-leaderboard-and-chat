const express = require("express");
const passport = require("passport");

const router = express.Router();

const {
    register,
    login,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendVerification,
    googleCallback,
    githubCallback
} = require("../controllers/auth.controller");

/* ===========================
   Local Authentication
=========================== */

router.post("/register", register);

router.post("/login", login);

router.get("/verify-email", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.post(
    "/resend-verification",
    resendVerification
);

/* ===========================
   Google OAuth
=========================== */

router.get(
    "/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: "/"
    }),
    googleCallback
);

/* ===========================
   GitHub OAuth
=========================== */

router.get(
    "/github",
    passport.authenticate("github", {
        scope: ["user:email"]
    })
);

router.get(
    "/github/callback",
    passport.authenticate("github", {
        session: false,
        failureRedirect: "/"
    }),
    githubCallback
);

module.exports = router;