import React, { useContext } from "react";
import "./ExploreMenu.css";
import { menu_list } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

const ExploreMenu = ({ category, setCategory }) => {
  const { food_list } = useContext(StoreContext);

  return (
    <div className="explore-menu" id="explore-menu">
      <div className="explore-menu-heading">
        <div>
          <span className="section-eyebrow">MADE FOR YOUR CRAVINGS</span>
          <h1>Explore our menu</h1>
        </div>
        <span className="explore-menu-note">A little something for every mood</span>
      </div>
      <p className="explore-menu-text">
        Browse our kitchen's selection, freshly updated with what's available today.
      </p>
      <div className="explore-menu-list">
        <button
          type="button"
          onClick={() => setCategory("All")}
          className={`explore-menu-list-item explore-menu-all ${category === "All" ? "active" : ""}`}
          aria-pressed={category === "All"}
        >
          <span className="explore-menu-all-icon">✳</span>
          <span>Everything</span>
          <small>{food_list.length}</small>
        </button>
        {menu_list.map((item) => (
          <button
            type="button"
            onClick={() => setCategory(category === item.menu_name ? "All" : item.menu_name)}
            className={`explore-menu-list-item ${category === item.menu_name ? "active" : ""}`}
            key={item.menu_name}
            aria-pressed={category === item.menu_name}
          >
            <img src={item.menu_image} alt="" />
            <span>{item.menu_name}</span>
            <small>{food_list.filter((food) => food.category === item.menu_name).length}</small>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ExploreMenu;
