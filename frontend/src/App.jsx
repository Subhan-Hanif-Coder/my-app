// import React, { useEffect, useRef, useState } from 'react'
// import Navbar from './components/Navbar/Navbar'
// import { Route, Routes, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
// import { FiArrowLeft } from 'react-icons/fi'
// import './AppNavigation.css'
// import Home from './pages/Home/Home'
// import Cart from './pages/Cart/Cart'
// import PlaceOrder from './pages/PlaceOrder/PlaceOrder'
// import Footer from './components/Footer/Footer'
// import LoginPopup from './components/LoginPopup/LoginPopup'
// import Verify from './pages/Verify/Verify'
// import EmailVerify from './pages/EmailVerify/EmailVerify'
// import MyOrders from './pages/MyOrders/MyOrders'
// import PromotionBanner from './components/PromotionBanner/PromotionBanner'
// import SiteNotification from './components/SiteNotification/SiteNotification'


// const PreviousPageButton = () => {
//   const location = useLocation()
//   const navigate = useNavigate()
//   const navigationType = useNavigationType()
//   const currentPath = `${location.pathname}${location.search}${location.hash}`
//   const historyRef = useRef({
//     entries: [{ key: location.key, path: currentPath, state: location.state }],
//     index: 0,
//   })

//   useEffect(() => {
//     const history = historyRef.current
//     const currentEntry = { key: location.key, path: currentPath, state: location.state }

//     if (navigationType === 'PUSH') {
//       history.entries = history.entries.slice(0, history.index + 1)
//       history.entries.push(currentEntry)
//       history.index += 1
//     } else if (navigationType === 'REPLACE') {
//       history.entries[history.index] = currentEntry
//     } else {
//       const matchingIndex = history.entries.findIndex((entry) => entry.key === location.key)
//       if (matchingIndex >= 0) {
//         history.index = matchingIndex
//       } else {
//         history.entries = history.entries.slice(0, history.index + 1)
//         history.entries.push(currentEntry)
//         history.index += 1
//       }
//     }
//   }, [currentPath, location.key, location.state, navigationType])

//   if (location.pathname === '/') return null

//   const goBack = () => {
//     const history = historyRef.current
//     let previousIndex = history.index - 1

//     while (
//       previousIndex >= 0 &&
//       new URL(history.entries[previousIndex].path, window.location.origin).pathname === '/verify'
//     ) {
//       previousIndex -= 1
//     }

//     const previousEntry = history.entries[previousIndex]
//     history.index = Math.max(previousIndex, 0)
//     navigate(previousEntry?.path || '/', { replace: true })
//   }

//   return (
//     <div className="storefront-back-navigation">
//       <button type="button" onClick={goBack}>
//         <FiArrowLeft aria-hidden="true" />
//         Back to previous page
//       </button>
//     </div>
//   )
// }

// const App = () => {
//   const[showLogin,setShowLogin]=useState(false)
//   const [notification, setNotification] = useState(null)
//   const [showOfferAfterAuth, setShowOfferAfterAuth] = useState(false)
//   const location = useLocation()
//   const navigate = useNavigate()
//   const visibleNotification = location.state?.notification || notification
//   const handleAuthSuccess = (message) => {
//     setNotification(message)
//     setShowOfferAfterAuth(true)
//   }

//   const closeNotification = () => {
//     setNotification(null)
//     if (location.state?.notification) {
//       navigate(`${location.pathname}${location.search}${location.hash}`, {
//         replace: true,
//         state: null,
//       })
//     }
//   }

//   return (
//    <>
//    {showLogin?<LoginPopup setShowLogin={setShowLogin} onSuccess={handleAuthSuccess}/>:<></>}
//    {visibleNotification && (
//      <SiteNotification
//        notification={visibleNotification}
//        onClose={closeNotification}
//      />
//    )}
//     <div className='app'>
//       <PromotionBanner
//         showOffer={showOfferAfterAuth && !visibleNotification}
//         onClose={() => setShowOfferAfterAuth(false)}
//       />
//       <Navbar setShowLogin={setShowLogin}/>
//       <PreviousPageButton />
//       <Routes>
//         <Route path='/' element={<Home />} />
//         <Route path='/cart' element={<Cart />} />
//         <Route path='/order' element={<PlaceOrder />} />
//         <Route path='/verify' element={<Verify />} />
//         <Route path='/email-verify' element={<EmailVerify />} />
//         <Route path='/myorders' element={<MyOrders setShowLogin={setShowLogin} />} />
//       </Routes>
//     </div>
//     <Footer/>
//    </>

//   )
// }

// export default App;
import React, {
  useEffect,
  useRef,
  useState
} from 'react'

import Navbar from './components/Navbar/Navbar'

import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType
} from 'react-router-dom'

import {
  FiArrowLeft
} from 'react-icons/fi'

import './AppNavigation.css'

import Home from './pages/Home/Home'

import Cart from './pages/Cart/Cart'

import PlaceOrder from './pages/PlaceOrder/PlaceOrder'

import Footer from './components/Footer/Footer'

import LoginPopup from './components/LoginPopup/LoginPopup'

import Verify from './pages/Verify/Verify'

import MyOrders from './pages/MyOrders/MyOrders'

import PromotionBanner from './components/PromotionBanner/PromotionBanner'

import SiteNotification from './components/SiteNotification/SiteNotification'

import EmailVerify from './pages/EmailVerify/EmailVerify'

