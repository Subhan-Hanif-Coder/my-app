import React, { useContext, useState } from "react";
import "./FoodDisplay.css";
import { StoreContext } from "../../context/StoreContext";
import FoodItem from "../FoodItem/FoodItem";
import { FiRefreshCw, FiSearch } from "react-icons/fi";

const FoodDisplay = ({ category, searchQuery, setSearchQuery }) => {
  const { food_list, foodLoading, foodError, refreshFoodList } = useContext(StoreContext);
  const [sortOrder, setSortOrder] = useState("featured");
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleFoods = food_list
    .filter((item) => {
      const matchesCategory = category === "All" || category === item.category;
      const searchableText = `${item.name} ${item.description} ${item.category}`.toLowerCase();
      return matchesCategory && searchableText.includes(normalizedQuery);
    })
    .sort((first, second) => {
      if (sortOrder === "price-low") return first.price - second.price;
      if (sortOrder === "price-high") return second.price - first.price;
      if (sortOrder === "name") return first.name.localeCompare(second.name);
      return 0;
    });

  return (
    <div className="food-display" id="food-display">
      <div className="food-display-heading">
        <div>
          <span className="section-eyebrow">FROM OUR KITCHEN TO YOUR TABLE</span>
          <h1>{category === "All" ? "Find your new favourite" : category}</h1>
          <p className="food-display-count">
            {foodLoading
              ? "Refreshing today's menu…"
              : `${visibleFoods.length} ${visibleFoods.length === 1 ? "dish" : "dishes"} to make your day`}
          </p>
        </div>
        <div className="food-display-controls">
          <label className="food-search">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search dishes..."
              aria-label="Search dishes"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} aria-label="Clear search">
                ×
              </button>
            )}
          </label>
          <label className="food-sort">
            <span>Sort</span>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort dishes">
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>
      </div>
      {foodError ? (
        <div className="food-state food-state-error" role="alert">
          <span>{foodError}</span>
          <button type="button" onClick={refreshFoodList}><FiRefreshCw /> Try again</button>
        </div>
      ) : foodLoading && food_list.length === 0 ? (
        <div className="food-state" role="status">Setting the table…</div>
      ) : visibleFoods.length > 0 ? (
        <div className="food-display-list">
          {visibleFoods.map((item) => (
            <FoodItem
              key={item._id}
              id={item._id}
              name={item.name}
              description={item.description}
              price={item.price}
              image={item.image}
            />
          ))}
        </div>
      ) : (
        <div className="food-state">
          <span className="food-state-mark">✳</span>
          <h2>No dishes found</h2>
          <p>Try another search or choose a different category.</p>
          {searchQuery && <button type="button" onClick={() => setSearchQuery("")}>Clear search</button>}
        </div>
      )}
    </div>
  );
};

export default FoodDisplay;
