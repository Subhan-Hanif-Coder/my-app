import React, { useContext } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems, addToCart, removeFromCart, url } =
    useContext(StoreContext);

  const quantity = cartItems?.[id] || 0;

  const handleAddToCart = () => {
    addToCart(id);

    // Flying food image animation
    const foodImage = document.querySelector(
      `.food-item-image[data-food-id="${id}"]`
    );

    if (foodImage) {
      const rect = foodImage.getBoundingClientRect();

      document.dispatchEvent(
        new CustomEvent("cart:item-added", {
          detail: {
            imageUrl: `${url}/images/${image}`,
            sourceRect: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
          },
        })
      );
    }
  };

  return (
    <article className="food-item">
      <div className="food-item-img-container">
        <img
          src={`${url}/images/${image}`}
          alt={name}
          className="food-item-image"
          data-food-id={id}
          loading="lazy"
        />

        {quantity === 0 ? (
          <button
            type="button"
            className="food-item-add"
            onClick={handleAddToCart}
            aria-label={`Add ${name} to cart`}
          >
            <img src={assets.add_icon_white} alt="" />
          </button>
        ) : (
          <div
            className="food-item-counter"
            aria-label={`${quantity} items`}
          >
            <button
              type="button"
              onClick={() => removeFromCart(id)}
              aria-label={`Remove one ${name}`}
            >
              <img src={assets.remove_icon_red} alt="" />
            </button>

            <span>{quantity}</span>

            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={`Add one more ${name}`}
            >
              <img src={assets.add_icon_green} alt="" />
            </button>
          </div>
        )}
      </div>

      <div className="food-item-info">
        <div className="food-item-name-rating">
          <h3>{name}</h3>

          <img
            src={assets.rating_starts}
            alt="5 star rating"
            className="food-item-rating"
          />
        </div>

        <p className="food-item-desc">{description}</p>

        <div className="food-item-bottom">
          <p className="food-item-price">
            ${Number(price).toFixed(2)}
          </p>

          {quantity > 0 && (
            <span className="food-item-added">
              {quantity} {quantity === 1 ? "item" : "items"}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default FoodItem;