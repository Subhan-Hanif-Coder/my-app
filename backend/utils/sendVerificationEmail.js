import nodemailer from "nodemailer";

const sendVerificationEmail = async (email, name, otp) => {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    await transporter.sendMail({
        from: `"Tomato" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Tomato verification code",

        html: `
            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 30px;
                border: 1px solid #ddd;
                border-radius: 12px;
                text-align: center;
            ">

                <h2 style="color: #ff4c24;">
                    Welcome to Tomato, ${name}!
                </h2>

                <p>
                    Thanks for creating your account.
                </p>

                <p>
                    Your email verification code is:
                </p>

                <div style="
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    margin: 25px 0;
                    color: #ff4c24;
                ">
                    ${otp}
                </div>

                <p style="color: #666;">
                    This code will expire in 15 minutes.
                </p>

                <p style="color: #999; font-size: 13px;">
                    If you did not create a Tomato account, you can ignore this email.
                </p>

            </div>
        `
    });
};

export default sendVerificationEmail;