import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FiChevronDown, FiLogOut, FiMenu, FiShoppingBag, FiX } from "react-icons/fi";
import "./Navbar.css";
import { assets } from "../../assets/assets";

const Navbar = ({ onLogout, isSidebarOpen, onToggleSidebar }) => {
  const { pathname } = useLocation();
  const currentPage = {
    "/": ["Overview", "Good to see you again"],
    "/add": ["Add a dish", "Create a new menu item"],
    "/list": ["Menu catalog", "Manage your dishes and pricing"],
    "/orders": ["Orders & reservations", "Keep every service moving"],
    "/completed-orders": ["Completed orders", "Review delivered customer orders"],
    "/reports-payroll": ["Reports & payroll", "Business performance and monthly salaries"],
    "/print-reports": ["Print reports", "Daily, weekly, monthly and yearly summary"],
  }[pathname] || ["Restaurant workspace", "Your operations at a glance"];

  return (
    <header className="navbar admin-topbar">
      <button
        className="admin-topbar-menu-toggle"
        type="button"
        onClick={onToggleSidebar}
        aria-label={isSidebarOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isSidebarOpen}
        aria-controls="admin-navigation"
      >
        {isSidebarOpen ? <FiX /> : <FiMenu />}
      </button>
      <Link className="admin-topbar-brand" to="/" aria-label="Restaurant admin home">
        <img className="logo" src={assets.logo} alt="" />
        <span className="admin-topbar-brand-divider" />
        <span className="admin-topbar-brand-label">STUDIO</span>
      </Link>
      <div className="admin-topbar-page">
        <span>Workspace <FiChevronDown aria-hidden="true" /></span>
        <b>{currentPage[0]}</b>
        <small>{currentPage[1]}</small>
      </div>
      <div className="admin-topbar-actions">
        <span className="admin-topbar-live"><i /> Workspace ready</span>
        <span className="admin-topbar-divider" />
        <Link className="admin-topbar-icon" to="/orders" aria-label="Open orders and reservations">
          <FiShoppingBag />
          <i />
        </Link>
        <div className="admin-topbar-user">
          <img className="profile" src={assets.profile_image} alt="" />
          <span><b>Administrator</b><small>Restaurant owner</small></span>
        </div>
        <button className="admin-topbar-logout" type="button" onClick={onLogout}>
          <FiLogOut /><span>Sign out</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
