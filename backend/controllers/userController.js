// import userModel from "../models/userModel.js";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import validator from "validator";

// // Token create karne ka function
// const createToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET);
// }

// // Login User
// const loginUser = async (req, res) => {
//     const { email, password } = req.body;
//     const normalizedEmail = String(email || "").trim().toLowerCase();
//     try {
//         const user = await userModel.findOne({ email: normalizedEmail });

//         if (!user) {
//             return res.json({ success: false, message: "User doesn't exist" });
//         }

//         const isMatch = await bcrypt.compare(password, user.password);

//         if (!isMatch) {
//             return res.json({ success: false, message: "Invalid credentials" });
//         }

//         const token = createToken(user._id);
//         res.json({ success: true, token });

//     } catch (error) {
//         console.log(error);
//         res.json({ success: false, message: "Error" });
//     }
// }

// // Register User
// const registerUser = async (req, res) => {
//     const { name, password, email } = req.body;
//     const normalizedEmail = String(email || "").trim().toLowerCase();
//     try {
//         // Check if user already exists
//         const exists = await userModel.findOne({ email: normalizedEmail });
//         if (exists) {
//             return res.json({ success: false, message: "User already exists" });
//         }

//         // Validating email format and strong password
//         if (!validator.isEmail(normalizedEmail)) {
//             return res.json({ success: false, message: "Please enter a valid email" });
//         }

//         if (String(password || "").length < 8) {
//             return res.json({ success: false, message: "Please enter a strong password" });
//         }

//         // Hashing user password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const newUser = new userModel({
//             name: String(name || "").trim(),
//             email: normalizedEmail,
//             password: hashedPassword
//         });

//         const user = await newUser.save();
//         const token = createToken(user._id);
//         res.json({ success: true, token });

//     } catch (error) {
//         console.log(error);
//         res.json({ success: false, message: "Error" });
//     }
// }

// export { loginUser, registerUser };

// import userModel from "../models/userModel.js";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import validator from "validator";
// import crypto from "crypto";
// import sendVerificationEmail from "../utils/sendVerificationEmail.js";

// // Token create karne ka function
// const createToken = (id) => {
//     return jwt.sign({ id }, process.env.JWT_SECRET);
// };


// // =========================
// // Login User
// // =========================
// const loginUser = async (req, res) => {

//     const { email, password } = req.body;

//     const normalizedEmail =
//         String(email || "").trim().toLowerCase();

//     try {

//         const user = await userModel.findOne({
//             email: normalizedEmail
//         });

//         if (!user) {
//             return res.json({
//                 success: false,
//                 message: "User doesn't exist"
//             });
//         }

//         const isMatch = await bcrypt.compare(
//             password,
//             user.password
//         );

//         if (!isMatch) {
//             return res.json({
//                 success: false,
//                 message: "Invalid credentials"
//             });
//         }

//         // Email verification check
//         if (user.isEmailVerified === false) {
//             return res.json({
//                 success: false,
//                 message:
//                     "Please verify your email before logging in."
//             });
//         }

//         const token = createToken(user._id);

//         res.json({
//             success: true,
//             token
//         });

//     } catch (error) {

//         console.log(error);

//         res.json({
//             success: false,
//             message: "Error"
//         });
//     }
// };


// // =========================
// // Register User
// // =========================
// const registerUser = async (req, res) => {

//     const { name, password, email } = req.body;

//     const normalizedEmail =
//         String(email || "").trim().toLowerCase();

//     try {

//         // Check existing user
//         const exists = await userModel.findOne({
//             email: normalizedEmail
//         });

//         if (exists) {
//             return res.json({
//                 success: false,
//                 message: "User already exists"
//             });
//         }

//         // Validate email
//         if (!validator.isEmail(normalizedEmail)) {
//             return res.json({
//                 success: false,
//                 message: "Please enter a valid email"
//             });
//         }

//         // Validate password
//         if (String(password || "").length < 8) {
//             return res.json({
//                 success: false,
//                 message: "Please enter a strong password"
//             });
//         }

//         // Hash password
//         const salt = await bcrypt.genSalt(10);

//         const hashedPassword =
//             await bcrypt.hash(password, salt);


