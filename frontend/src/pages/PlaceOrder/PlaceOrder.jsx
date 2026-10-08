import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import {
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiLock,
  FiTag,
} from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { StoreContext } from "../../context/StoreContext";
import "./PlaceOrder.css";

const DeliveryField = ({
  name,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  inputMode,
}) => (
  <label className="delivery-field">
    <span>{label}</span>

    <input
      required
      name={name}
      onChange={onChange}
      value={value}
      type={type}
      autoComplete={autoComplete}
      inputMode={inputMode}
      placeholder={label}
    />
  </label>
);

const formatMoney = (amount) =>
  `$${Number(amount || 0).toFixed(2)}`;

const PlaceOrder = () => {
  const {
    getTotalCartAmount,
    token,
    food_list,
    cartItems,
    setCartItems,
    url,
  } = useContext(StoreContext);

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

  const [paymentMethod, setPaymentMethod] =
    useState("online");

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [submitError, setSubmitError] =
    useState("");

  const [promotionCode, setPromotionCode] =
    useState("");

  const [appliedCode, setAppliedCode] =
    useState("");

  const [promotionQuote, setPromotionQuote] =
    useState(null);

  const [quoteError, setQuoteError] =
    useState("");

  const [quoteRevision, setQuoteRevision] =
    useState(0);

  const subtotal = getTotalCartAmount();

  const quoteKey = `${subtotal}:${appliedCode}`;

  const activeQuote =
    promotionQuote?.key === quoteKey
      ? promotionQuote.data
      : null;

  const activeQuoteError =
    quoteError?.key === quoteKey
      ? quoteError.message
      : "";

  const quoteLoading = Boolean(
    subtotal &&
      !activeQuote &&
      !activeQuoteError
  );

  const total =
    activeQuote?.total ??
    subtotal + (subtotal > 0 ? 2 : 0);

  const orderItems = food_list.filter(
    (item) => Number(cartItems[item._id]) > 0
  );

  const totalItems = orderItems.reduce(
    (sum, item) =>
      sum +
      Number(cartItems[item._id] || 0),
    0
  );

  // ======================================================
  // PROMOTION QUOTE
  // ======================================================

  useEffect(() => {
    if (!subtotal) {
      return undefined;
    }

    let cancelled = false;
    const requestedQuoteKey = quoteKey;

    axios
      .post(
        `${url}/api/order/promotions/quote`,
        {
          subtotal,
          code: appliedCode,
        }
      )
      .then((response) => {
        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "We couldn't check this offer."
          );
        }

        if (!cancelled) {
          setPromotionQuote({
            key: requestedQuoteKey,
            data: response.data.data,
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setQuoteError({
            key: requestedQuoteKey,
            message:
              error.response?.data?.message ||
              error.message ||
              "We couldn't check this offer.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    appliedCode,
    quoteKey,
    quoteRevision,
    subtotal,
    url,
  ]);

  // ======================================================
  // PROMOTION
  // ======================================================

  const applyPromotionCode = () => {
    const normalizedCode =
      promotionCode
        .trim()
        .toUpperCase();

    if (!normalizedCode) {
      setAppliedCode("");
      return;
    }

    setAppliedCode(normalizedCode);
    setQuoteError("");
  };

  const clearPromotionCode = () => {
    setAppliedCode("");
    setPromotionCode("");
    setQuoteError("");
    setPromotionQuote(null);
  };

  // ======================================================
  // FORM CHANGE
  // ======================================================

  const onChangeHandler = (event) => {
    const {
      name,
      value,
    } = event.target;

    setData((current) => ({
      ...current,
      [name]: value,
    }));

    if (submitError) {
      setSubmitError("");
    }
  };

  // ======================================================
  // PLACE ORDER
  // ======================================================

  const placeOrder = async (event) => {
    event.preventDefault();

    if (!token) {
      navigate("/cart");
      return;
    }

    if (!orderItems.length || !subtotal) {
      navigate("/cart");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const items = orderItems.map(
        (item) => ({
          _id: item._id,
          quantity:
            Number(
              cartItems[item._id]
            ),
        })
      );

      const response =
        await axios.post(
          `${url}/api/order/place`,
          {
            address: data,
            items,
            promotionCode: appliedCode,

            // IMPORTANT:
            // online = Stripe
            // cod = Cash on Delivery
            paymentMethod,
          },
          {
            headers: {
              token,
            },
          }
        );

      // ==================================================
      // COD SUCCESS
      // ==================================================

      if (
        response.data?.success &&
        response.data?.paymentMethod ===
          "cod"
      ) {
        setCartItems({});
        navigate("/myorders", {
          replace: true,
          state: {
            notification: {
              title:
                "Order placed successfully!",
              message:
                "Your order is confirmed. Please pay cash when your order is delivered.",
            },
          },
        });

        return;
      }

      // ==================================================
      // ONLINE PAYMENT
      // ==================================================

      if (
        paymentMethod === "online" &&
        response.data?.success &&
        response.data?.session_url
      ) {
        window.location.assign(
          response.data.session_url
        );

        return;
      }

      throw new Error(
        response.data?.message ||
          "We couldn't start payment. Please try again."
      );

    } catch (error) {
      console.error(
        "Error placing order",
        error
      );

      setSubmitError(
        error.response?.data?.message ||
          error.message ||
          "We couldn't place your order. Please try again."
      );

      setIsSubmitting(false);
    }
  };

  // ======================================================
  // PROTECT CHECKOUT
  // ======================================================

  useEffect(() => {
    if ((!token || !subtotal) && !isSubmitting) {
      navigate("/cart");
    }
  }, [
    isSubmitting,
    navigate,
    subtotal,
    token,
  ]);

  return (
    <main className="checkout-page">

      <Link
        className="checkout-back-link"
        to="/cart"
      >
        <FiArrowLeft />
        <span>
          Back to your bag
        </span>
      </Link>

      <header className="checkout-heading">

        <span className="section-eyebrow">
          ONE LAST STEP
        </span>

        <h1>
          Let’s get it to you.
        </h1>

        <p>
          Add your delivery details and
          choose how you’d like to pay.
        </p>

      </header>

      <form
        onSubmit={placeOrder}
        className="place-order"
      >

        {/* ==================================================
            LEFT SIDE
        ================================================== */}

        <section className="place-order-left">

          <div className="checkout-section-heading">

            <span className="checkout-step-number">
              01
            </span>

            <div>
              <h2>
                Delivery information
              </h2>

              <p>
                Where should we bring your
                order?
              </p>
            </div>

          </div>

          <div className="delivery-fields">

            <div className="multi-fields">

              <DeliveryField
                name="firstName"
                label="First name"
                value={data.firstName}
                onChange={
                  onChangeHandler
                }
                autoComplete="given-name"
              />

              <DeliveryField
                name="lastName"
                label="Last name"
                value={data.lastName}
                onChange={
                  onChangeHandler
                }
                autoComplete="family-name"
              />

            </div>

            <DeliveryField
              name="email"
              label="Email address"
              type="email"
              value={data.email}
              onChange={
                onChangeHandler
              }
              autoComplete="email"
            />

            <DeliveryField
              name="street"
              label="Street address"
              value={data.street}
              onChange={
                onChangeHandler
              }
              autoComplete="street-address"
            />

            <div className="multi-fields">

              <DeliveryField
                name="city"
                label="City"
                value={data.city}
                onChange={
                  onChangeHandler
                }
                autoComplete="address-level2"
              />

              <DeliveryField
                name="state"
                label="State / region"
                value={data.state}
                onChange={
                  onChangeHandler
                }
                autoComplete="address-level1"
              />

            </div>

            <div className="multi-fields">

              <DeliveryField
                name="zipcode"
                label="ZIP / postal code"
                value={data.zipcode}
                onChange={
                  onChangeHandler
                }
                autoComplete="postal-code"
                inputMode="numeric"
              />

              <DeliveryField
                name="country"
                label="Country"
                value={data.country}
                onChange={
                  onChangeHandler
                }
                autoComplete="country-name"
              />

            </div>

            <DeliveryField
              name="phone"
              label="Phone number"
              type="tel"
              value={data.phone}
              onChange={
                onChangeHandler
              }
              autoComplete="tel"
              inputMode="tel"
            />

          </div>

        </section>

        {/* ==================================================
            RIGHT SIDE
        ================================================== */}

        <aside className="place-order-right">

          <div className="checkout-section-heading">

            <span className="checkout-step-number">
              02
            </span>

            <div>

              <h2>
                Your order
              </h2>

              <p>
                {totalItems}{" "}
                {totalItems === 1
                  ? "item"
                  : "items"}{" "}
                ·{" "}
                {orderItems.length}{" "}
                {orderItems.length === 1
                  ? "dish"
                  : "dishes"}
              </p>

            </div>

          </div>

          {/* ORDER ITEMS */}

          <div className="checkout-order-items">

            {orderItems.map(
              (item) => {

                const quantity =
                  Number(
                    cartItems[
                      item._id
                    ]
                  );

                return (
                  <div
                    className="checkout-order-item"
                    key={item._id}
                  >

                    <span>

                      <b>
                        {item.name}
                      </b>

                      <small>
                        Qty{" "}
                        {quantity}
                      </small>

                    </span>

                    <b>
                      {formatMoney(
                        item.price *
                          quantity
                      )}
                    </b>

                  </div>
                );
              }
            )}

          </div>

          {/* PROMO */}

          <div className="checkout-promo-form">

            <label htmlFor="checkout-promo-code">
              <FiTag />
              Have a promo code?
            </label>

            <div>

              <input
                id="checkout-promo-code"
                value={promotionCode}
                onChange={(event) =>
                  setPromotionCode(
                    event.target.value.toUpperCase()
                  )
                }
                placeholder="Enter code"
                autoComplete="off"
                aria-describedby={
                  activeQuoteError
                    ? "checkout-promo-error"
                    : undefined
                }
                onKeyDown={(event) => {

                  if (
                    event.key ===
                    "Enter"
                  ) {
                    event.preventDefault();
                    applyPromotionCode();
                  }

                }}
              />

              <button
                type="button"
                onClick={
                  applyPromotionCode
                }
                disabled={
                  quoteLoading ||
                  !promotionCode.trim()
                }
              >
                {quoteLoading
                  ? "Checking…"
                  : "Apply"}
              </button>

            </div>

            {appliedCode &&
              !activeQuoteError &&
              activeQuote?.promotion && (
                <p
                  className="checkout-promo-success"
                  role="status"
                >

                  <span>
                    <FiCheckCircle />

                    {
                      activeQuote
                        .promotion
                        .title
                    }{" "}
                    applied.
                  </span>

                  <button
                    type="button"
                    onClick={
                      clearPromotionCode
                    }
                  >
                    Remove
                  </button>

                </p>
              )}

            {activeQuoteError && (
              <p
                className="checkout-promo-error"
                id="checkout-promo-error"
                role="alert"
              >

                <span>
                  {activeQuoteError}
                </span>

                <span className="promo-error-actions">

                  <button
                    type="button"
                    onClick={() => {
                      setQuoteError("");
                      setQuoteRevision(
                        (revision) =>
                          revision + 1
                      );
                    }}
                  >
                    Try again
                  </button>

                  {appliedCode && (
                    <button
                      type="button"
                      onClick={
                        clearPromotionCode
                      }
                    >
                      Clear code
                    </button>
                  )}

                </span>

              </p>
            )}

            {!appliedCode &&
              activeQuote?.promotion && (
                <p
                  className="checkout-promo-success"
                  role="status"
                >

                  <span>
                    <FiCheckCircle />

                    {
                      activeQuote
                        .promotion
                        .title
                    }{" "}
                    applied
                    automatically.
                  </span>

                </p>
              )}

          </div>

          {/* ==================================================
              PAYMENT METHOD
          ================================================== */}

          <div className="checkout-payment-method">

            <div className="checkout-payment-heading">

              <span>
                Payment method
              </span>

              <small>
                Choose how you want to pay
              </small>

            </div>

            <div className="payment-method-options">

              <label
                className={`payment-option ${
                  paymentMethod ===
                  "online"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="paymentMethod"
                  value="online"
                  checked={
                    paymentMethod ===
                    "online"
                  }
                  onChange={() => {
                    setPaymentMethod(
                      "online"
                    );
                    setSubmitError("");
                  }}
                />

                <span className="payment-option-content">

                  <strong>
                    Pay Online
                  </strong>

                  <small>
                    Secure payment with
                    Stripe
                  </small>

                </span>

              </label>

              <label
                className={`payment-option ${
                  paymentMethod ===
                  "cod"
                    ? "selected"
                    : ""
                }`}
              >

                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={
                    paymentMethod ===
                    "cod"
                  }
                  onChange={() => {
                    setPaymentMethod(
                      "cod"
                    );
                    setSubmitError("");
                  }}
                />

                <span className="payment-option-content">

                  <strong>
                    Cash on Delivery
                  </strong>

                  <small>
                    Pay when your order
                    arrives
                  </small>

                </span>

              </label>

            </div>

          </div>

          {/* ==================================================
              TOTAL
          ================================================== */}

          <div className="cart-total">

            <div className="cart-total-details">

              <span>
                Subtotal
              </span>

              <span>
                {formatMoney(
                  subtotal
                )}
              </span>

            </div>

            {activeQuote?.discount >
              0 && (
              <div className="cart-total-details checkout-discount-row">

                <span>
                  Discount
                </span>

                <span>
                  −
                  {formatMoney(
                    activeQuote.discount
                  )}
                </span>

              </div>
            )}

            <div className="cart-total-details">

              <span>
                Delivery
              </span>

              <span>
                {formatMoney(
                  subtotal
                    ? activeQuote?.delivery ??
                        2
                    : 0
                )}
              </span>

            </div>

            <div className="cart-total-details checkout-grand-total">

              <b>
                Total
              </b>

              <b>
                {formatMoney(
                  total
                )}
              </b>

            </div>

            {submitError && (
              <p
                className="checkout-error"
                role="alert"
              >
                {submitError}
              </p>
            )}

            {/* ==================================================
                SUBMIT BUTTON
            ================================================== */}

            <button
              type="submit"
              disabled={
                isSubmitting ||
                quoteLoading ||
                Boolean(
                  activeQuoteError
                ) ||
                !total
              }
            >

              {isSubmitting
                ? paymentMethod ===
                  "cod"
                  ? "Placing order…"
                  : "Connecting to Stripe…"
                : quoteLoading
                ? "Checking offer…"
                : paymentMethod ===
                  "cod"
                ? "Place COD Order"
                : "Continue to secure payment"}

              {!isSubmitting && (
                <FiArrowRight />
              )}

            </button>

            <p className="checkout-secure-note">

              <FiLock />

              {paymentMethod ===
              "cod"
                ? "Pay cash when your order is delivered."
                : "Secure payment powered by Stripe"}

            </p>

          </div>

        </aside>

      </form>

    </main>
  );
};

export default PlaceOrder;