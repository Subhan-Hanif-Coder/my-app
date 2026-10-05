import React, { useCallback, useContext, useEffect } from 'react'
import './Verify.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Verify = () => {

  const [searchParams] = useSearchParams();
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  const verifyPayment = useCallback(async () => {
    const response = await axios.post(url + "/api/order/verify", { success, orderId });
    setTimeout(() => {
      if (response.data.success) {
        navigate("/myorders", {
          replace: true,
          state: {
            notification: {
              title: "Order placed successfully!",
              message: "Your payment is confirmed. You can follow your order progress in My Orders.",
            },
          },
        });
      } else {
        navigate("/");
      }
    }, 2000); // 2 seconds ka delay
  }, [navigate, orderId, success, url])

  useEffect(() => {
    verifyPayment();
  }, [verifyPayment])

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  )
}

export default Verify;