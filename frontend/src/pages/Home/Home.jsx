import React, { useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiMail,
  FiMapPin,
  FiPackage,
  FiPhone,
  FiPlusCircle,
  FiSearch,
  FiShoppingBag,
  FiUsers,
} from 'react-icons/fi'
import "./Home.css"
import Header from '../../components/Header/Header'
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import FoodItem from '../../components/FoodItem/FoodItem'
import AppDownload from '../../components/AppDownload/AppDownload'
import { StoreContext } from '../../context/StoreContext'

const HomeHighlights = () => (
  <section className="home-highlights" aria-label="Ordering highlights">
    <article>
      <span className="home-highlight-icon"><FiCheckCircle /></span>
      <div><b>Made fresh</b><span>Prepared when you order</span></div>
    </article>
    <article>
      <span className="home-highlight-icon"><FiPackage /></span>
      <div><b>Easy checkout</b><span>Secure online payment</span></div>
    </article>
    <article>
      <span className="home-highlight-icon"><FiMapPin /></span>
      <div><b>Order updates</b><span>Follow your order status</span></div>
    </article>
  </section>
)

const CategoryCollections = ({ foodList, url, onSelectCategory }) => {
  const categories = [...new Set(foodList.map((food) => food.category).filter(Boolean))]
    .map((name) => {
      const foods = foodList.filter((food) => food.category === name)
      return { name, count: foods.length, image: foods[0]?.image }
    })

  if (!categories.length) return null

  return (
    <section className="home-section category-collections" aria-labelledby="category-collections-title">
      <div className="home-section-heading">
        <div>
          <span className="section-eyebrow">A GOOD PLACE TO START</span>
          <h2 id="category-collections-title">What are you in the mood for?</h2>
          <p>Pick a category and jump straight to the dishes available today.</p>
        </div>
        <a href="#food-display">Browse all dishes <FiArrowUpRight /></a>
      </div>
      <div className="category-collection-grid">
        {categories.map((category) => (
          <button
            className="category-collection-card"
            key={category.name}
            type="button"
            onClick={() => onSelectCategory(category.name)}
          >
            <img src={`${url}/images/${category.image}`} alt="" loading="lazy" />
            <span className="category-collection-shade" />
            <span className="category-collection-copy">
              <b>{category.name}</b>
              <small>{category.count} {category.count === 1 ? "dish" : "dishes"}</small>
            </span>
            <span className="category-collection-arrow"><FiArrowRight /></span>
          </button>
        ))}
      </div>
    </section>
  )
}

const HowItWorks = () => (
  <section className="home-section how-it-works" aria-labelledby="how-it-works-title">
    <div className="home-section-heading">
      <div>
        <span className="section-eyebrow">GOOD FOOD, WITHOUT THE FUSS</span>
        <h2 id="how-it-works-title">Your next meal in three easy steps</h2>
        <p>Everything you need to go from browsing to checkout, right here.</p>
      </div>
    </div>
    <div className="how-it-works-grid">
      <a className="how-it-works-step" href="#food-display">
        <span className="how-it-works-number">01</span>
        <span className="how-it-works-icon"><FiSearch /></span>
        <b>Find your favourite</b>
        <small>Search the live menu or browse dishes by category.</small>
        <span className="how-it-works-action">Explore menu <FiArrowRight /></span>
      </a>
      <a className="how-it-works-step" href="#food-display">
        <span className="how-it-works-number">02</span>
        <span className="how-it-works-icon"><FiPlusCircle /></span>
        <b>Add it to your bag</b>
        <small>Tap + on any dish and review your basket whenever you like.</small>
        <span className="how-it-works-action">Choose a dish <FiArrowRight /></span>
      </a>
      <Link className="how-it-works-step" to="/cart">
        <span className="how-it-works-number">03</span>
        <span className="how-it-works-icon"><FiCreditCard /></span>
        <b>Checkout with ease</b>
        <small>Review your items, add delivery details, and pay securely online.</small>
        <span className="how-it-works-action">Go to your bag <FiArrowRight /></span>
      </Link>
    </div>
  </section>
)

