// import React, { useContext, useState } from "react";
// import "./LoginPopup.css";
// import { assets } from "../../assets/assets";
// import { StoreContext } from "../../context/StoreContext";
// import axios from "axios";

// const LoginPopup = ({ setShowLogin, onSuccess }) => {
  
//   const { url, setToken } = useContext(StoreContext);

//   const [currState, setCurrState] = useState("Login");
//   const [data, setData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });
//   const [submitting, setSubmitting] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");

//   const onChangeHandler = (event) => {
//     const name = event.target.name;
//     const value = event.target.value;
//     setData((data) => ({ ...data, [name]: value }));
//   };

//   const onLogin = async (event) => {
//     event.preventDefault();
//     setSubmitting(true);
//     setErrorMessage("");
//     const isSigningUp = currState === "Sign Up";
//     let newUrl = url;
//     if (isSigningUp) {
//       newUrl += "/api/user/register";
//     } else {
//       newUrl += "/api/user/login";
//     }

//     try {
//       const response = await axios.post(newUrl, data);

//       if (response.data.success) {
//         setToken(response.data.token);
//         localStorage.setItem("token", response.data.token);
//         setShowLogin(false);
//         onSuccess?.({
//           title: isSigningUp ? "Your account is ready!" : "Welcome back!",
//           message: isSigningUp
//             ? "Thanks for joining Tomato. You can now explore the menu and place an order."
//             : "You are signed in and ready to order your favourites.",
//         });
//       } else {
//         setErrorMessage(response.data.message || "We couldn't complete your request.");
//       }
//     } catch (error) {
//       setErrorMessage(
//         error.response?.data?.message || "We couldn't connect. Please try again.",
//       );
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <div className="login-popup">
//       <form onSubmit={onLogin} className="login-popup-container">
//         <div className="login-popup-title">
//           <h2>{currState}</h2>
//           <img
//             onClick={() => setShowLogin(false)}
//             src={assets.cross_icon}
//             alt=""
//           />
//         </div>
//         <div className="login-popup-inputs">
//           {currState === "Login" ? (
//             <></>
//           ) : (
//             <input
//               name="name"
//               onChange={onChangeHandler}
//               value={data.name}
//               type="text"
//               placeholder="Your name"
//               required
//             />
//           )}
//           <input
//             name="email"
//             onChange={onChangeHandler}
//             value={data.email}
//             type="email"
//             placeholder="Your email"
//             required
//           />
//           <input
//             name="password"
//             onChange={onChangeHandler}
//             value={data.password}
//             type="password"
//             placeholder="Password"
//             required
//           />
//         </div>
//         {errorMessage && <p className="login-popup-error" role="alert">{errorMessage}</p>}
//         <button type="submit" disabled={submitting}>
//           {submitting
//             ? "Please wait..."
//             : currState === "Sign Up" ? "Create account" : "Login"}
//         </button>
//         <div className="login-popup-condition">
//           <input type="checkbox" required />
//           <p>By continuing, i agree to the terms of use & privacy policy.</p>
//         </div>
//         {currState === "Login" ? (
//           <p>
//             Create a new account?{" "}
//             <span onClick={() => setCurrState("Sign Up")}>Click here</span>
//           </p>
//         ) : (
//           <p>
//             Already have an account?{" "}
//             <span onClick={() => setCurrState("Login")}>Login here</span>
//           </p>
//         )}
//       </form>
//     </div>
//   );
// };

// export default LoginPopup;
// import React, { useContext, useState } from "react";
// import "./LoginPopup.css";
// import { assets } from "../../assets/assets";
// import { StoreContext } from "../../context/StoreContext";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const LoginPopup = ({ setShowLogin, onSuccess }) => {

//   const { url, setToken } = useContext(StoreContext);

//   const navigate = useNavigate();

//   const [currState, setCurrState] = useState("Login");

//   const [data, setData] = useState({
//     name: "",
//     email: "",
//     password: "",
//   });

//   const [submitting, setSubmitting] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");

//   const onChangeHandler = (event) => {

//     const name = event.target.name;
//     const value = event.target.value;

//     setData((data) => ({
//       ...data,
//       [name]: value,
//     }));
//   };


