import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiMinus,
  FiPlus,
  FiShield,
  FiShoppingBag,
  FiTrash2,
  FiTruck,
  FiCheck,
} from "react-icons/fi";
import { StoreContext } from "../../context/StoreContext";
import "./Cart.css";

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const Cart = () => {
  const {
    cartItems,
    food_list,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
  } = useContext(StoreContext);

  const navigate = useNavigate();

  const items = food_list.filter(
    (item) => Number(cartItems?.[item._id]) > 0
  );

  const subtotal = Number(getTotalCartAmount() || 0);
  const deliveryFee = subtotal > 0 ? 2 : 0;
  const total = subtotal + deliveryFee;

  const removeEntireItem = async (id, quantity) => {
    for (let count = 0; count < quantity; count += 1) {
      await removeFromCart(id);
    }
  };

  return (
    <main className="cart-page">
      {/* Header */}
      <header className="cart-page-heading">
        <div className="cart-heading-content">
          <span className="section-eyebrow">YOUR SELECTION</span>

          <h1>Your shopping bag</h1>

          <p>
            {items.length
              ? `${items.length} ${
                  items.length === 1 ? "dish" : "dishes"
                } ready for checkout`
              : "Your next favourite dish is just around the corner."}
          </p>
        </div>

        <Link className="cart-continue-link" to="/#food-display">
          Continue exploring
          <FiArrowRight />
        </Link>
      </header>

      {/* Cart with items */}
      {items.length > 0 ? (
        <div className="cart-content-grid">
          {/* LEFT */}
          <section
            className="cart-items-section"
            aria-label="Items in your cart"
          >
            <div className="cart-items-topbar">
              <div>
                <span className="cart-items-label">YOUR ORDER</span>
                <h2>Selected dishes</h2>
              </div>

              <span className="cart-items-count">
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>

            <div className="cart-items-list">
              {items.map((item) => {
                const quantity = Number(cartItems[item._id] || 0);
                const itemTotal = Number(item.price || 0) * quantity;

                return (
                  <article className="cart-item" key={item._id}>
                    {/* Product */}
                    <div className="cart-item-product">
                      <div className="cart-item-image-wrap">
                        <img
                          src={`${url}/images/${item.image}`}
                          alt={item.name}
                        />
                      </div>

                      <div className="cart-item-details">
                        <span className="cart-item-kicker">
                          FRESH FROM OUR KITCHEN
                        </span>

                        <h3>{item.name}</h3>

                        <p>
                          Carefully prepared and packed fresh for your order.
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="cart-item-price-block">
                      <span>Price</span>
                      <strong>{formatMoney(item.price)}</strong>
                    </div>

                    {/* Quantity */}
                    <div className="cart-item-quantity-block">
                      <span>Quantity</span>

                      <div
                        className="cart-item-quantity"
                        aria-label={`Quantity of ${item.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => removeFromCart(item._id)}
                          aria-label={`Remove one ${item.name}`}
                        >
                          <FiMinus />
                        </button>

                        <strong>{quantity}</strong>

                        <button
                          type="button"
                          onClick={() => addToCart(item._id)}
                          aria-label={`Add one more ${item.name}`}
                        >
                          <FiPlus />
                        </button>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="cart-item-total-block">
                      <span>Total</span>
                      <strong>{formatMoney(itemTotal)}</strong>
                    </div>

                    {/* Remove */}
                    <button
                      className="cart-item-remove"
                      type="button"
                      onClick={() =>
                        removeEntireItem(item._id, quantity)
                      }
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <FiTrash2 />
                    </button>
                  </article>
                );
              })}
            </div>

            {/* Fresh food note */}
            <div className="cart-fresh-note">
              <div className="cart-fresh-icon">
                <FiShoppingBag />
              </div>

              <div>
                <strong>Freshly prepared for you</strong>
                <p>
                  Your dishes are prepared fresh after you place the order.
                </p>
              </div>
            </div>

            {/* Trust row */}
            <div className="cart-trust-row">
              <div>
                <FiCheck />
                <span>Fresh preparation</span>
              </div>

              <div>
                <FiTruck />
                <span>Fast delivery</span>
              </div>

              <div>
                <FiShield />
                <span>Secure payment</span>
              </div>
            </div>
          </section>

          {/* RIGHT SUMMARY */}
          <aside className="cart-summary">
            <span className="section-eyebrow">ORDER SUMMARY</span>

            <h2>Almost yours</h2>

            <p className="cart-summary-intro">
              Review your order before moving to secure checkout.
            </p>

            <div className="cart-summary-lines">
              <div>
                <span>Subtotal</span>
                <strong>{formatMoney(subtotal)}</strong>
              </div>

              <div>
                <span>Delivery</span>
                <strong>{formatMoney(deliveryFee)}</strong>
              </div>
            </div>

            <div className="cart-summary-divider" />

            <div className="cart-summary-total">
              <div>
                <span>Total</span>
                <small>Including delivery</small>
              </div>

              <strong>{formatMoney(total)}</strong>
            </div>

            <button
              className="cart-checkout-button"
              type="button"
              onClick={() => navigate("/order")}
              disabled={!total}
            >
              <span>Continue to checkout</span>
              <FiArrowRight />
            </button>

            <div className="cart-secure-note">
              <div className="cart-secure-icon">
                <FiShield />
              </div>

              <div>
                <strong>Secure checkout</strong>
                <small>
                  Payment is processed safely by Stripe.
                </small>
              </div>
            </div>
          </aside>
        </div>
      ) : (
        /* Empty cart */
        <section className="cart-empty-state">
          <div className="cart-empty-icon">
            <FiShoppingBag />
          </div>

          <span className="section-eyebrow">YOUR BAG IS EMPTY</span>

          <h2>Nothing here yet</h2>

          <p>
            Explore our menu and discover something delicious to add
            to your order.
          </p>

          <Link to="/#food-display" className="cart-empty-button">
            Explore the menu
            <FiArrowRight />
          </Link>
        </section>
      )}
    </main>
  );
};

export default Cart;