//         // Generate 6 digit OTP
//         const verificationOTP =
//             crypto.randomInt(100000, 1000000).toString();


//         // OTP expires after 15 minutes
//         const verificationOTPExpires =
//             new Date(Date.now() + 15 * 60 * 1000);


//         // Create user
//         const newUser = new userModel({

//             name: String(name || "").trim(),

//             email: normalizedEmail,

//             password: hashedPassword,

//             isEmailVerified: false,

//             emailVerificationOTP:
//                 verificationOTP,

//             emailVerificationOTPExpires:
//                 verificationOTPExpires

//         });


//         const user = await newUser.save();


//         // Send OTP email
//         try {

//             await sendVerificationEmail(
//                 user.email,
//                 user.name,
//                 verificationOTP
//             );

//         } catch (emailError) {

//             console.log(
//                 "Email sending failed:",
//                 emailError
//             );

//             // Remove account if email fails
//             await userModel.findByIdAndDelete(
//                 user._id
//             );

//             return res.json({
//                 success: false,
//                 message:
//                     "Could not send verification email. Please try again."
//             });
//         }


//         // Do NOT create JWT yet
//         res.json({

//             success: true,

//             message:
//                 "Registration successful. Please check your email for the verification code."

//         });

//     } catch (error) {

//         console.log(error);

//         res.json({
//             success: false,
//             message: "Error"
//         });
//     }
// };


// // =========================
// // Verify Email OTP
// // =========================
// const verifyEmail = async (req, res) => {

//     const { email, otp } = req.body;

//     const normalizedEmail =
//         String(email || "").trim().toLowerCase();

//     const cleanOTP =
//         String(otp || "").trim();


//     if (!normalizedEmail || !cleanOTP) {

//         return res.json({
//             success: false,
//             message:
//                 "Email and verification code are required."
//         });
//     }


//     try {

//         const user = await userModel.findOne({
//             email: normalizedEmail
//         });


//         if (!user) {

//             return res.json({
//                 success: false,
//                 message: "User doesn't exist."
//             });
//         }


//         // Already verified
//         if (user.isEmailVerified) {

//             return res.json({
//                 success: true,
//                 message:
//                     "Email is already verified."
//             });
//         }


//         // Check OTP
//         if (
//             user.emailVerificationOTP !== cleanOTP
//         ) {

//             return res.json({
//                 success: false,
//                 message:
//                     "Invalid verification code."
//             });
//         }


//         // Check expiry
//         if (
//             !user.emailVerificationOTPExpires ||
//             user.emailVerificationOTPExpires < new Date()
//         ) {

//             return res.json({
//                 success: false,
//                 message:
//                     "Verification code has expired. Please register again."
//             });
//         }


//         // Verify user
//         user.isEmailVerified = true;

//         user.emailVerificationOTP = null;

//         user.emailVerificationOTPExpires = null;

//         await user.save();


//         res.json({

//             success: true,

//             message:
//                 "Email verified successfully."

//         });

//     } catch (error) {

//         console.log(error);

//         res.json({

//             success: false,

//             message:
//                 "Error verifying email."

//         });
//     }
// };


// export {
//     loginUser,
//     registerUser,
//     verifyEmail
// };
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import sendVerificationEmail from "../utils/sendVerificationEmail.js";
import sendResetPasswordEmail from "../utils/sendResetPasswordEmail.js";


// ======================================================
// CREATE JWT TOKEN
// ======================================================

const createToken = (id) => {

    return jwt.sign(
        { id },
        process.env.JWT_SECRET
    );

};


// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {

    const { email, password } = req.body;

    const normalizedEmail =
        String(email || "").trim().toLowerCase();


    try {

        const user = await userModel.findOne({
            email: normalizedEmail
        });


        if (!user) {

            return res.json({
                success: false,
                message: "User doesn't exist"
            });

        }


        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!isMatch) {

            return res.json({
                success: false,
                message: "Invalid credentials"
            });

        }


        // Email verification check
        if (user.isEmailVerified === false) {

            return res.json({
                success: false,
                message:
                    "Please verify your email before logging in."
            });

        }


        // Create JWT
        const token =
            createToken(user._id);


        res.json({
            success: true,
            token
        });


    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error"
        });

    }

};


// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {

    const {
        name,
        password,
        email
    } = req.body;


    const normalizedEmail =
        String(email || "").trim().toLowerCase();


    try {

        // Check existing user
        const exists =
            await userModel.findOne({
                email: normalizedEmail
            });


        if (exists) {

            return res.json({
                success: false,
                message: "User already exists"
            });

        }


        // Validate email
        if (!validator.isEmail(normalizedEmail)) {

            return res.json({
                success: false,
                message:
                    "Please enter a valid email"
            });

        }


        // Validate password
        if (String(password || "").length < 8) {

            return res.json({
                success: false,
                message:
                    "Please enter a strong password"
            });

        }


        // Hash password
        const salt =
            await bcrypt.genSalt(10);


        const hashedPassword =
            await bcrypt.hash(
                password,
                salt
            );


        // Generate 6 digit OTP
        const verificationOTP =
            crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();


        // OTP expires after 15 minutes
        const verificationOTPExpires =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );


        // Create user
        const newUser =
            new userModel({

                name:
                    String(name || "").trim(),

                email:
                    normalizedEmail,

                password:
                    hashedPassword,

                isEmailVerified:
                    false,

                emailVerificationOTP:
                    verificationOTP,

                emailVerificationOTPExpires:
                    verificationOTPExpires

            });


        const user =
            await newUser.save();


        // Send verification email
        try {

            await sendVerificationEmail(
                user.email,
                user.name,
                verificationOTP
            );

        } catch (emailError) {

            console.log(
                "Email sending failed:",
                emailError
            );


            // Delete account if email failed
            await userModel.findByIdAndDelete(
                user._id
            );


            return res.json({

                success: false,

                message:
                    "Could not send verification email. Please try again."

            });

        }


        // No JWT before email verification
        res.json({

            success: true,

            message:
                "Registration successful. Please check your email for the verification code."

        });


    } catch (error) {

        console.log(error);

        res.json({
            success: false,
            message: "Error"
        });

    }

};


// ======================================================
// VERIFY EMAIL OTP
// ======================================================

const verifyEmail = async (req, res) => {

    const {
        email,
        otp
    } = req.body;


    const normalizedEmail =
        String(email || "").trim().toLowerCase();


    const cleanOTP =
        String(otp || "").trim();


    if (
        !normalizedEmail ||
        !cleanOTP
    ) {

        return res.json({

            success: false,

            message:
                "Email and verification code are required."

        });

    }


    try {

        const user =
            await userModel.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.json({

                success: false,

                message:
                    "User doesn't exist."

            });

        }


        // Already verified
        if (user.isEmailVerified) {

            return res.json({

                success: true,

                message:
                    "Email is already verified."

            });

        }


        // Check OTP
        if (
            user.emailVerificationOTP !==
            cleanOTP
        ) {

            return res.json({

                success: false,

                message:
                    "Invalid verification code."

            });

        }


        // Check expiry
        if (
            !user.emailVerificationOTPExpires ||
            user.emailVerificationOTPExpires <
            new Date()
        ) {

            return res.json({

                success: false,

                message:
                    "Verification code has expired. Please register again."

            });

        }


        // Verify email
        user.isEmailVerified =
            true;


        // Clear OTP
        user.emailVerificationOTP =
            null;


        user.emailVerificationOTPExpires =
            null;


        await user.save();


        res.json({

            success: true,

            message:
                "Email verified successfully."

        });


    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message:
                "Error verifying email."

        });

    }

};


// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (req, res) => {

    const { email } = req.body;


    const normalizedEmail =
        String(email || "").trim().toLowerCase();


    if (!normalizedEmail) {

        return res.json({

            success: false,

            message:
                "Please enter your email address."

        });

    }


    try {

        const user =
            await userModel.findOne({
                email: normalizedEmail
            });


        // User doesn't exist
        if (!user) {

            return res.json({

                success: false,

                message:
                    "No account found with this email."

            });

        }


        // Email must be verified
        if (user.isEmailVerified === false) {

            return res.json({

                success: false,

                message:
                    "Please verify your email before resetting your password."

            });

        }


        // Generate reset OTP
        const resetOTP =
            crypto
                .randomInt(
                    100000,
                    1000000
                )
                .toString();


        // OTP expires after 15 minutes
        const resetOTPExpires =
            new Date(
                Date.now() +
                15 * 60 * 1000
            );


        // Save reset OTP
        user.passwordResetOTP =
            resetOTP;


        user.passwordResetOTPExpires =
            resetOTPExpires;


        await user.save();


        // Send reset email
        try {

            await sendResetPasswordEmail(
                user.email,
                user.name,
                resetOTP
            );

        } catch (emailError) {

            console.log(
                "Reset email sending failed:",
                emailError
            );


            // Clear OTP if email fails
            user.passwordResetOTP =
                null;


            user.passwordResetOTPExpires =
                null;


            await user.save();


            return res.json({

                success: false,

                message:
                    "Could not send password reset email. Please try again."

            });

        }


        res.json({

            success: true,

            message:
                "Password reset code has been sent to your email."

        });


    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message:
                "Error sending password reset code."

        });

    }

};


// ======================================================
// VERIFY RESET OTP
// ======================================================

const verifyResetOTP = async (req, res) => {

    const {
        email,
        otp
    } = req.body;


    const normalizedEmail =
        String(email || "").trim().toLowerCase();


    const cleanOTP =
        String(otp || "").trim();


    if (
        !normalizedEmail ||
        !cleanOTP
    ) {

        return res.json({

            success: false,

            message:
                "Email and verification code are required."

        });

    }


    try {

        const user =
            await userModel.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.json({

                success: false,

                message:
                    "User doesn't exist."

            });

        }


        // Check OTP
        if (
            user.passwordResetOTP !==
            cleanOTP
        ) {

            return res.json({

                success: false,

                message:
                    "Invalid verification code."

            });

        }


        // Check expiry
        if (
            !user.passwordResetOTPExpires ||
            user.passwordResetOTPExpires <
            new Date()
        ) {

            return res.json({

                success: false,

                message:
                    "Verification code has expired. Please request a new code."

            });

        }


        res.json({

            success: true,

            message:
                "Verification code is valid."

        });


    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message:
                "Error verifying reset code."

        });

    }

};


// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {

    const {
        email,
        otp,
        newPassword
    } = req.body;


    const normalizedEmail =
        String(email || "").trim().toLowerCase();


    const cleanOTP =
        String(otp || "").trim();


    // Basic validation
    if (
        !normalizedEmail ||
        !cleanOTP ||
        !newPassword
    ) {

        return res.json({

            success: false,

            message:
                "Email, verification code and new password are required."

        });

    }


    // Password length
    if (
        String(newPassword).length < 8
    ) {

        return res.json({

            success: false,

            message:
                "New password must be at least 8 characters long."

        });

    }


    try {

        const user =
            await userModel.findOne({
                email: normalizedEmail
            });


        if (!user) {

            return res.json({

                success: false,

                message:
                    "User doesn't exist."

            });

        }


        // Check OTP
        if (
            user.passwordResetOTP !==
            cleanOTP
        ) {

            return res.json({

                success: false,

                message:
                    "Invalid verification code."

            });

        }


        // Check expiry
        if (
            !user.passwordResetOTPExpires ||
            user.passwordResetOTPExpires <
            new Date()
        ) {

            return res.json({

                success: false,

                message:
                    "Verification code has expired. Please request a new code."

            });

        }


        // Hash new password
        const salt =
            await bcrypt.genSalt(10);


        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                salt
            );


        // Update password
        user.password =
            hashedPassword;


        // Clear reset OTP
        user.passwordResetOTP =
            null;


        user.passwordResetOTPExpires =
            null;


        await user.save();


        res.json({

            success: true,

            message:
                "Password reset successfully. You can now login with your new password."

        });


    } catch (error) {

        console.log(error);

        res.json({

            success: false,

            message:
                "Error resetting password."

        });

    }

};


// ======================================================
// EXPORTS
// ======================================================

export {
    loginUser,
    registerUser,
    verifyEmail,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};