//   const onLogin = async (event) => {

//     event.preventDefault();

//     setSubmitting(true);
//     setErrorMessage("");

//     const isSigningUp = currState === "Sign Up";

//     let newUrl = url;

//     if (isSigningUp) {
//       newUrl += "/api/user/register";
//     } else {
//       newUrl += "/api/user/login";
//     }


//     try {

//       const response = await axios.post(
//         newUrl,
//         data
//       );


//       if (response.data.success) {


//         // -----------------------------------------
//         // SIGN UP
//         // -----------------------------------------

//         if (isSigningUp) {

//           // Account create ho gaya.
//           // Backend ne OTP email par bhej diya.

//           setShowLogin(false);

//           // OTP verification page par jao
//           navigate("/email-verify", {
//             state: {
//               email: data.email
//             }
//           });

//           return;
//         }


//         // -----------------------------------------
//         // LOGIN
//         // -----------------------------------------

//         if (response.data.token) {

//           setToken(response.data.token);

//           localStorage.setItem(
//             "token",
//             response.data.token
//           );
//         }


//         setShowLogin(false);


//         onSuccess?.({

//           title: "Welcome back!",

//           message:
//             "You are signed in and ready to order your favourites.",

//         });


//       } else {

//         setErrorMessage(
//           response.data.message ||
//           "We couldn't complete your request."
//         );
//       }


//     } catch (error) {

//       setErrorMessage(
//         error.response?.data?.message ||
//         "We couldn't connect. Please try again."
//       );

//     } finally {

//       setSubmitting(false);
//     }
//   };


//   return (

//     <div className="login-popup">

//       <form
//         onSubmit={onLogin}
//         className="login-popup-container"
//       >


//         <div className="login-popup-title">

//           <h2>{currState}</h2>

//           <img
//             onClick={() => setShowLogin(false)}
//             src={assets.cross_icon}
//             alt=""
//           />

//         </div>


//         <div className="login-popup-inputs">

//           {currState === "Login" ? (

//             <></>

//           ) : (

//             <input
//               name="name"
//               onChange={onChangeHandler}
//               value={data.name}
//               type="text"
//               placeholder="Your name"
//               required
//             />

//           )}


//           <input
//             name="email"
//             onChange={onChangeHandler}
//             value={data.email}
//             type="email"
//             placeholder="Your email"
//             required
//           />


//           <input
//             name="password"
//             onChange={onChangeHandler}
//             value={data.password}
//             type="password"
//             placeholder="Password"
//             required
//           />

//         </div>


//         {errorMessage && (

//           <p
//             className="login-popup-error"
//             role="alert"
//           >
//             {errorMessage}
//           </p>

//         )}


//         <button
//           type="submit"
//           disabled={submitting}
//         >

//           {submitting
//             ? "Please wait..."
//             : currState === "Sign Up"
//               ? "Create account"
//               : "Login"}

//         </button>


//         <div className="login-popup-condition">

//           <input
//             type="checkbox"
//             required
//           />

//           <p>
//             By continuing, i agree to the terms of use
//             & privacy policy.
//           </p>

//         </div>


//         {currState === "Login" ? (

//           <p>

//             Create a new account?{" "}

//             <span
//               onClick={() => {
//                 setCurrState("Sign Up");
//                 setErrorMessage("");
//               }}
//             >
//               Click here
//             </span>

//           </p>

//         ) : (

//           <p>

//             Already have an account?{" "}

//             <span
//               onClick={() => {
//                 setCurrState("Login");
//                 setErrorMessage("");
//               }}
//             >
//               Login here
//             </span>

//           </p>

//         )}

//       </form>

//     </div>
//   );
// };

// export default LoginPopup;

