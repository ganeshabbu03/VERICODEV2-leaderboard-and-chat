const resetPasswordTemplate = (name, resetLink) => {
    return `
    <div style="font-family:Arial,sans-serif;padding:30px;max-width:600px;margin:auto">
        <h2>Hello ${name},</h2>

        <p>
            We received a request to reset your VeriCode AI password.
        </p>

        <p>
            Click the button below to create a new password.
        </p>

        <a
            href="${resetLink}"
            style="
                display:inline-block;
                background:#2563eb;
                color:white;
                padding:12px 24px;
                text-decoration:none;
                border-radius:6px;
            "
        >
            Reset Password
        </a>

        <p style="margin-top:25px">
            This link will expire in <strong>15 minutes</strong>.
        </p>

        <p>
            If you didn't request this, you can safely ignore this email.
        </p>

        <hr>

        <small>
            VeriCode AI Security Team
        </small>
    </div>
    `;
};

module.exports = resetPasswordTemplate;