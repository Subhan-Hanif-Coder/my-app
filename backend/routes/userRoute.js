// import express from "express";
// import { loginUser, registerUser } from "../controllers/userController.js";

// const userRouter = express.Router();

// userRouter.post("/register", registerUser);
// userRouter.post("/login", loginUser);

// export default userRouter;
// import express from "express";

// import {
//     loginUser,
//     registerUser,
//     verifyEmail
// } from "../controllers/userController.js";

// const userRouter = express.Router();

// userRouter.post("/register", registerUser);

// userRouter.post("/login", loginUser);

// // Email verification
// userRouter.post("/verify-email", verifyEmail);

// export default userRouter;
import express from "express";

import {
    loginUser,
    registerUser,
    verifyEmail,
    forgotPassword,
    verifyResetOTP,
    resetPassword
} from "../controllers/userController.js";


const userRouter =
    express.Router();


// ======================================================
// REGISTER
// ======================================================

userRouter.post(
    "/register",
    registerUser
);


// ======================================================
// LOGIN
// ======================================================

userRouter.post(
    "/login",
    loginUser
);


// ======================================================
// EMAIL VERIFICATION
// ======================================================

userRouter.post(
    "/verify-email",
    verifyEmail
);


// ======================================================
// FORGOT PASSWORD
// ======================================================

userRouter.post(
    "/forgot-password",
    forgotPassword
);


// ======================================================
// VERIFY PASSWORD RESET OTP
// ======================================================

userRouter.post(
    "/verify-reset-otp",
    verifyResetOTP
);


// ======================================================
// RESET PASSWORD
// ======================================================

userRouter.post(
    "/reset-password",
    resetPassword
);


export default userRouter;