import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const LoginPopup = ({ setShowLogin, onSuccess }) => {

  const { url, setToken } = useContext(StoreContext);

  const navigate = useNavigate();

  const [currState, setCurrState] = useState("Login");

  const [data, setData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");


  const onChangeHandler = (event) => {

    const name = event.target.name;
    const value = event.target.value;

    setData((data) => ({
      ...data,
      [name]: value,
    }));

  };


  const onLogin = async (event) => {

    event.preventDefault();

    setSubmitting(true);
    setErrorMessage("");

    const isSigningUp =
      currState === "Sign Up";

    let newUrl = url;

    if (isSigningUp) {

      newUrl += "/api/user/register";

    } else {

      newUrl += "/api/user/login";

    }


    try {

      const response =
        await axios.post(
          newUrl,
          data
        );


      if (response.data.success) {


        // =========================
        // SIGN UP
        // =========================

        if (isSigningUp) {

          setShowLogin(false);

          navigate("/email-verify", {
            state: {
              email: data.email
            }
          });

          return;
        }


        // =========================
        // LOGIN
        // =========================

        if (response.data.token) {

          setToken(
            response.data.token
          );

          localStorage.setItem(
            "token",
            response.data.token
          );

        }


        setShowLogin(false);

        onSuccess?.({

          title: "Welcome back!",

          message:
            "You are signed in and ready to order your favourites.",

        });


      } else {

        setErrorMessage(
          response.data.message ||
          "We couldn't complete your request."
        );

      }


    } catch (error) {

      setErrorMessage(
        error.response?.data?.message ||
        "We couldn't connect. Please try again."
      );

    } finally {

      setSubmitting(false);

    }

  };


  // =========================
  // FORGOT PASSWORD
  // =========================

  const openForgotPassword = () => {

    setShowLogin(false);

    navigate("/forgot-password");

  };


  return (

    <div className="login-popup">

      <form
        onSubmit={onLogin}
        className={`login-popup-container ${currState === "Sign Up" ? "is-signup" : ""}`}
      >

        <div className="login-popup-mark" aria-hidden="true">T</div>

        {/* TITLE */}

        <div className="login-popup-title">

          <div>
            <span className="login-popup-eyebrow">TOMATO RESTAURANT</span>
            <h2>{currState === "Login" ? "Welcome back" : "Join the table"}</h2>
            <p>{currState === "Login" ? "Sign in to continue to your account." : "Create an account to save your favourites."}</p>
          </div>

          <button
            className="login-popup-close"
            type="button"
            aria-label="Close sign in dialog"
            onClick={() =>
              setShowLogin(false)
            }
          >
            <img src={assets.cross_icon} alt="" />
          </button>

        </div>


        {/* INPUTS */}

        <div className="login-popup-inputs">

          {currState === "Login" ? (

            <></>

          ) : (

            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder="Your name"
              autoComplete="name"
              required
            />

          )}


          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="Your email"
            autoComplete="email"
            required
          />


          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder="Password"
            autoComplete={currState === "Login" ? "current-password" : "new-password"}
            minLength={currState === "Sign Up" ? 8 : undefined}
            required
          />

        </div>


        {/* ERROR */}

        {errorMessage && (

          <p
            className="login-popup-error"
            role="alert"
          >
            {errorMessage}
          </p>

        )}


        {/* FORGOT PASSWORD */}

        {currState === "Login" && (

          <p
            className="login-popup-forgot"
            role="button"
            tabIndex={0}
            onClick={openForgotPassword}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openForgotPassword();
              }
            }}
          >
            Forgot Password?
          </p>

        )}


        {/* BUTTON */}

        <button
          type="submit"
          disabled={submitting}
        >

          {submitting
            ? "Please wait..."
            : currState === "Sign Up"
              ? "Create account"
              : "Login"}

        </button>


        {/* TERMS */}

        <div className="login-popup-condition">

          <input
            type="checkbox"
            required
          />

          <p>
            By continuing, i agree to the terms of use
            & privacy policy.
          </p>

        </div>


        {/* SWITCH LOGIN / SIGN UP */}

        {currState === "Login" ? (

          <p>

            Create a new account?{" "}

            <button
              type="button"
              onClick={() => {

                setCurrState("Sign Up");

                setErrorMessage("");

              }}
            >
              Create account
            </button>

          </p>

        ) : (

          <p>

            Already have an account?{" "}

            <button
              type="button"
              onClick={() => {

                setCurrState("Login");

                setErrorMessage("");

              }}
            >
              Sign in
            </button>

          </p>

        )}

      </form>

    </div>

  );

};


export default LoginPopup;