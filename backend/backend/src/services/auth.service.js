const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const crypto = require("crypto");

const generateVerificationToken = require("../utils/generateVerificationToken");
const hashToken = require("../utils/hashToken");
const { sendVerificationEmail } = require("./email.service");
const { generateToken } = require("./jwt.service");
const { sendResetPasswordEmail } = require("./email.service");


/**
 * REGISTER USER
 */
const registerUser = async ({ name, email, password }) => {

    const existingUser = await User.findOne({
        where: { email }
    });

    if (existingUser) {
        throw new Error("Email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenHash = hashToken(verificationToken);

    // Token expiry (24 hours)
    const verificationExpiry = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    );

    // Create user
    const user = await User.create({
        name,
        email,
        password_hash: hashedPassword,
        verification_token_hash: verificationTokenHash,
        verification_expiry: verificationExpiry,
        email_verified: false
    });

    try {
        const verificationLink =
            `${process.env.APP_URL}/api/auth/verify-email?token=${verificationToken}`;

        await sendVerificationEmail(
            user.name,
            user.email,
            verificationLink
        );

        console.log("📧 Verification email sent");

    } catch (error) {
        console.error("❌ Email sending failed:", error.message);
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        email_verified: user.email_verified
    };
};

/**
 * LOGIN USER
 */
const loginUser = async ({ email, password }) => {

    const user = await User.findOne({
        where: { email }
    });

    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
    );

    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // Email verification check
    if (!user.email_verified) {
        throw new Error("Please verify your email before login");
    }

    // Generate JWT
    const token = generateToken(user);

    return {
        token,
        user: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    };
};

/**
 * VERIFY EMAIL
 */
const verifyEmail = async (token) => {

    if (!token) {
        throw new Error("Token is required");
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
        where: {
            verification_token_hash: hashedToken
        }
    });

    if (!user) {
        throw new Error("Invalid or expired token");
    }

    if (user.verification_expiry < new Date()) {
        throw new Error("Token expired");
    }

    user.email_verified = true;
    user.verification_token_hash = null;
    user.verification_expiry = null;

    await user.save();

    return {
        message: "Email verified successfully"
    };
};
/**
 * FORGOT PASSWORD
 */
const forgotPassword = async ({ email }) => {

    const user = await User.findOne({
        where: { email }
    });

    // Don't reveal whether email exists
    if (!user) {
        return {
            message:
                "If an account exists with this email, a reset link has been sent."
        };
    }

    // Generate reset token
    const resetToken = generateVerificationToken();

    // Hash token
    const resetTokenHash = hashToken(resetToken);

    // Expiry (15 minutes)
    const resetExpiry = new Date(
        Date.now() + 15 * 60 * 1000
    );

    // Save to DB
    user.reset_token_hash = resetTokenHash;
    user.reset_expiry = resetExpiry;

    await user.save();

    // Reset link
    const resetLink =
        `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send email
    await sendResetPasswordEmail(
        user.name,
        user.email,
        resetLink
    );

    return {
        message:
            "If an account exists with this email, a reset link has been sent."
    };
};
/**
 * RESET PASSWORD
 */
const resetPassword = async ({ token, password }) => {

    // Hash received token
    const hashedToken = hashToken(token);

    // Find user
    const user = await User.findOne({
        where: {
            reset_token_hash: hashedToken
        }
    });

    if (!user) {
        throw new Error("Invalid or expired reset token");
    }

    // Check expiry
    if (user.reset_expiry < new Date()) {
        throw new Error("Reset token has expired");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password
    user.password_hash = hashedPassword;

    // Remove reset token
    user.reset_token_hash = null;
    user.reset_expiry = null;

    await user.save();

    return {
        message: "Password reset successful"
    };
};
/**
 * RESEND VERIFICATION EMAIL
 */
const resendVerificationEmail = async ({ email }) => {

    const user = await User.findOne({
        where: {
            email
        }
    });

    // Don't reveal whether account exists
    if (!user) {
        return {
            message: "If an account exists, a verification email has been sent."
        };
    }

    if (user.email_verified) {
        throw new Error("Email is already verified.");
    }

    // Generate new token
    const verificationToken = generateVerificationToken();

    const verificationTokenHash = hashToken(verificationToken);

    const verificationExpiry = new Date(
        Date.now() + 24 * 60 * 60 * 1000
    );

    user.verification_token_hash = verificationTokenHash;
    user.verification_expiry = verificationExpiry;

    await user.save();

    const verificationLink =
        `${process.env.APP_URL}/api/auth/verify-email?token=${verificationToken}`;

    await sendVerificationEmail(
        user.name,
        user.email,
        verificationLink
    );

    return {
        message: "Verification email sent successfully."
    };
};
/**
 * GOOGLE LOGIN
 */
const googleLogin = async (profile) => {

    const googleId = profile.id;
    const email = profile.email;
    const name = profile.name;

    // Find existing Google account
    let user = await User.findOne({
        where: {
            provider: "google",
            provider_id: googleId
        }
    });

    if (user) {
        return {
            token: generateToken(user),
            user
        };
    }

    // Find existing local account
    user = await User.findOne({
        where: { email }
    });

    if (user) {

        // Link Google account
        user.provider = "google";
        user.provider_id = googleId;
        user.email_verified = true;

        await user.save();

        return {
            token: generateToken(user),
            user
        };
    }

    // Create new Google account
    const randomPassword = crypto
        .randomBytes(32)
        .toString("hex");

    const hashedPassword = await bcrypt.hash(
        randomPassword,
        12
    );

    user = await User.create({
        name,
        email,
        password_hash: hashedPassword,
        provider: "google",
        provider_id: googleId,
        email_verified: true
    });

    return {
        token: generateToken(user),
        user
    };
};
/**
 * GITHUB LOGIN
 */
const githubLogin = async (profile) => {

    const githubId = profile.id;
    const email = profile.email;
    const name = profile.name || profile.username;

    // GitHub account without public email
    if (!email) {
        throw new Error(
            "Your GitHub account does not expose an email address. Please make your email public or use another login method."
        );
    }

    // Find existing GitHub account
    let user = await User.findOne({
        where: {
            provider: "github",
            provider_id: githubId
        }
    });

    if (user) {
        return {
            token: generateToken(user),
            user
        };
    }

    // Find existing account with same email
    user = await User.findOne({
        where: {
            email
        }
    });

    if (user) {

        user.provider = "github";
        user.provider_id = githubId;
        user.email_verified = true;

        await user.save();

        return {
            token: generateToken(user),
            user
        };
    }

    // Create new GitHub account
    const randomPassword = crypto
        .randomBytes(32)
        .toString("hex");

    const hashedPassword = await bcrypt.hash(
        randomPassword,
        12
    );

    user = await User.create({
        name,
        email,
        password_hash: hashedPassword,
        provider: "github",
        provider_id: githubId,
        email_verified: true
    });

    return {
        token: generateToken(user),
        user
    };
};
module.exports = {
    registerUser,
    loginUser,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendVerificationEmail,
    googleLogin,
    githubLogin
};