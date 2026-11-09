const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");

require("./config/passport");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");

const app = express();

/* ===========================
   Global Middleware
=========================== */

app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ===========================
   Express Session
   (Required for Google OAuth)
=========================== */

app.use(
    session({
        secret: process.env.JWT_SECRET,
        resave: false,
        saveUninitialized: false,
    })
);

/* ===========================
   Passport
=========================== */

app.use(passport.initialize());
app.use(passport.session());

/* ===========================
   API Routes
=========================== */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

/* ===========================
   Health Check
=========================== */

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "VeriCode AI Backend Running 🚀",
    });
});

/* ===========================
   404 Handler
=========================== */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

/* ===========================
   Global Error Handler
=========================== */

app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
});

module.exports = app;