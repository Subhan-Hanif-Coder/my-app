import React from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";
import { FiArchive, FiBarChart2, FiChevronRight, FiGrid, FiPlus, FiPrinter, FiShoppingBag, FiTag, FiTrendingUp } from "react-icons/fi";

const navigation = [
  { to: "/", label: "Overview", detail: "Your restaurant pulse", icon: FiGrid, end: true },
  { to: "/add", label: "Add a dish", detail: "Grow your menu", icon: FiPlus },
  { to: "/list", label: "Menu catalog", detail: "Dishes & pricing", icon: FiTag },
  { to: "/orders", label: "Orders & bookings", detail: "Service management", icon: FiShoppingBag },
  { to: "/completed-orders", label: "Completed orders", detail: "Delivered & archived", icon: FiArchive },
  { to: "/promotions", label: "Promotions", detail: "Discounts & offer codes", icon: FiTag },
  { to: "/reports-payroll", label: "Reports & payroll", detail: "Sales and staff salaries", icon: FiTrendingUp },
  { to: "/print-reports", label: "Print reports", detail: "Compact printable summaries", icon: FiPrinter },
];

const Sidebar = ({ isOpen, onClose, onNavigate }) => (
  <>
    {isOpen && (
      <button
        className="admin-sidebar-backdrop"
        type="button"
        aria-label="Close admin navigation"
        onClick={onClose}
      />
    )}
    <aside
      className={`sidebar admin-sidebar${isOpen ? " is-open" : ""}`}
      id="admin-navigation"
    >
      <div className="sidebar-section-label">MANAGE YOUR RESTAURANT</div>
      <nav className="sidebar-options" aria-label="Admin navigation">
        {navigation.map(({ to, label, detail, icon: Icon, end }) => (
          <NavLink
            to={to}
            className="sidebar-option"
            key={to}
            end={end}
            title={label}
            onClick={onNavigate}
          >
            <span className="sidebar-option-icon"><Icon /></span>
            <span className="sidebar-option-copy">
              <b>{label}</b>
              <small>{detail}</small>
            </span>
            <FiChevronRight className="sidebar-option-arrow" />
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom-card">
        <span className="sidebar-bottom-icon"><FiBarChart2 /></span>
        <b>Service, made simpler</b>
        <p>Menu, orders, bookings and staff payroll in one workspace.</p>
      </div>
      <div className="sidebar-footer"><i /> Admin workspace is ready</div>
    </aside>
  </>
);

export default Sidebar;
