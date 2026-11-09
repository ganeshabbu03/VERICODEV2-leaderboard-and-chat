const { z } = require("zod");

const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name must be at least 3 characters")
        .max(100),

    email: z
        .string()
        .email("Invalid email address")
        .transform(email => email.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(100)
});
const forgotPasswordSchema = z.object({
    email: z
        .string()
        .email("Invalid email address")
});
const resetPasswordSchema = z.object({
    token: z
        .string()
        .min(1, "Token is required"),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
});
const resendVerificationSchema = z.object({
    email: z
        .email("Invalid email address")
});
module.exports = {
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    resendVerificationSchema
};