const nodemailer = require("nodemailer");
const resetPasswordTemplate = require("../templates/resetPasswordTemplate");
require("dotenv").config();

const verifyEmailTemplate = require("../templates/verifyEmailTemplate");

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendVerificationEmail = async (name, email, verificationLink) => {
    try {
        console.log("📨 Preparing to send email...");

        await transporter.verify();
        console.log("✅ SMTP verified successfully");

        const info = await transporter.sendMail({
            from: `"VeriCode AI Security" <${process.env.SMTP_FROM}>`,
            to: email,
            subject: "Verify your VeriCode AI Account",
            html: verifyEmailTemplate(name, verificationLink),
        });

        console.log("📧 Email sent successfully");
        console.log("Message ID:", info.messageId);

        return info;

    } catch (error) {
        console.error("❌ SMTP EMAIL ERROR:");
        console.error(error);

        throw new Error("Email sending failed");
    }
};
const sendResetPasswordEmail = async (name, email, resetLink) => {
    try {

        await transporter.verify();

        await transporter.sendMail({
            from: `"VeriCode AI Security" <${process.env.SMTP_FROM}>`,
            to: email,
            subject: "Reset your VeriCode AI password",
            html: resetPasswordTemplate(name, resetLink),
        });

        console.log(`📧 Password reset email sent to ${email}`);

    } catch (error) {
        console.error(error);
        throw new Error("Failed to send password reset email");
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail
};