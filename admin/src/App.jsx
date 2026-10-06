import React, { useState } from "react";
import axios from "axios";
import Navbar from "./components/Navbar/Navbar";
import Sidebar from "./components/Sidebar/Sidebar";
import { Navigate, Routes, Route, useNavigate } from "react-router-dom";
import Add from "./pages/Add/Add";
import List from "./pages/List/List";
import Orders from "./pages/Orders/Orders";
import Dashboard from "./pages/Dashboard/Dashboard";
import ReportsPayroll from "./pages/ReportsPayroll/ReportsPayroll";
import PrintReports from "./pages/PrintReports/PrintReports";
import Promotions from "./pages/Promotions/Promotions";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

const API_URL = "https://my-app-backend-jade.vercel.app";

const App = () => {
  const navigate = useNavigate();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [adminApiKey, setAdminApiKey] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    setAdminApiKey("");
    setPasswordInput("");
    setIsAuthenticated(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setIsLoggingIn(true);
    setLoginError("");

    try {
      const response = await axios.post(
        `${API_URL}/api/order/reservation/admin/login`,
        {},
        {
          headers: {
            "x-admin-key": passwordInput,
          },
        },
      );

      if (response.data?.success) {
        setAdminApiKey(passwordInput);
        setIsAuthenticated(true);
        navigate("/", { replace: true });
      } else {
        setLoginError(
          response.data?.message || "Admin access could not be verified.",
        );
      }
    } catch (error) {
      setLoginError(
        error.response?.data?.message ||
          "Could not connect to the admin service.",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="admin-login">
        <section className="admin-login-story">
          <div className="admin-login-brand">
            <span className="admin-brand-mark">T</span>

            <span>
              tomato
              <span className="admin-brand-dot">.</span>
              <small>RESTAURANT OS</small>
            </span>
          </div>

          <div className="admin-login-message">
            <span className="admin-login-kicker">
              YOUR BUSINESS, AT A GLANCE
            </span>

            <h1>
              Run a restaurant
              <br />
              worth coming back to.
            </h1>

            <p>
              One calm workspace for your menu, orders, reservations, and the
              details that make service exceptional.
            </p>
          </div>

          <div className="admin-login-footnote">
            <span className="admin-login-live-dot" /> Private workspace{" "}
            <span>·</span> Secure admin access
          </div>
        </section>

        <form className="admin-login-card" onSubmit={handleLogin}>
          <span className="admin-login-card-mark">WELCOME BACK</span>

          <h2>Sign in to your workspace</h2>

          <p>Enter the admin access key configured by your server.</p>

          <label htmlFor="admin-access-key">Admin access key</label>

          <input
            id="admin-access-key"
            type="password"
            placeholder="Enter your secure key"
            value={passwordInput}
            onChange={(e) => {
              setPasswordInput(e.target.value);
              setLoginError("");
            }}
            autoComplete="current-password"
            required
          />

          {loginError && (
            <p className="admin-login-error" role="alert">
              {loginError}
            </p>
          )}

          <button type="submit" disabled={isLoggingIn || !passwordInput}>
            {isLoggingIn ? "Verifying access..." : "Enter workspace"}{" "}
            <span aria-hidden="true">↗</span>
          </button>

          <small className="admin-login-security">
            Your access key is verified securely by the backend.
          </small>
        </form>
      </main>
    );
  }

  return (
    <div className="admin-shell">
      <ToastContainer />

      <Navbar
        onLogout={handleLogout}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />

      <div className="app-content">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onNavigate={() => setIsSidebarOpen(false)}
        />

        <main className="admin-main">
          <Routes>
            <Route path="/" element={<Dashboard url={API_URL} />} />

            <Route path="/add" element={<Add url={API_URL} />} />

            <Route path="/list" element={<List url={API_URL} />} />

            <Route
              path="/reports-payroll"
              element={<ReportsPayroll url={API_URL} adminKey={adminApiKey} />}
            />

            <Route
              path="/print-reports"
              element={<PrintReports url={API_URL} adminKey={adminApiKey} />}
            />

            <Route
              path="/orders"
              element={
                <Orders
                  key="active-orders"
                  url={API_URL}
                  adminKey={adminApiKey}
                />
              }
            />

            <Route
              path="/completed-orders"
              element={
                <Orders
                  key="completed-orders"
                  url={API_URL}
                  adminKey={adminApiKey}
                  completedOnly
                />
              }
            />

            <Route
              path="/promotions"
              element={<Promotions url={API_URL} adminKey={adminApiKey} />}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
