import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FiArrowLeft, FiArrowRight, FiLock, FiTag } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import "./PlaceOrder.css";

const DeliveryField = ({ name, label, type = "text", value, onChange, autoComplete }) => (
  <label className="delivery-field">
    <span>{label}</span>
    <input
      required
      name={name}
      onChange={onChange}
      value={value}
      type={type}
      autoComplete={autoComplete}
      placeholder={label}
    />
  </label>
);

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`;

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url } =
    useContext(StoreContext);
  const navigate = useNavigate();
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [promotionCode, setPromotionCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [promotionQuote, setPromotionQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteRevision, setQuoteRevision] = useState(0);
  const subtotal = getTotalCartAmount();
  const quoteKey = `${subtotal}:${appliedCode}`;
  const activeQuote = promotionQuote?.key === quoteKey ? promotionQuote.data : null;
  const activeQuoteError = quoteError?.key === quoteKey ? quoteError.message : "";
  const quoteLoading = Boolean(subtotal && !activeQuote && !activeQuoteError);
  const total = activeQuote?.total ?? subtotal + (subtotal > 0 ? 2 : 0);
  const orderItems = food_list.filter((item) => Number(cartItems[item._id]) > 0);

  useEffect(() => {
    if (!subtotal) {
      return undefined;
    }
    let cancelled = false;
    const requestedQuoteKey = quoteKey;
    axios.post(`${url}/api/order/promotions/quote`, { subtotal, code: appliedCode })
      .then((response) => {
        if (!response.data?.success) {
          throw new Error(response.data?.message || "We couldn't check this offer.");
        }
        if (!cancelled) setPromotionQuote({ key: requestedQuoteKey, data: response.data.data });
      })
      .catch((error) => {
        if (!cancelled) {
          setQuoteError({
            key: requestedQuoteKey,
            message: error.response?.data?.message || error.message || "We couldn't check this offer.",
          });
        }
      })
    return () => {
      cancelled = true;
    };
  }, [appliedCode, quoteKey, quoteRevision, subtotal, url]);

  const applyPromotionCode = () => {
    const normalizedCode = promotionCode.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedCode("");
      return;
    }
    setAppliedCode(normalizedCode);
  };

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((current) => ({ ...current, [name]: value }));
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const items = orderItems.map((item) => ({
        _id: item._id,
        quantity: Number(cartItems[item._id]),
      }));
      const response = await axios.post(
        `${url}/api/order/place`,
        { address: data, items, promotionCode: appliedCode },
        { headers: { token } },
      );
      if (!response.data?.success || !response.data.session_url) {
        throw new Error(response.data?.message || "We couldn't start secure checkout.");
      }
      window.location.assign(response.data.session_url);
    } catch (error) {
      console.error("Error starting checkout", error);
      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "We couldn't start checkout. Please try again.",
      );
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!token || !subtotal) {
      navigate("/cart");
    }
  }, [navigate, subtotal, token]);

  return (
    <main className="checkout-page">
      <Link className="checkout-back-link" to="/cart"><FiArrowLeft /> Back to your bag</Link>
      <header className="checkout-heading">
        <span className="section-eyebrow">ONE LAST STEP</span>
        <h1>Let’s get it to you.</h1>
        <p>Add your delivery details and we’ll take you to secure payment.</p>
      </header>

      <form onSubmit={placeOrder} className="place-order">
        <section className="place-order-left">
          <div className="checkout-section-heading">
            <span className="checkout-step-number">01</span>
            <div>
              <h2>Delivery information</h2>
              <p>Where should we bring your order?</p>
            </div>
          </div>
          <div className="delivery-fields">
            <div className="multi-fields">
              <DeliveryField name="firstName" label="First name" value={data.firstName} onChange={onChangeHandler} autoComplete="given-name" />
              <DeliveryField name="lastName" label="Last name" value={data.lastName} onChange={onChangeHandler} autoComplete="family-name" />
            </div>
            <DeliveryField name="email" label="Email address" type="email" value={data.email} onChange={onChangeHandler} autoComplete="email" />
            <DeliveryField name="street" label="Street address" value={data.street} onChange={onChangeHandler} autoComplete="street-address" />
            <div className="multi-fields">
              <DeliveryField name="city" label="City" value={data.city} onChange={onChangeHandler} autoComplete="address-level2" />
              <DeliveryField name="state" label="State / region" value={data.state} onChange={onChangeHandler} autoComplete="address-level1" />
            </div>
            <div className="multi-fields">
              <DeliveryField name="zipcode" label="ZIP / postal code" value={data.zipcode} onChange={onChangeHandler} autoComplete="postal-code" />
              <DeliveryField name="country" label="Country" value={data.country} onChange={onChangeHandler} autoComplete="country-name" />
            </div>
            <DeliveryField name="phone" label="Phone number" type="tel" value={data.phone} onChange={onChangeHandler} autoComplete="tel" />
          </div>
        </section>

        <aside className="place-order-right">
          <div className="checkout-section-heading">
            <span className="checkout-step-number">02</span>
            <div>
              <h2>Your order</h2>
              <p>{orderItems.length} {orderItems.length === 1 ? "dish" : "dishes"} from our kitchen</p>
            </div>
          </div>
          <div className="checkout-order-items">
            {orderItems.map((item) => (
              <div className="checkout-order-item" key={item._id}>
                <span><b>{item.name}</b><small>Qty {cartItems[item._id]}</small></span>
                <b>{formatMoney(item.price * Number(cartItems[item._id]))}</b>
              </div>
            ))}
          </div>
          <div className="checkout-promo-form">
            <label htmlFor="checkout-promo-code"><FiTag /> Have a promo code?</label>
            <div>
              <input
                id="checkout-promo-code"
                value={promotionCode}
                onChange={(event) => setPromotionCode(event.target.value.toUpperCase())}
                placeholder="Enter code"
                autoComplete="off"
                aria-describedby={activeQuoteError ? "checkout-promo-error" : undefined}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyPromotionCode();
                  }
                }}
              />
              <button type="button" onClick={applyPromotionCode} disabled={quoteLoading || !promotionCode.trim()}>
                {quoteLoading ? "Checking…" : "Apply"}
              </button>
            </div>
            {appliedCode && !activeQuoteError && activeQuote?.promotion && (
              <p className="checkout-promo-success" role="status">
                {activeQuote.promotion.title} applied.
                <button type="button" onClick={() => { setAppliedCode(""); setPromotionCode(""); }}>
                  Remove
                </button>
              </p>
            )}
            {activeQuoteError && (
              <p className="checkout-promo-error" id="checkout-promo-error" role="alert">
                {activeQuoteError}
                <button type="button" onClick={() => {
                  setQuoteError("");
                  setQuoteRevision((revision) => revision + 1);
                }}>
                  Try again
                </button>
                {appliedCode && (
                  <button type="button" onClick={() => { setAppliedCode(""); setPromotionCode(""); }}>
                    Clear code
                  </button>
                )}
              </p>
            )}
            {!appliedCode && activeQuote?.promotion && (
              <p className="checkout-promo-success" role="status">
                {activeQuote.promotion.title} applied automatically.
              </p>
            )}
          </div>
          <div className="cart-total">
            <div className="cart-total-details"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
            {activeQuote?.discount > 0 && (
              <div className="cart-total-details checkout-discount-row">
                <span>Discount</span><span>−{formatMoney(activeQuote.discount)}</span>
              </div>
            )}
            <div className="cart-total-details"><span>Delivery</span><span>{formatMoney(subtotal ? activeQuote?.delivery ?? 2 : 0)}</span></div>
            <div className="cart-total-details checkout-grand-total"><b>Total</b><b>{formatMoney(total)}</b></div>
            {submitError && <p className="checkout-error" role="alert">{submitError}</p>}
            <button type="submit" disabled={isSubmitting || quoteLoading || Boolean(activeQuoteError) || !total}>
              {isSubmitting ? "Connecting to Stripe…" : quoteLoading ? "Checking offer…" : "Continue to secure payment"}
              {!isSubmitting && <FiArrowRight />}
            </button>
            <p className="checkout-secure-note"><FiLock /> Secure payment powered by Stripe</p>
          </div>
        </aside>
      </form>
    </main>
  );
};

export default PlaceOrder;
