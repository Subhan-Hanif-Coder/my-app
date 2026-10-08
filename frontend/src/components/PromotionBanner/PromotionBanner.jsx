// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { Link } from "react-router-dom";
// import { FiArrowRight, FiTag, FiX } from "react-icons/fi";
// import "./PromotionBanner.css";

// const formatDiscount = (promotion) =>
//   promotion.discountType === "percentage"
//     ? `${promotion.discountValue}% off`
//     : `$${Number(promotion.discountValue).toFixed(2)} off`;

// const PromotionBanner = ({ showOffer, onClose }) => {
//   const [promotions, setPromotions] = useState([]);

//   useEffect(() => {
//     let cancelled = false;
//     axios.get("http://localhost:4000/api/order/promotions/active")
//       .then((response) => {
//         if (!cancelled && response.data?.success && Array.isArray(response.data.data)) {
//           setPromotions(response.data.data);
//         }
//       })
//       .catch((error) => {
//         console.error("Unable to load storefront promotions", error);
//       });

//     return () => {
//       cancelled = true;
//     };
//   }, []);

//   if (!showOffer || !promotions.length) return null;

//   const promotion = promotions[0];

//   return (
//     <div className="store-promotion-overlay">
//       <section
//         className="store-promotion-dialog"
//         role="dialog"
//         aria-modal="true"
//         aria-labelledby="store-promotion-title"
//       >
//         <button
//           className="store-promotion-close"
//           type="button"
//           onClick={onClose}
//           aria-label="Close offer"
//         >
//           <FiX />
//         </button>
//         <span className="store-promotion-icon"><FiTag /></span>
//         <span className="store-promotion-eyebrow">A SPECIAL OFFER FOR YOU</span>
//         <h2 id="store-promotion-title">{promotion.title}</h2>
//         <p className="store-promotion-message">{promotion.message}</p>
//         <b className="store-promotion-discount">{formatDiscount(promotion)}</b>
//         {promotion.applicationType === "code" ? (
//           <p className="store-promotion-code">
//             Use code <b>{promotion.code}</b>
//             {promotion.minimumOrderAmount > 0 && (
//               <small> on orders of ${Number(promotion.minimumOrderAmount).toFixed(2)}+</small>
//             )}
//           </p>
//         ) : (
//           <p className="store-promotion-auto">Your discount is applied automatically at checkout.</p>
//         )}
//         <Link className="store-promotion-continue" to="/#food-display" onClick={onClose}>
//           Explore the menu <FiArrowRight />
//         </Link>
//         <button
//           className="store-promotion-dismiss"
//           type="button"
//           onClick={onClose}
//         >
//           Close and continue browsing
//         </button>
//       </section>
//     </div>
//   );
// };

// export default PromotionBanner;
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { FiArrowRight, FiTag, FiX } from "react-icons/fi";
import "./PromotionBanner.css";
import { API_BASE_URL } from "../../config/api";

const formatDiscount = (promotion) =>
  promotion.discountType === "percentage"
    ? `${promotion.discountValue}% off`
    : `$${Number(promotion.discountValue).toFixed(2)} off`;

const PromotionBanner = ({ showOffer, onClose }) => {
  const [promotions, setPromotions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    axios
      .get(`${API_BASE_URL}/api/order/promotions/active`)
      .then((response) => {
        if (
          !cancelled &&
          response.data?.success &&
          Array.isArray(response.data.data)
        ) {
          setPromotions(response.data.data);
        }
      })
      .catch((error) => {
        console.error(
          "Unable to load storefront promotions",
          error
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!showOffer || !promotions.length) {
    return null;
  }

  const promotion = promotions[0];

  return (
    <div className="store-promotion-overlay">
      <section
        className="store-promotion-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="store-promotion-title"
      >
        <button
          className="store-promotion-close"
          type="button"
          onClick={onClose}
          aria-label="Close offer"
        >
          <FiX />
        </button>

        <span className="store-promotion-icon">
          <FiTag />
        </span>

        <span className="store-promotion-eyebrow">
          A SPECIAL OFFER FOR YOU
        </span>

        <h2 id="store-promotion-title">
          {promotion.title}
        </h2>

        <p className="store-promotion-message">
          {promotion.message}
        </p>

        <b className="store-promotion-discount">
          {formatDiscount(promotion)}
        </b>

        {promotion.applicationType === "code" ? (
          <p className="store-promotion-code">
            Use code <b>{promotion.code}</b>

            {promotion.minimumOrderAmount > 0 && (
              <small>
                {" "}
                on orders of $
                {Number(
                  promotion.minimumOrderAmount
                ).toFixed(2)}
                +
              </small>
            )}
          </p>
        ) : (
          <p className="store-promotion-auto">
            Your discount is applied automatically at checkout.
          </p>
        )}

        <Link
          className="store-promotion-continue"
          to="/#food-display"
          onClick={onClose}
        >
          Explore the menu <FiArrowRight />
        </Link>

        <button
          className="store-promotion-dismiss"
          type="button"
          onClick={onClose}
        >
          Close and continue browsing
        </button>
      </section>
    </div>
  );
};

export default PromotionBanner;