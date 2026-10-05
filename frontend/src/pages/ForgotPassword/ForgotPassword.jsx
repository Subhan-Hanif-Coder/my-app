import React, { useContext, useState } from "react";

import "./ForgotPassword.css";

import axios from "axios";

import { useNavigate } from "react-router-dom";

import { StoreContext } from "../../context/StoreContext";

const ForgotPassword = () => {
  const { url } = useContext(StoreContext);

  const navigate = useNavigate();

  // =========================
  // CURRENT STEP
  // =========================

  const [step, setStep] = useState("email");

  // =========================
  // FORM DATA
  // =========================

  const [email, setEmail] = useState("");

  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================
  // UI STATE
  // =========================

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  // =========================
  // SEND OTP
  // =========================

  const sendOTP = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await axios.post(`${url}/api/user/forgot-password`, {
        email: email.trim(),
      });

      if (response.data.success) {
        setMessage(response.data.message);

        setStep("otp");
      } else {
        setError(response.data.message || "Could not send reset code.");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VERIFY OTP
  // =========================

  const verifyOTP = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    if (otp.trim().length !== 6) {
      setError("Verification code must be 6 digits.");

      setLoading(false);

      return;
    }

    try {
      const response = await axios.post(`${url}/api/user/verify-reset-otp`, {
        email: email.trim(),
        otp: otp.trim(),
      });

      if (response.data.success) {
        setMessage(response.data.message);

        setStep("password");
      } else {
        setError(response.data.message || "Invalid verification code.");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // RESET PASSWORD
  // =========================

  const resetPassword = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    // Check password length
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");

      setLoading(false);

      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");

      setLoading(false);

      return;
    }

    try {
      const response = await axios.post(`${url}/api/user/reset-password`, {
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      });

      if (response.data.success) {
        setMessage(response.data.message);

        setStep("success");
      } else {
        setError(response.data.message || "Could not reset password.");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // GO TO LOGIN
  // =========================

  const goToLogin = () => {
    navigate("/", {
      state: {
        openLogin: true,
      },
    });
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-card">
        {/* =========================
            STEP 1
        ========================= */}

        {step === "email" && (
          <>
            <div className="forgot-password-icon">🔐</div>

            <h2>Forgot Password?</h2>

            <p>
              Enter your email address and we'll send you a password reset code.
            </p>

            <form onSubmit={sendOTP}>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Your email"
                required
              />

              {error && (
                <p className="forgot-password-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>

            <button
              className="back-login-button"
              type="button"
              onClick={() => navigate("/")}
            >
              Back to Home
            </button>
          </>
        )}

        {/* =========================
            STEP 2
        ========================= */}

        {step === "otp" && (
          <>
            <div className="forgot-password-icon">✉</div>

            <h2>Enter Verification Code</h2>

            <p>We sent a 6-digit code to:</p>

            <strong>{email}</strong>

            <form onSubmit={verifyOTP}>
              <input
                className="otp-input"
                type="text"
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                inputMode="numeric"
                maxLength="6"
                required
              />

              {message && <p className="forgot-password-success">{message}</p>}

              {error && (
                <p className="forgot-password-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Checking..." : "Verify Code"}
              </button>
            </form>
          </>
        )}

        {/* =========================
            STEP 3
        ========================= */}

        {step === "password" && (
          <>
            <div className="forgot-password-icon">🔑</div>

            <h2>Create New Password</h2>

            <p>
              Enter your new password below. It must contain at least 8
              characters.
            </p>

            <form onSubmit={resetPassword}>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="New password"
                minLength="8"
                required
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                minLength="8"
                required
              />

              {error && (
                <p className="forgot-password-error" role="alert">
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          </>
        )}

        {/* =========================
            STEP 4
        ========================= */}

        {step === "success" && (
          <>
            <div className="forgot-password-icon success">✓</div>

            <h2>Password Reset!</h2>

            <p>{message || "Your password has been successfully updated."}</p>

            <button type="button" onClick={goToLogin}>
              Continue to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
