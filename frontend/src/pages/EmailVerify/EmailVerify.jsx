import React, { useContext, useState } from "react";
import "./EmailVerify.css";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { StoreContext } from "../../context/StoreContext";

const EmailVerify = () => {

  const { url } = useContext(StoreContext);

  const location = useLocation();
  const navigate = useNavigate();

  // Email Signup se aaye gi
  const [email, setEmail] = useState(
    location.state?.email || ""
  );

  const [otp, setOtp] = useState("");

  const [status, setStatus] = useState("form");

  const [message, setMessage] = useState("");

  const verifyOTP = async (event) => {

    event.preventDefault();

    if (!email.trim() || !otp.trim()) {
      setMessage("Please enter your email and verification code.");
      return;
    }

    if (otp.trim().length !== 6) {
      setMessage("Verification code must be 6 digits.");
      return;
    }

    setStatus("verifying");
    setMessage("");

    try {

      const response = await axios.post(
        `${url}/api/user/verify-email`,
        {
          email: email.trim(),
          otp: otp.trim()
        }
      );

      if (response.data.success) {

        setStatus("success");

        setMessage(
          response.data.message ||
          "Email verified successfully."
        );

      } else {

        setStatus("form");

        setMessage(
          response.data.message ||
          "Invalid verification code."
        );
      }

    } catch (error) {

      console.error(
        "Email verification error:",
        error
      );

      setStatus("form");

      setMessage(
        error.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    }
  };

  const goToLogin = () => {
    navigate("/", {
      state: {
        openLogin: true
      }
    });
  };

  return (
    <div className="email-verify-page">

      <div className="email-verify-card">

        {status === "verifying" && (
          <>
            <div className="email-verify-spinner"></div>

            <h2>Verifying your email...</h2>

            <p>
              Please wait while we verify your code.
            </p>
          </>
        )}

        {status === "form" && (
          <>
            <div className="email-verify-icon">
              ✉
            </div>

            <h2>Verify Your Email</h2>

            <p>
              We sent a 6-digit verification code
              to your email address.
            </p>

            <form onSubmit={verifyOTP}>

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Your email"
                required
              />

              <input
                type="text"
                value={otp}
                onChange={(event) =>
                  setOtp(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 6)
                  )
                }
                placeholder="Enter 6-digit code"
                inputMode="numeric"
                maxLength="6"
                required
              />

              {message && (
                <p
                  className="email-verify-message"
                  role="alert"
                >
                  {message}
                </p>
              )}

              <button type="submit">
                Verify Email
              </button>

            </form>
          </>
        )}

        {status === "success" && (
          <>
            <div className="email-verify-icon success">
              ✓
            </div>

            <h2>Email Verified!</h2>

            <p>
              {message}
            </p>

            <button onClick={goToLogin}>
              Continue to Login
            </button>
          </>
        )}

      </div>

    </div>
  );
};

export default EmailVerify;