const TableReservations = ({ url }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    guests: "2",
    requests: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [requestError, setRequestError] = useState("")
  const [booking, setBooking] = useState(null)
  const [lookup, setLookup] = useState({ id: "", email: "" })
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState("")
  const [lookupResult, setLookupResult] = useState(null)
  const [minimumDateTime] = useState(() => {
    const localDateTime = new Date()
    localDateTime.setMinutes(localDateTime.getMinutes() - localDateTime.getTimezoneOffset())
    return localDateTime.toISOString().slice(0, 16)
  })

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submitReservation = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setRequestError("")
    setBooking(null)
    setLookupError("")
    setLookupResult(null)
    try {
      const response = await axios.post(`${url}/api/order/reservation/request`, {
        ...form,
        guests: Number(form.guests),
      })
      if (!response.data?.success || !response.data.data?.id) {
        throw new Error(response.data?.message || "We couldn't send your reservation request.")
      }
      setBooking(response.data.data)
      setLookup({ id: response.data.data.id, email: form.email })
      setLookupResult(response.data.data)
      setForm((current) => ({ ...current, requests: "" }))
    } catch (error) {
      console.error("Error requesting table reservation", error)
      setRequestError(error.response?.data?.message || error.message || "We couldn't send your reservation request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const checkReservation = async (event) => {
    event.preventDefault()
    setLookupLoading(true)
    setLookupError("")
    setLookupResult(null)
    setBooking(null)
    try {
      const response = await axios.post(`${url}/api/order/reservation/status`, lookup)
      if (!response.data?.success || !response.data.data) {
        throw new Error(response.data?.message || "We couldn't find this reservation.")
      }
      setLookupResult(response.data.data)
    } catch (error) {
      console.error("Error checking table reservation", error)
      setLookupError(error.response?.data?.message || error.message || "We couldn't check this booking. Please try again.")
    } finally {
      setLookupLoading(false)
    }
  }

  return (
    <section className="reservation-section" id="table-reservation" aria-labelledby="reservation-title">
      <div className="reservation-intro">
        <span className="section-eyebrow">MAKE IT A NIGHT TO REMEMBER</span>
        <h2 id="reservation-title">Your table is waiting.</h2>
        <p>Planning dinner, a celebration, or just a good meal? Send us a reservation request and we'll confirm it with you.</p>
        <div className="reservation-perks">
          <span><FiCheckCircle /> No prepayment</span>
          <span><FiUsers /> Up to 12 guests</span>
          <span><FiClock /> Confirmation by our team</span>
        </div>
        <div className="reservation-note">
          <FiCalendar />
          <span>Reservations are requests until our team confirms your time.</span>
        </div>
      </div>

      <div className="reservation-panel">
        <div className="reservation-panel-heading">
          <span className="section-eyebrow">BOOK A TABLE</span>
          <h3>Tell us when to expect you</h3>
        </div>
        <form className="reservation-form" onSubmit={submitReservation}>
          <label>
            <span>Your name</span>
            <input name="name" value={form.name} onChange={updateForm} autoComplete="name" minLength="2" maxLength="100" placeholder="e.g. Alex Morgan" required />
          </label>
          <label>
            <span>Email address</span>
            <span className="reservation-input-icon"><FiMail /><input name="email" type="email" value={form.email} onChange={updateForm} autoComplete="email" maxLength="254" placeholder="you@example.com" required /></span>
          </label>
          <label>
            <span>Phone number</span>
            <span className="reservation-input-icon"><FiPhone /><input name="phone" type="tel" value={form.phone} onChange={updateForm} autoComplete="tel" minLength="7" maxLength="30" placeholder="+1 555 000 0000" required /></span>
          </label>
          <div className="reservation-form-row">
            <label>
              <span>Date & time</span>
              <input name="date" type="datetime-local" value={form.date} onChange={updateForm} min={minimumDateTime} required />
            </label>
            <label>
              <span>Guests</span>
              <select name="guests" value={form.guests} onChange={updateForm}>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => (
                  <option value={count} key={count}>{count} {count === 1 ? "guest" : "guests"}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>Special request <small>(optional)</small></span>
            <textarea name="requests" value={form.requests} onChange={updateForm} maxLength="500" rows="3" placeholder="Celebration, accessibility needs, seating preference..." />
          </label>
          {requestError && <p className="reservation-form-error" role="alert">{requestError}</p>}
          <button className="reservation-submit" type="submit" disabled={submitting}>
            {submitting ? "Sending request..." : "Request a table"} <FiArrowRight />
          </button>
          <small className="reservation-privacy">Your contact details are only used to manage this reservation.</small>
        </form>
      </div>

      <div className="reservation-status-panel">
        <div>
          <span className="section-eyebrow">ALREADY SENT A REQUEST?</span>
          <h3>Check your reservation</h3>
          <p>Enter the booking reference from your confirmation and the email you used.</p>
        </div>
        <form className="reservation-lookup" onSubmit={checkReservation}>
          <label>
            <span>Booking reference</span>
            <input value={lookup.id} onChange={(event) => setLookup((current) => ({ ...current, id: event.target.value.trim() }))} placeholder="Paste your reference" required />
          </label>
          <label>
            <span>Email address</span>
            <input type="email" value={lookup.email} onChange={(event) => setLookup((current) => ({ ...current, email: event.target.value }))} placeholder="you@example.com" required />
          </label>
          <button type="submit" disabled={lookupLoading}>{lookupLoading ? "Checking..." : "Check status"} <FiArrowRight /></button>
        </form>
        {booking && (
          <div className="reservation-result reservation-result-success" role="status">
            <FiCheckCircle />
            <div>
              <b>Request received — pending team confirmation</b>
              <span>Save this booking reference: <strong>{booking.id}</strong></span>
            </div>
          </div>
        )}
        {lookupError && <p className="reservation-form-error" role="alert">{lookupError}</p>}
        {lookupResult && !booking && (
          <div className="reservation-result" role="status">
            <FiCalendar />
            <div>
              <b>{lookupResult.status}</b>
              <span>{new Date(lookupResult.date).toLocaleString()} · {lookupResult.guests} {lookupResult.guests === 1 ? "guest" : "guests"}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

const FoodCollection = ({
  title,
  eyebrow,
  description,
  foods,
  linkText = "See the full menu",
  linkTo,
}) => {
  if (!foods.length) return null

  return (
    <section className="home-section food-collection">
      <div className="home-section-heading">
        <div>
          <span className="section-eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {linkTo ? (
          <Link to={linkTo}>{linkText} <FiArrowUpRight /></Link>
        ) : (
          <a href="#food-display">{linkText} <FiArrowUpRight /></a>
        )}
      </div>
      <div className="home-food-grid">
        {foods.map((item) => (
          <FoodItem
            key={item._id}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
          />
        ))}
      </div>
    </section>
  )
}

const CartOverview = ({ cartItems, foodList, getTotalCartAmount }) => {
  const itemCount = Object.values(cartItems || {}).reduce((total, count) => total + Number(count || 0), 0)
  const cartDishes = foodList.filter((food) => cartItems?.[food._id] > 0)

  return (
    <section className={`cart-overview ${itemCount ? "cart-overview-filled" : ""}`}>
      <div className="cart-overview-icon"><FiShoppingBag /></div>
      <div className="cart-overview-copy">
        <span className="section-eyebrow">YOUR BAG</span>
        <h2>{itemCount ? `${itemCount} ${itemCount === 1 ? "item" : "items"} ready when you are` : "Your bag is ready for something good"}</h2>
        {itemCount ? (
          <p>
            {cartDishes.slice(0, 3).map((food) => `${food.name} × ${cartItems[food._id]}`).join("  ·  ")}
            {cartDishes.length > 3 ? `  ·  +${cartDishes.length - 3} more` : ""}
          </p>
        ) : (
          <p>Add a dish and your cart total will show up here.</p>
        )}
      </div>
      <div className="cart-overview-total">
        <small>Subtotal</small>
        <b>${Number(getTotalCartAmount()).toFixed(2)}</b>
      </div>
      <Link className="cart-overview-link" to={itemCount ? "/cart" : "/#food-display"}>
        {itemCount ? "Review cart" : "Explore menu"} <FiArrowUpRight />
      </Link>
    </section>
  )
}

const CartPairings = ({ foodList, cartItems }) => {
  const cartCategories = new Set(
    foodList.filter((food) => cartItems?.[food._id] > 0).map((food) => food.category)
  )
  const pairings = foodList
    .filter((food) => cartCategories.has(food.category) && !cartItems?.[food._id])
    .slice(0, 4)

  if (!pairings.length) return null

  return (
    <FoodCollection
      title="Goes well with your picks"
      eyebrow="A LITTLE EXTRA?"
      description="More from the same categories in your bag. Add any dish with one tap."
      foods={pairings}
      linkText="Keep exploring"
    />
  )
}

const useLatestOrder = (url, token) => {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    if (!token) {
      return undefined
    }

    let isCurrent = true
    const loadLatestOrder = async () => {
      setLoading(true)
      setError("")
      try {
        const response = await axios.post(
          `${url}/api/order/userorders`,
          {},
          { headers: { token } }
        )
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error(response.data?.message || "The order response was invalid.")
        }
        const latestOrder = [...response.data.data].sort(
          (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()
        )[0] || null
        if (isCurrent) setOrder(latestOrder)
      } catch (requestError) {
        console.error("Error loading latest order", requestError)
        if (isCurrent) setError("We couldn't load your latest order. Please try again.")
      } finally {
        if (isCurrent) setLoading(false)
      }
    }

    loadLatestOrder()
    return () => { isCurrent = false }
  }, [url, token, retry])

  return { order, loading, error, retryOrderLoad: () => setRetry((count) => count + 1) }
}

const LatestOrder = ({ orderState }) => {
  const { order, loading, error, retryOrderLoad } = orderState

  return (
    <section className="latest-order" aria-live="polite">
      <div className="latest-order-icon"><FiClock /></div>
      <div className="latest-order-copy">
        <span className="section-eyebrow">YOUR KITCHEN UPDATE</span>
        <h2>{loading ? "Checking your latest order…" : order ? "Your latest order" : error ? "Order update unavailable" : "Ready for another favourite?"}</h2>
        {order && !loading && (
          <p>
            {order.items?.length || 0} items <span>·</span> ${Number(order.amount).toFixed(2)} <span>·</span> {order.payment ? "Paid online" : "Payment pending"}
          </p>
        )}
        {error && !loading && <p className="latest-order-error">{error}</p>}
        {!order && !loading && !error && <p>Your next delicious moment is just a few clicks away.</p>}
      </div>
      {error && !loading ? (
        <button className="latest-order-link" type="button" onClick={retryOrderLoad}>
          Try again <FiArrowUpRight />
        </button>
      ) : order && !loading ? (
        <Link className="latest-order-link" to="/myorders">
          {order.status || "Track order"} <FiArrowUpRight />
        </Link>
      ) : !loading ? (
        <a className="latest-order-link" href="#food-display">
          Explore dishes <FiArrowUpRight />
        </a>
      ) : null}
    </section>
  )
}

const RecentOrderDishes = ({ order, foodList }) => {
  if (!order?.items?.length) return null
  const previousItemIds = new Set(order.items.map((item) => String(item._id || item.id || "")))
  const availableAgain = foodList.filter((food) => previousItemIds.has(String(food._id)))

  if (!availableAgain.length) return null

  return (
    <FoodCollection
      title="Want that order again?"
      eyebrow="FROM YOUR LAST ORDER"
      description="Your previous favourites are still on today's menu. Tap + to add them to your bag."
      foods={availableAgain}
      linkText="View order history"
      linkTo="/myorders"
    />
  )
}

const Home = () => {
  const homePageRef = useRef(null)
  const [category, setCategory] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  const {
    food_list: foodList,
    cartItems,
    getTotalCartAmount,
    url,
    token,
  } = useContext(StoreContext)
  const orderState = useLatestOrder(url, token)
  useEffect(() => {
    if (!("IntersectionObserver" in window) || !homePageRef.current) return undefined

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add("is-visible")
        observer.unobserve(entry.target)
      })
    }, {
      threshold: 0.12,
      rootMargin: "0px 0px -8% 0px",
    })

    const sections = homePageRef.current.querySelectorAll(":scope > *")
    sections.forEach((section) => {
      section.classList.add("scroll-reveal")
      observer.observe(section)
    })

    return () => observer.disconnect()
  }, [foodList.length, token])

  const valuePicks = [...foodList]
    .filter((item) => Number.isFinite(Number(item.price)))
    .sort((first, second) => first.price - second.price || first.name.localeCompare(second.name))
    .slice(0, 4)
  const selectCategory = (selectedCategory) => {
    setCategory(selectedCategory)
    window.setTimeout(() => {
      document.getElementById("food-display")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 0)
  }

  return (
    <div className="home-page" ref={homePageRef}>
      <Header />
      <HomeHighlights />
      <CategoryCollections foodList={foodList} url={url} onSelectCategory={selectCategory} />
      <HowItWorks />
      <TableReservations url={url} />
      <FoodCollection
        title="Good food, easy choices"
        eyebrow="KIND TO YOUR CRAVINGS AND YOUR WALLET"
        description="Explore some of the best-priced dishes available from today's menu."
        foods={valuePicks}
      />
      <CartOverview
        cartItems={cartItems}
        foodList={foodList}
        getTotalCartAmount={getTotalCartAmount}
      />
      {token && <LatestOrder orderState={orderState} />}
      {token && <RecentOrderDishes order={orderState.order} foodList={foodList} />}
      <ExploreMenu category={category} setCategory={selectCategory} />
      <FoodDisplay
        category={category}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <CartPairings foodList={foodList} cartItems={cartItems} />
      <AppDownload />
    </div>
  )
}

export default Home