import ForgotPassword from './pages/ForgotPassword/ForgotPassword'


// ======================================================
// PREVIOUS PAGE BUTTON
// ======================================================

const PreviousPageButton = () => {

  const location = useLocation()

  const navigate = useNavigate()

  const navigationType =
    useNavigationType()

  const currentPath =
    `${location.pathname}${location.search}${location.hash}`


  const historyRef = useRef({

    entries: [
      {
        key: location.key,
        path: currentPath,
        state: location.state
      }
    ],

    index: 0,

  })


  useEffect(() => {

    const history =
      historyRef.current


    const currentEntry = {

      key: location.key,

      path: currentPath,

      state: location.state

    }


    if (navigationType === 'PUSH') {

      history.entries =
        history.entries.slice(
          0,
          history.index + 1
        )

      history.entries.push(
        currentEntry
      )

      history.index += 1

    }

    else if (
      navigationType === 'REPLACE'
    ) {

      history.entries[
        history.index
      ] = currentEntry

    }

    else {

      const matchingIndex =
        history.entries.findIndex(
          (entry) =>
            entry.key === location.key
        )


      if (matchingIndex >= 0) {

        history.index =
          matchingIndex

      }

      else {

        history.entries =
          history.entries.slice(
            0,
            history.index + 1
          )

        history.entries.push(
          currentEntry
        )

        history.index += 1

      }

    }

  }, [
    currentPath,
    location.key,
    location.state,
    navigationType
  ])


  if (location.pathname === '/') {
    return null
  }


  const goBack = () => {

    const history =
      historyRef.current


    let previousIndex =
      history.index - 1


    while (

      previousIndex >= 0 &&

      new URL(
        history.entries[
          previousIndex
        ].path,
        window.location.origin
      ).pathname === '/verify'

    ) {

      previousIndex -= 1

    }


    const previousEntry =
      history.entries[
        previousIndex
      ]


    history.index =
      Math.max(
        previousIndex,
        0
      )


    navigate(
      previousEntry?.path || '/',
      {
        replace: true
      }
    )

  }


  return (

    <div className="storefront-back-navigation">

      <button
        type="button"
        onClick={goBack}
      >

        <FiArrowLeft
          aria-hidden="true"
        />

        Back to previous page

      </button>

    </div>

  )

}


// ======================================================
// APP
// ======================================================

const App = () => {

  const [
    showLogin,
    setShowLogin
  ] = useState(false)


  const [
    notification,
    setNotification
  ] = useState(null)


  const [
    showOfferAfterAuth,
    setShowOfferAfterAuth
  ] = useState(false)


  const location =
    useLocation()


  const navigate =
    useNavigate()


  const visibleNotification =
    location.state?.notification ||
    notification


  // ====================================================
  // OPEN LOGIN POPUP FROM ROUTE STATE
  // ====================================================

  useEffect(() => {

    if (
      location.state?.openLogin
    ) {

      setShowLogin(true)


      navigate(
        `${location.pathname}${location.search}${location.hash}`,
        {
          replace: true,
          state: null
        }
      )

    }

  }, [
    location,
    navigate
  ])


  // ====================================================
  // AUTH SUCCESS
  // ====================================================

  const handleAuthSuccess =
    (message) => {

      setNotification(message)

      setShowOfferAfterAuth(true)

    }


  // ====================================================
  // CLOSE NOTIFICATION
  // ====================================================

  const closeNotification = () => {

    setNotification(null)


    if (
      location.state?.notification
    ) {

      navigate(
        `${location.pathname}${location.search}${location.hash}`,
        {
          replace: true,
          state: null
        }
      )

    }

  }


  return (

    <>

      {/* LOGIN POPUP */}

      {
        showLogin
          ?
          <LoginPopup
            setShowLogin={
              setShowLogin
            }
            onSuccess={
              handleAuthSuccess
            }
          />
          :
          <></>
      }


      {/* NOTIFICATION */}

      {
        visibleNotification && (

          <SiteNotification
            notification={
              visibleNotification
            }
            onClose={
              closeNotification
            }
          />

        )
      }


      <div className="app">

        {/* PROMOTION */}

        <PromotionBanner
          showOffer={
            showOfferAfterAuth &&
            !visibleNotification
          }

          onClose={() =>
            setShowOfferAfterAuth(
              false
            )
          }

        />


        {/* NAVBAR */}

        <Navbar
          setShowLogin={
            setShowLogin
          }
        />


        {/* BACK BUTTON */}

        <PreviousPageButton />


        {/* ROUTES */}

        <Routes>

          {/* HOME */}

          <Route
            path="/"
            element={<Home />}
          />


          {/* CART */}

          <Route
            path="/cart"
            element={<Cart />}
          />


          {/* ORDER */}

          <Route
            path="/order"
            element={<PlaceOrder />}
          />


          {/* PAYMENT VERIFY */}

          <Route
            path="/verify"
            element={<Verify />}
          />


          {/* MY ORDERS */}

          <Route
            path="/myorders"
            element={
              <MyOrders
                setShowLogin={
                  setShowLogin
                }
              />
            }
          />


          {/* EMAIL VERIFICATION */}

          <Route
            path="/email-verify"
            element={
              <EmailVerify />
            }
          />


          {/* FORGOT PASSWORD */}

          <Route
            path="/forgot-password"
            element={
              <ForgotPassword />
            }
          />

        </Routes>

      </div>


      {/* FOOTER */}

      <Footer />

    </>

  )

}


export default App