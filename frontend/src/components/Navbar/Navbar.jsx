import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  const navigate = useNavigate();

  const closeMobileMenu = (selectedMenu) => {
    setMenu(selectedMenu);
    setMobileMenuOpen(false);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <div className="navbar">
      <Link to="/" aria-label="Tomato home" onClick={() => closeMobileMenu("home")}>
        <img src={assets.logo} alt="" className="logo" />
      </Link>
      <nav className={`navbar-menu ${mobileMenuOpen ? "is-open" : ""}`} aria-label="Main navigation">
        <Link
          to="/"
          className={menu === "home" ? "active" : ""}
          onClick={() => closeMobileMenu("home")}
        >
          Home
        </Link>
        <Link
          to="/#explore-menu"
          className={menu === "menu" ? "active" : ""}
          onClick={() => closeMobileMenu("menu")}
        >
          Menu
        </Link>
        <Link
          to="/#app-download"
          className={menu === "mobile-app" ? "active" : ""}
          onClick={() => closeMobileMenu("mobile-app")}
        >
          Our app
        </Link>
        <Link
          to="/#footer"
          className={menu === "contact-us" ? "active" : ""}
          onClick={() => closeMobileMenu("contact-us")}
        >
          Contact
        </Link>
      </nav>
      <div className="navbar-right">
        <Link className="navbar-icon-link" to="/#food-display" aria-label="Search the menu">
          <img src={assets.search_icon} alt="" />
        </Link>
        <div className="navbar-search-icon">
          <Link to="/cart">
            <img src={assets.basket_icon} alt="Shopping cart" />
          </Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? (
          <button className="navbar-sign-in" onClick={() => setShowLogin(true)}>Sign in</button>
        ) : (
          <div className="navbar-profile">
            <button className="navbar-profile-trigger" type="button" aria-label="Open account menu">
              <img src={assets.profile_icon} alt="" />
            </button>
            <div className="navbar-profile-dropdown">
              <button type="button" onClick={() => navigate("/myorders")}>
                <img src={assets.bag_icon} alt="" />
                <span>My orders</span>
              </button>
              <hr />
              <button type="button" onClick={logout}>
                <img src={assets.logout_icon} alt="" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
        <button
          className={`navbar-menu-toggle ${mobileMenuOpen ? "is-open" : ""}`}
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>
  );
};

export default Navbar;