import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const url = "http://localhost:4000";
  const [token, setToken] = useState("");
  const [food_list, setFoodList] = useState([]);

  // Add to cart function
  const addToCart = async (itemId) => {
    setCartItems((prev) => {
      const cartData = prev || {};
      if (!cartData[itemId]) {
        return { ...cartData, [itemId]: 1 };
      } else {
        return { ...cartData, [itemId]: cartData[itemId] + 1 };
      }
    });

    if (token) {
      await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
    }
  };

  // Remove from cart function
  const removeFromCart = async (itemId) => {
    setCartItems((prev) => {
      const cartData = prev || {};
      if (cartData[itemId] > 0) {
        return { ...cartData, [itemId]: cartData[itemId] - 1 };
      }
      return cartData;
    });

    if (token) {
      await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
    }
  };

  // Get total cart amount calculation
  const getTotalCartAmount = () => {
    let totalAmount = 0;
    const currentCart = cartItems || {};
    for (const item in currentCart) {
      if (currentCart[item] > 0) {
        let itemInfo = food_list.find((product) => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * currentCart[item];
        }
      }
    }
    return totalAmount;
  };

  // Fetch food list from backend
  const fetchFoodList = async () => {
    try {
      const response = await axios.get(url + "/api/food/list");
      setFoodList(response.data.data);
    } catch (error) {
      console.log("Error fetching food list", error);
    }
  };

  // Load cart data from backend if user is logged in
  const loadCartData = async (token) => {
    try {
      const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.log("Error loading cart data", error);
    }
  };

  // useEffect to handle token and initial data loading
  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
        await loadCartData(localStorage.getItem("token"));
      }
    }
    loadData();
  }, []);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    token,
    setToken,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;