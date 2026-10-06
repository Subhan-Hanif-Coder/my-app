// import { createContext, useEffect, useState } from "react";
// import axios from "axios";

// export const StoreContext = createContext(null);

// const StoreContextProvider = (props) => {
//   const [cartItems, setCartItems] = useState({});
//   const url = "http://localhost:4000";
//   const [token, setToken] = useState(() => localStorage.getItem("token") || "");
//   const [food_list, setFoodList] = useState([]);
//   const [foodLoading, setFoodLoading] = useState(true);
//   const [foodError, setFoodError] = useState("");

//   // Add to cart function
//   const addToCart = async (itemId) => {
//     setCartItems((prev) => {
//       const cartData = prev || {};
//       if (!cartData[itemId]) {
//         return { ...cartData, [itemId]: 1 };
//       } else {
//         return { ...cartData, [itemId]: cartData[itemId] + 1 };
//       }
//     });

//     if (token) {
//       await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } });
//     }
//   };

//   // Remove from cart function
//   const removeFromCart = async (itemId) => {
//     setCartItems((prev) => {
//       const cartData = prev || {};
//       if (cartData[itemId] > 0) {
//         return { ...cartData, [itemId]: cartData[itemId] - 1 };
//       }
//       return cartData;
//     });

//     if (token) {
//       await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } });
//     }
//   };

//   // Get total cart amount calculation
//   const getTotalCartAmount = () => {
//     let totalAmount = 0;
//     const currentCart = cartItems || {};
//     for (const item in currentCart) {
//       if (currentCart[item] > 0) {
//         let itemInfo = food_list.find((product) => product._id === item);
//         if (itemInfo) {
//           totalAmount += itemInfo.price * currentCart[item];
//         }
//       }
//     }
//     return totalAmount;
//   };

//   // Fetch food list from backend
//   const fetchFoodList = async () => {
//     setFoodLoading(true);
//     setFoodError("");
//     try {
//       const response = await axios.get(url + "/api/food/list");
//       if (!response.data?.success || !Array.isArray(response.data.data)) {
//         throw new Error(response.data?.message || "The menu response was invalid.");
//       }
//       setFoodList(response.data.data);
//       return true;
//     } catch (error) {
//       console.error("Error fetching food list", error);
//       setFoodError("We couldn't load the menu. Check your connection and try again.");
//       return false;
//     } finally {
//       setFoodLoading(false);
//     }
//   };

//   // Load cart data from backend if user is logged in
//   const loadCartData = async (token) => {
//     try {
//       const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
//       setCartItems(response.data.cartData || {});
//     } catch (error) {
//       console.log("Error loading cart data", error);
//     }
//   };

//   // useEffect to handle token and initial data loading
//   useEffect(() => {
//     function loadData() {
//       void fetchFoodList();
//       const storedToken = localStorage.getItem("token");
//       if (storedToken) {
//         void loadCartData(storedToken);
//       }
//     }
//     loadData();
//   }, []);

//   const contextValue = {
//     food_list,
//     foodLoading,
//     foodError,
//     refreshFoodList: fetchFoodList,
//     cartItems,
//     setCartItems,
//     addToCart,
//     removeFromCart,
//     getTotalCartAmount,
//     url,
//     token,
//     setToken,
//   };

//   return (
//     <StoreContext.Provider value={contextValue}>
//       {props.children}
//     </StoreContext.Provider>
//   );
// };

// export default StoreContextProvider;
import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});

  // Live Vercel Backend URL
  const url = "https://my-app-backend-jade.vercel.app";

  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [food_list, setFoodList] = useState([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [foodError, setFoodError] = useState("");

  // Add to cart function
  const addToCart = async (itemId) => {
    setCartItems((prev) => {
      const cartData = prev || {};

      if (!cartData[itemId]) {
        return { ...cartData, [itemId]: 1 };
      } else {
        return {
          ...cartData,
          [itemId]: cartData[itemId] + 1,
        };
      }
    });

    if (token) {
      await axios.post(
        url + "/api/cart/add",
        { itemId },
        { headers: { token } }
      );
    }
  };

  // Remove from cart function
  const removeFromCart = async (itemId) => {
    setCartItems((prev) => {
      const cartData = prev || {};

      if (cartData[itemId] > 0) {
        return {
          ...cartData,
          [itemId]: cartData[itemId] - 1,
        };
      }

      return cartData;
    });

    if (token) {
      await axios.post(
        url + "/api/cart/remove",
        { itemId },
        { headers: { token } }
      );
    }
  };

  // Get total cart amount calculation
  const getTotalCartAmount = () => {
    let totalAmount = 0;
    const currentCart = cartItems || {};

    for (const item in currentCart) {
      if (currentCart[item] > 0) {
        const itemInfo = food_list.find(
          (product) => product._id === item
        );

        if (itemInfo) {
          totalAmount += itemInfo.price * currentCart[item];
        }
      }
    }

    return totalAmount;
  };

  // Fetch food list from backend
  const fetchFoodList = async () => {
    setFoodLoading(true);
    setFoodError("");

    try {
      const response = await axios.get(
        url + "/api/food/list"
      );

      if (
        !response.data?.success ||
        !Array.isArray(response.data.data)
      ) {
        throw new Error(
          response.data?.message ||
            "The menu response was invalid."
        );
      }

      setFoodList(response.data.data);
      return true;
    } catch (error) {
      console.error("Error fetching food list", error);

      setFoodError(
        "We couldn't load the menu. Check your connection and try again."
      );

      return false;
    } finally {
      setFoodLoading(false);
    }
  };

  // Load cart data from backend if user is logged in
  const loadCartData = async (token) => {
    try {
      const response = await axios.post(
        url + "/api/cart/get",
        {},
        {
          headers: { token },
        }
      );

      setCartItems(response.data.cartData || {});
    } catch (error) {
      console.log("Error loading cart data", error);
    }
  };

  // useEffect to handle token and initial data loading
  useEffect(() => {
    function loadData() {
      void fetchFoodList();

      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        void loadCartData(storedToken);
      }
    }

    loadData();
  }, []);

  const contextValue = {
    food_list,
    foodLoading,
    foodError,
    refreshFoodList: fetchFoodList,
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