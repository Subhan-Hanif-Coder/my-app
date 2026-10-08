import React, { useContext, useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartAnimation, setCartAnimation] = useState(null);
  const [cartBounce, setCartBounce] = useState(false);

  const { cartItems, token, setToken } = useContext(StoreContext);

  const navigate = useNavigate();
  const location = useLocation();

  // Total quantity in cart
  const cartCount = Object.values(cartItems || {}).reduce(
    (total, quantity) => total + Number(quantity || 0),
    0
  );

  useEffect(() => {
    const handleCartAnimation = (event) => {
      const { imageUrl, sourceRect } = event.detail || {};

      if (!imageUrl || !sourceRect) return;

      const basket = document.querySelector(".navbar-search-icon > a");

      if (!basket) return;

      const basketRect = basket.getBoundingClientRect();

      const startX = sourceRect.left + sourceRect.width / 2 - 42;
      const startY = sourceRect.top + sourceRect.height / 2 - 42;

      const targetX = basketRect.left + basketRect.width / 2 - 42;
      const targetY = basketRect.top + basketRect.height / 2 - 42;

      const dx = targetX - startX;
      const dy = targetY - startY;

      setCartAnimation({
        id: Date.now(),
        imageUrl,
        startX,
        startY,
        dx,
        dy,
      });

      setCartBounce(false);

      window.setTimeout(() => {
        setCartBounce(true);
      }, 580);

      window.setTimeout(() => {
        setCartAnimation(null);
        setCartBounce(false);
      }, 720);
    };

    document.addEventListener("cart:item-added", handleCartAnimation);

    return () => {
      document.removeEventListener(
        "cart:item-added",
        handleCartAnimation
      );
    };
  }, []);

  const scrollToSection = (sectionId) => {
    window.setTimeout(() => {
      const section = document.getElementById(sectionId);

      if (section) {
        section.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 120);
  };

  const handleSectionNavigation = (selectedMenu, sectionId) => {
    setMenu(selectedMenu);
    setMobileMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/");
      scrollToSection(sectionId);
      return;
    }

    scrollToSection(sectionId);
  };

  const handleHomeNavigation = () => {
    setMenu("home");
    setMobileMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setMobileMenuOpen(false);

    navigate("/");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <header className="navbar">
        <Link
          to="/"
          className="navbar-logo-link"
          aria-label="Subhan Restaurant home"
          onClick={handleHomeNavigation}
        >
          <img
            src={assets.logo}
            alt="Subhan Restaurant"
            className="logo"
          />
        </Link>

        <nav
          className={`navbar-menu ${
            mobileMenuOpen ? "is-open" : ""
          }`}
          aria-label="Main navigation"
        >
          <button
            type="button"
            className={menu === "home" ? "active" : ""}
            onClick={handleHomeNavigation}
          >
            Home
          </button>

          <button
            type="button"
            className={menu === "menu" ? "active" : ""}
            onClick={() =>
              handleSectionNavigation("menu", "explore-menu")
            }
          >
            Menu
          </button>

          <button
            type="button"
            className={menu === "mobile-app" ? "active" : ""}
            onClick={() =>
              handleSectionNavigation("mobile-app", "app-download")
            }
          >
            Our app
          </button>

          <button
            type="button"
            className={menu === "contact-us" ? "active" : ""}
            onClick={() =>
              handleSectionNavigation("contact-us", "footer")
            }
          >
            Contact
          </button>
        </nav>

        <div className="navbar-right">
          <button
            type="button"
            className="navbar-icon-link"
            onClick={() =>
              handleSectionNavigation("menu", "food-display")
            }
            aria-label="Search the menu"
          >
            <img src={assets.search_icon} alt="" />
          </button>

          <div
            className={`navbar-search-icon ${
              cartBounce ? "cart-bounce" : ""
            }`}
          >
            <Link
              to="/cart"
              aria-label={`Open shopping cart${
                cartCount > 0 ? `, ${cartCount} items` : ""
              }`}
            >
              <img src={assets.basket_icon} alt="" />

              {cartCount > 0 && (
                <span className="cart-count-badge">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>

          {!token ? (
            <button
              type="button"
              className="navbar-sign-in"
              onClick={() => setShowLogin(true)}
            >
              Sign in
            </button>
          ) : (
            <div className="navbar-profile">
              <button
                className="navbar-profile-trigger"
                type="button"
                aria-label="Open account menu"
              >
                <img src={assets.profile_icon} alt="" />
              </button>

              <div className="navbar-profile-dropdown">
                <button
                  type="button"
                  onClick={() => navigate("/myorders")}
                >
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
            className={`navbar-menu-toggle ${
              mobileMenuOpen ? "is-open" : ""
            }`}
            type="button"
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            onClick={() =>
              setMobileMenuOpen((open) => !open)
            }
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {cartAnimation && (
        <img
          key={cartAnimation.id}
          className="cart-flying-image"
          src={cartAnimation.imageUrl}
          alt=""
          aria-hidden="true"
          style={{
            left: `${cartAnimation.startX}px`,
            top: `${cartAnimation.startY}px`,
            "--cart-x": `${cartAnimation.dx}px`,
            "--cart-y": `${cartAnimation.dy}px`,
          }}
        />
      )}
    </>
  );
};

export default Navbar;