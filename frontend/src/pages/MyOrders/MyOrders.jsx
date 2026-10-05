import React, { useContext, useEffect, useMemo, useState } from 'react'
import './MyOrders.css'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  FiArrowRight,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiPackage,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTruck,
} from 'react-icons/fi'

const ORDER_STEPS = ['Food Processing', 'Out for delivery', 'Delivered']

const formatMoney = (amount) => `$${Number(amount || 0).toFixed(2)}`

const formatDate = (value) => new Date(value).toLocaleDateString(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const formatTime = (value) => new Date(value).toLocaleTimeString(undefined, {
  hour: 'numeric',
  minute: '2-digit',
})

const OrderProgress = ({ status }) => {
  const currentStep = ORDER_STEPS.indexOf(status)
  const completedStep = currentStep < 0 ? -1 : currentStep

  return (
    <div className={`order-progress ${status === 'Cancelled' ? 'is-cancelled' : ''}`} aria-label={`Order status: ${status}`}>
      {ORDER_STEPS.map((step, index) => {
        const isComplete = index < completedStep
        const isCurrent = index === completedStep
        const StepIcon = index === 0 ? FiCheck : index === 1 ? FiTruck : FiPackage
        return (
          <React.Fragment key={step}>
            <div className={`order-progress-step ${isComplete ? 'complete' : ''} ${isCurrent ? 'current' : ''}`}>
              <span className="order-progress-icon"><StepIcon /></span>
              <span>{step}</span>
            </div>
            {index < ORDER_STEPS.length - 1 && (
              <span className={`order-progress-line ${index < completedStep ? 'complete' : ''}`} />
            )}
          </React.Fragment>
        )
      })}
      {status === 'Cancelled' && <span className="order-cancelled-label">This order was cancelled</span>}
    </div>
  )
}

const OrderCard = ({ order, url, isExpanded, onToggle, onReorder, isReordering, isLatest = false }) => {
  const status = order.status || 'Food Processing'
  const totalItems = order.items.reduce((total, item) => total + Number(item.quantity || 0), 0)
  const shortId = String(order._id).slice(-7).toUpperCase()
  const address = order.address || {}

  return (
    <article className={`my-order-card ${isExpanded ? 'expanded' : ''} ${isLatest ? 'latest-order-card' : ''}`}>
      <div className="my-order-card-main">
        <div className="my-order-card-icon"><FiShoppingBag /></div>
        <div className="my-order-card-summary">
          <div className="my-order-card-title">
            <h3>Order <span>#{shortId}</span></h3>
            {isLatest && <span className="my-order-latest-badge">LATEST ORDER</span>}
            <span className={`my-order-status status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
              <i />{status}
            </span>
          </div>
          <div className="my-order-meta">
            <span><FiCalendar /> {formatDate(order.date)}</span>
            <span><FiClock /> {formatTime(order.date)}</span>
            <span><FiPackage /> {totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          </div>
          <p className="my-order-item-preview">
            {order.items.map((item) => `${item.name} × ${item.quantity}`).join(' · ')}
          </p>
        </div>
        <div className="my-order-total">
          <small>Total paid</small>
          <b>{formatMoney(order.amount)}</b>
          <span className={order.payment ? 'payment-paid' : 'payment-pending'}>
            {order.payment ? 'Paid online' : 'Payment pending'}
          </span>
        </div>
        <div className="my-order-actions">
          <button
            className="my-order-details-button"
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Hide details' : 'Order details'}
            {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
          </button>
          <button
            className="my-order-reorder-button"
            type="button"
            onClick={() => onReorder(order)}
            disabled={isReordering}
          >
            {isReordering ? 'Adding...' : 'Order again'} <FiRefreshCw />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="my-order-details">
          <div className="my-order-tracking">
            <div className="my-order-details-heading">
              <div><span className="my-orders-eyebrow">LIVE ORDER UPDATE</span><h4>Order progress</h4></div>
              <span className="my-order-reference">Reference: {String(order._id)}</span>
            </div>
            <OrderProgress status={status} />
          </div>

          <div className="my-order-details-grid">
            <div className="my-order-detail-panel">
              <h4>Your items</h4>
              <div className="my-order-lines">
                {order.items.map((item, index) => (
                  <div className="my-order-line" key={`${item._id || item.name}-${index}`}>
                    <div className="my-order-line-image">
                      {item.image ? <img src={`${url}/images/${item.image}`} alt="" /> : <FiPackage />}
                    </div>
                    <span>{item.name}<small>Quantity {item.quantity}</small></span>
                    <b>{formatMoney(Number(item.price) * Number(item.quantity))}</b>
                  </div>
                ))}
              </div>
              {Number(order.subtotal) > 0 && (
                <div className="my-order-subtotal order-price-row">
                  <span>Subtotal</span><b>{formatMoney(order.subtotal)}</b>
                </div>
              )}
              {Number(order.discount) > 0 && (
                <div className="my-order-subtotal order-price-row order-discount-row">
                  <span>{order.promotionTitle || 'Promotion'}{order.promotionCode ? ` (${order.promotionCode})` : ''}</span>
                  <b>−{formatMoney(order.discount)}</b>
                </div>
              )}
              <div className="my-order-subtotal"><span>Order total</span><b>{formatMoney(order.amount)}</b></div>
            </div>
            <div className="my-order-detail-panel">
              <h4>Delivery details</h4>
              <p className="my-order-address-name">{[address.firstName, address.lastName].filter(Boolean).join(' ')}</p>
              <p>{[address.street, address.city, address.state, address.zipcode, address.country].filter(Boolean).join(', ') || 'Delivery address is not available.'}</p>
              {address.phone && <a href={`tel:${address.phone}`}>{address.phone}</a>}
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

const MyOrders = ({ setShowLogin }) => {
  const { url, token, addToCart } = useContext(StoreContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadedForToken, setLoadedForToken] = useState('')
  const [reloadRequest, setReloadRequest] = useState(0)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All orders')
  const [expandedOrder, setExpandedOrder] = useState('')
  const [reorderingId, setReorderingId] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!token) return undefined
    let isCurrentRequest = true

    const loadOrders = async () => {
      try {
        const response = await axios.post(`${url}/api/order/userorders`, {}, { headers: { token } })
        if (!response.data?.success || !Array.isArray(response.data.data)) {
          throw new Error(response.data?.message || "We couldn't read your order history.")
        }
        if (!isCurrentRequest) return
        setError('')
        const sortedOrders = [...response.data.data].sort(
          (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime()
        )
        setOrders(sortedOrders)
        if (sortedOrders.length) {
          setExpandedOrder((current) => current || String(sortedOrders[0]._id))
        }
      } catch (requestError) {
        if (!isCurrentRequest) return
        console.error('Error loading customer orders', requestError)
        setError(requestError.response?.data?.message || "We couldn't load your orders. Please try again.")
      } finally {
        if (isCurrentRequest) {
          setLoading(false)
          setLoadedForToken(token)
        }
      }
    }

    loadOrders()
    return () => { isCurrentRequest = false }
  }, [reloadRequest, token, url])

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return orders.filter((order) => {
      const matchesStatus = filter === 'All orders'
        || (filter === 'In progress' && !['Delivered', 'Cancelled'].includes(order.status))
        || order.status === filter
      const searchableText = [
        order._id,
        order.status,
        ...(order.items || []).map((item) => item.name),
        order.address?.city,
        order.address?.street,
      ].join(' ').toLowerCase()
      return matchesStatus && searchableText.includes(normalizedQuery)
    })
  }, [filter, orders, query])

  const reorder = async (order) => {
    setReorderingId(String(order._id))
    setNotice('')
    try {
      for (const item of order.items) {
        for (let count = 0; count < Number(item.quantity || 0); count += 1) {
          await addToCart(item._id)
        }
      }
      setNotice('Items from your order were added to your cart.')
    } catch (requestError) {
      console.error('Error reordering items', requestError)
      setNotice('We could not add every item. Please check your cart and try again.')
    } finally {
      setReorderingId('')
    }
  }

  const inProgressCount = orders.filter((order) => !['Delivered', 'Cancelled'].includes(order.status)).length
  const deliveredCount = orders.filter((order) => order.status === 'Delivered').length
  const latestOrder = orders[0]
  const latestOrderId = latestOrder ? String(latestOrder._id) : ''
  const latestOrderIsVisible = filteredOrders.some((order) => String(order._id) === latestOrderId)
  const previousOrders = filteredOrders.filter((order) => String(order._id) !== latestOrderId)
  const isLoading = loading || loadedForToken !== token
  const filters = [
    { label: 'All orders', count: orders.length },
    { label: 'In progress', count: inProgressCount },
    { label: 'Delivered', count: deliveredCount },
  ]

  if (!token) {
    return (
      <main className="my-orders">
        <section className="my-orders-state my-orders-empty">
          <span className="my-orders-empty-icon"><FiShoppingBag /></span>
          <h2>Sign in to find your orders</h2>
          <p>Your order history and delivery updates are saved to your account.</p>
          <button type="button" onClick={() => setShowLogin(true)}>Sign in to continue <FiArrowRight /></button>
        </section>
      </main>
    )
  }

  return (
    <main className="my-orders">
      <section className="my-orders-hero">
        <div>
          <span className="my-orders-eyebrow">YOUR TABLE, YOUR FAVOURITES</span>
          <h1>Your orders</h1>
          <p>Track a delivery, revisit the details, or bring back a meal you loved.</p>
        </div>
        <div className="my-orders-hero-stat">
          <span className="my-orders-stat-icon"><FiPackage /></span>
          <span><b>{orders.length}</b><small>{orders.length === 1 ? 'order placed' : 'orders placed'}</small></span>
        </div>
      </section>

      {!isLoading && !error && orders.length > 0 && (
        <section className="my-orders-toolbar" aria-label="Find an order">
          <label className="my-orders-search">
            <FiSearch />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by dish, order number or address..."
              aria-label="Search orders"
            />
            {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}
          </label>
          <div className="my-orders-filters" role="group" aria-label="Filter orders">
            {filters.map(({ label, count }) => (
              <button
                type="button"
                className={filter === label ? 'active' : ''}
                key={label}
                onClick={() => setFilter(label)}
              >
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {notice && <p className="my-orders-notice" role="status">{notice} <Link to="/cart">View cart <FiArrowRight /></Link></p>}

      {isLoading ? (
        <div className="my-orders-state" role="status"><span className="my-orders-loader" />Loading your orders...</div>
      ) : error ? (
        <div className="my-orders-state my-orders-state-error" role="alert">
          <h2>We couldn't load your orders</h2>
          <p>{error}</p>
          <button type="button" onClick={() => { setLoading(true); setError(''); setReloadRequest((current) => current + 1) }}>Try again <FiRefreshCw /></button>
        </div>
      ) : orders.length === 0 ? (
        <div className="my-orders-state my-orders-empty">
          <span className="my-orders-empty-icon"><FiShoppingBag /></span>
          <h2>Your next favourite is waiting</h2>
          <p>When you place an order, its delivery progress and details will be easy to find here.</p>
          <Link to="/">Explore the menu <FiArrowRight /></Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="my-orders-state my-orders-empty">
          <span className="my-orders-empty-icon"><FiSearch /></span>
          <h2>No matching orders</h2>
          <p>Try another dish name, order number, or filter.</p>
          <button type="button" onClick={() => { setQuery(''); setFilter('All orders') }}>Show all orders</button>
        </div>
      ) : (
        <>
          <div className="my-orders-results">
            Showing <b>{filteredOrders.length}</b> of <b>{orders.length}</b> {orders.length === 1 ? 'order' : 'orders'} <span>· Newest first</span>
          </div>
          {latestOrderIsVisible && (
            <section className="my-orders-section my-orders-latest-section" aria-label="Latest order">
              <div className="my-orders-section-heading">
                <span className="my-orders-section-mark"><FiClock /></span>
                <div><h2>Your latest order</h2><p>We keep your most recent order easy to spot.</p></div>
              </div>
              <div className="my-orders-list">
              <OrderCard
                key={latestOrder._id}
                order={latestOrder}
                url={url}
                isExpanded={expandedOrder === latestOrderId}
                onToggle={() => setExpandedOrder((current) => current === latestOrderId ? '' : latestOrderId)}
                onReorder={reorder}
                isReordering={reorderingId === latestOrderId}
                isLatest
              />
              </div>
            </section>
          )}
          {previousOrders.length > 0 && (
            <section className="my-orders-section my-orders-previous-section" aria-label="Previous orders">
              <div className="my-orders-section-heading">
                <span className="my-orders-section-mark"><FiPackage /></span>
                <div><h2>Previous orders</h2><p>Past meals, ready whenever you want to revisit them.</p></div>
                <span className="my-orders-section-count">{previousOrders.length}</span>
              </div>
              <div className="my-orders-list">
                {previousOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    url={url}
                    isExpanded={expandedOrder === String(order._id)}
                    onToggle={() => setExpandedOrder((current) => current === String(order._id) ? '' : String(order._id))}
                    onReorder={reorder}
                    isReordering={reorderingId === String(order._id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

export default MyOrders
