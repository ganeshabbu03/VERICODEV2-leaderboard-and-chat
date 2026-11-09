const verifyEmailTemplate = (name, verificationLink) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; background:#f4f4f4; padding:40px;">
        <div style="max-width:600px;margin:auto;background:#ffffff;padding:30px;border-radius:10px;">
            <h2>Welcome to VeriCode AI</h2>

            <p>Hi <strong>${name}</strong>,</p>

            <p>
                Thank you for registering.
                Please verify your email address by clicking the button below.
            </p>

            <p style="text-align:center;margin:40px 0;">
                <a
                    href="${verificationLink}"
                    style="
                        background:#2563eb;
                        color:white;
                        padding:15px 30px;
                        text-decoration:none;
                        border-radius:6px;
                        display:inline-block;
                    "
                >
                    Verify Email
                </a>
            </p>

            <p>
                If you didn't create this account,
                you can safely ignore this email.
            </p>

            <hr>

            <p style="font-size:12px;color:#777;">
                © VeriCode AI
            </p>
        </div>
    </body>
    </html>
    `;
};

module.exports = verifyEmailTemplate;