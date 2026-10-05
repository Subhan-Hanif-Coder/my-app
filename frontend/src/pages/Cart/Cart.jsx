import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiMinus, FiPlus, FiShield, FiShoppingBag, FiTrash2 } from "react-icons/fi";
import { StoreContext } from "../../context/StoreContext";
import "./Cart.css";

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const Cart = () => {
  const { cartItems, food_list, addToCart, removeFromCart, getTotalCartAmount, url } =
    useContext(StoreContext);
  const navigate = useNavigate();
  const items = food_list.filter((item) => Number(cartItems[item._id]) > 0);
  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal > 0 ? 2 : 0;
  const total = subtotal + deliveryFee;

  return (
    <main className="cart">
      <header className="cart-page-heading">
        <div>
          <span className="section-eyebrow">A LITTLE SOMETHING GOOD</span>
          <h1>Your bag</h1>
          <p>{items.length ? `${items.length} ${items.length === 1 ? "dish" : "dishes"} selected` : "Your next favourite is just around the corner."}</p>
        </div>
        <Link className="cart-continue-link" to="/#food-display">
          Keep exploring <FiArrowRight />
        </Link>
      </header>

      {items.length ? (
        <div className="cart-content-grid">
          <section className="cart-items" aria-label="Items in your cart">
            <div className="cart-items-title" aria-hidden="true">
              <span>Dish</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
              <span />
            </div>
            <div className="cart-items-list">
              {items.map((item) => {
                const quantity = Number(cartItems[item._id]);
                return (
                  <article className="cart-items-item" key={item._id}>
                    <div className="cart-item-product">
                      <img src={`${url}/images/${item.image}`} alt={item.name} />
                      <div>
                        <h2>{item.name}</h2>
                        <span>Fresh from our kitchen</span>
                      </div>
                    </div>
                    <span className="cart-item-price">{formatMoney(item.price)}</span>
                    <div className="cart-item-quantity" aria-label={`Quantity of ${item.name}`}>
                      <button type="button" onClick={() => removeFromCart(item._id)} aria-label={`Remove one ${item.name}`}>
                        <FiMinus />
                      </button>
                      <span>{quantity}</span>
                      <button type="button" onClick={() => addToCart(item._id)} aria-label={`Add one ${item.name}`}>
                        <FiPlus />
                      </button>
                    </div>
                    <b className="cart-item-total">{formatMoney(item.price * quantity)}</b>
                    <button
                      className="cart-item-remove"
                      type="button"
                      onClick={async () => {
                        for (let count = 0; count < quantity; count += 1) {
                          await removeFromCart(item._id);
                        }
                      }}
                      aria-label={`Remove ${item.name} from cart`}
                    >
                      <FiTrash2 />
                    </button>
                  </article>
                );
              })}
            </div>
            <div className="cart-items-note">
              <FiShoppingBag />
              <span>Your dishes are prepared fresh after you place your order.</span>
            </div>
          </section>

          <aside className="cart-summary">
            <span className="section-eyebrow">ORDER SUMMARY</span>
            <h2>Almost yours</h2>
            <div className="cart-summary-lines">
              <div><span>Subtotal</span><b>{formatMoney(subtotal)}</b></div>
              <div><span>Delivery</span><b>{formatMoney(deliveryFee)}</b></div>
              <div className="cart-summary-total"><span>Total</span><b>{formatMoney(total)}</b></div>
            </div>
            <button type="button" onClick={() => navigate("/order")} disabled={!total}>
              Continue to checkout <FiArrowRight />
            </button>
            <div className="cart-secure-note">
              <FiShield />
              <span><b>Secure checkout</b><small>Payment is processed safely by Stripe.</small></span>
            </div>
          </aside>
        </div>
      ) : (
        <section className="cart-empty-state">
          <span className="cart-empty-icon"><FiShoppingBag /></span>
          <h2>Your bag is taking a little break</h2>
          <p>Explore the menu and add something delicious to get started.</p>
          <Link to="/#food-display">Explore the menu <FiArrowRight /></Link>
        </section>
      )}
    </main>
  );
};

export default Cart;
