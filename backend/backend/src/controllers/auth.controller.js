const { ZodError } = require("zod");

const {
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendVerificationSchema
} = require("../validators/auth.validator");

const {
    registerUser,
    loginUser,
    verifyEmail: verifyEmailService,
    forgotPassword,
    resetPassword,
    resendVerificationEmail,
    googleLogin,
    githubLogin
} = require("../services/auth.service");

/**
 * REGISTER USER
 */
const register = async (req, res) => {
    try {

        const data = registerSchema.parse(req.body);

        const user = await registerUser(data);

        return res.status(201).json({
            success: true,
            message: "Registration successful",
            user
        });

    } catch (error) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.issues
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * LOGIN USER
 */
const login = async (req, res) => {
    try {

        const { email, password } = req.body;

        const result = await loginUser({
            email,
            password
        });

        return res.status(200).json({
            success: true,
            message: "Login successful",
            ...result
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * VERIFY EMAIL
 */
const verifyEmail = async (req, res) => {
    try {

        const { token } = req.query;

        const result = await verifyEmailService(token);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * FORGOT PASSWORD
 */
const forgotPasswordController = async (req, res) => {
    try {

        const data = forgotPasswordSchema.parse(req.body);

        const result = await forgotPassword(data);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.issues
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * RESET PASSWORD
 */
const resetPasswordController = async (req, res) => {

    try {

        const data = resetPasswordSchema.parse(req.body);

        const result = await resetPassword(data);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.issues
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * RESEND VERIFICATION EMAIL
 */
const resendVerification = async (req, res) => {

    try {

        const data = resendVerificationSchema.parse(req.body);

        const result = await resendVerificationEmail(data);

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        if (error instanceof ZodError) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: error.issues
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

};

/**
 * GOOGLE CALLBACK
 */
const googleCallback = async (req, res) => {

    try {

        const result = await googleLogin(req.user);

        return res.redirect(
            `${process.env.FRONTEND_URL}/google-success?token=${result.token}`
        );

    } catch (error) {

        console.error(error);

        return res.redirect(
            `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
        );
    }

};
/**
 * GITHUB CALLBACK
 */
const githubCallback = async (req, res) => {

    try {

        const result = await githubLogin(req.user);

        return res.redirect(
            `${process.env.FRONTEND_URL}/google-success?token=${result.token}`
        );

    } catch (error) {

        console.error(error);

        return res.redirect(
            `${process.env.FRONTEND_URL}/login?error=github_auth_failed`
        );
    }

};
module.exports = {
    register,
    login,
    verifyEmail,
    forgotPassword: forgotPasswordController,
    resetPassword: resetPasswordController,
    resendVerification,
    googleCallback,
    githubCallback
};