import nodemailer from "nodemailer";


const sendResetPasswordEmail = async (email, name, otp) => {

    // Gmail transporter
    const transporter = nodemailer.createTransport({

        service: "gmail",

        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }

    });


    // Send email
    await transporter.sendMail({

        from: `"Tomato" <${process.env.EMAIL_USER}>`,

        to: email,

        replyTo: process.env.EMAIL_USER,

        subject: "Tomato - Password Reset Code",

        text: `
Hello ${name},

We received a request to reset your Tomato account password.

Your password reset code is:

${otp}

This code will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

Tomato
        `,

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

            <h2 style="
                color: #ff4c24;
                margin-bottom: 10px;
            ">
                Reset Your Tomato Password
            </h2>


            <p>
                Hello ${name},
            </p>


            <p>
                We received a request to reset your
                Tomato account password.
            </p>


            <p>
                Your password reset code is:
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


            <p style="
                color: #666;
            ">
                This code will expire in 15 minutes.
            </p>


            <p style="
                color: #999;
                font-size: 13px;
                margin-top: 25px;
            ">
                If you did not request a password reset,
                you can safely ignore this email.
            </p>


            <p style="
                color: #999;
                font-size: 13px;
            ">
                Tomato
            </p>

        </div>

        `

    });

};


export default sendResetPasswordEmail;