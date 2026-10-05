// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, trim: true, lowercase: true },
//     password: { type: String, required: true },
//     cartData: { type: Object, default: {} }
// }, { minimize: false });

// const userModel = mongoose.models.user || mongoose.model("user", userSchema);

// export default userModel;

// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({

//     name: {
//         type: String,
//         required: true,
//         trim: true
//     },

//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//         lowercase: true
//     },

//     password: {
//         type: String,
//         required: true
//     },

//     // Email verification
//     isEmailVerified: {
//         type: Boolean,
//         default: false
//     },

//  emailVerificationOTP: {
//     type: String,
//     default: null
// },

// emailVerificationOTPExpires: {
//     type: Date,
//     default: null
// },

//     cartData: {
//         type: Object,
//         default: {}
//     }

// }, { minimize: false });

// const userModel =
//     mongoose.models.user ||
//     mongoose.model("user", userSchema);

// export default userModel;
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    // User name
    name: {
        type: String,
        required: true,
        trim: true
    },

    // User email
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },

    // Hashed password
    password: {
        type: String,
        required: true
    },

    // Cart data
    cartData: {
        type: Object,
        default: {}
    },

    // =========================
    // EMAIL VERIFICATION
    // =========================

    isEmailVerified: {
        type: Boolean,
        default: false
    },

    emailVerificationOTP: {
        type: String,
        default: null
    },

    emailVerificationOTPExpires: {
        type: Date,
        default: null
    },


    // =========================
    // PASSWORD RESET
    // =========================

    passwordResetOTP: {
        type: String,
        default: null
    },

    passwordResetOTPExpires: {
        type: Date,
        default: null
    }

}, {
    minimize: false
});


const userModel =
    mongoose.models.user ||
    mongoose.model("user", userSchema);


export default userModel;