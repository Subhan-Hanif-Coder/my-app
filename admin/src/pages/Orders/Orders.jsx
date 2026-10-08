import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import './Orders.css'
import { toast } from 'react-toastify'
import axios from 'axios'

const getDateKey = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'undated'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getDateLabel = (dateKey) => {
  if (dateKey === 'undated') return 'Date unavailable'
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  if (dateKey === getDateKey(today)) return 'Today'
  if (dateKey === getDateKey(yesterday)) return 'Yesterday'
  if (dateKey === getDateKey(tomorrow)) return 'Tomorrow'
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

const WorkspaceTabs = ({ activeWorkspace, setActiveWorkspace }) => (
  <div className="orders-workspace-tabs" role="tablist" aria-label="Restaurant workspace">
    <button
      className={activeWorkspace === 'orders' ? 'active' : ''}
      onClick={() => setActiveWorkspace('orders')}
      role="tab"
      aria-selected={activeWorkspace === 'orders'}
    >
      Orders
    </button>
    <button
      className={activeWorkspace === 'reservations' ? 'active' : ''}
      onClick={() => setActiveWorkspace('reservations')}
      role="tab"
      aria-selected={activeWorkspace === 'reservations'}
    >
      Table reservations
    </button>
  </div>
)

const ReservationsPanel = ({ url, adminKey, activeWorkspace, setActiveWorkspace }) => {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [loadError, setLoadError] = useState('')

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await axios.get(`${url}/api/order/reservation/admin/list`, {
        headers: { 'x-admin-key': adminKey }
      })
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data?.message || 'Reservation response was invalid.')
      }
      setReservations(response.data.data)
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Could not load reservations.'
      setLoadError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [url, adminKey])

  useEffect(() => {
    let isCurrent = true
    axios.get(`${url}/api/order/reservation/admin/list`, {
      headers: { 'x-admin-key': adminKey }
    }).then((response) => {
      if (!isCurrent) return
      if (!response.data?.success || !Array.isArray(response.data.data)) {
        throw new Error(response.data?.message || 'Reservation response was invalid.')
      }
      setReservations(response.data.data)
      setLoadError('')
    }).catch((error) => {
      if (!isCurrent) return
      const message = error.response?.data?.message || error.message || 'Could not load reservations.'
      setLoadError(message)
      toast.error(message)
    }).finally(() => {
      if (isCurrent) setLoading(false)
    })

    return () => { isCurrent = false }
  }, [url, adminKey])

  const updateReservationStatus = async (reservationId, status) => {
    try {
      const response = await axios.post(
        `${url}/api/order/reservation/admin/status`,
        { reservationId, status },
        { headers: { 'x-admin-key': adminKey } }
      )
      if (!response.data?.success) {
        throw new Error(response.data?.message || 'Could not update reservation status.')
      }
      setReservations((current) => current.map((reservation) =>
        reservation._id === reservationId ? response.data.data : reservation
      ))
      toast.success(`Reservation ${status.toLowerCase()}`)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Could not update reservation.')
    }
  }

  const pendingCount = reservations.filter((reservation) => reservation.status === 'Pending').length
  const confirmedCount = reservations.filter((reservation) => reservation.status === 'Confirmed').length
  const todayCount = reservations.filter((reservation) => {
    const date = new Date(reservation.date)
    const today = new Date()
    return date.toDateString() === today.toDateString() && reservation.status !== 'Cancelled'
  }).length
  const visibleReservations = useMemo(() => reservations.filter((reservation) => {
    const query = searchTerm.toLowerCase().trim()
    const matchesSearch = !query || [
      reservation.name,
      reservation.email,
      reservation.phone,
      reservation._id
    ].some((value) => String(value || '').toLowerCase().includes(query))
    return matchesSearch && (activeFilter === 'All' || reservation.status === activeFilter)
  }), [activeFilter, reservations, searchTerm])
  const reservationDateGroups = useMemo(() => {
    const groups = new Map()
    visibleReservations.forEach((reservation) => {
      const key = getDateKey(reservation.date)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(reservation)
    })
    return [...groups.entries()]
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, dateReservations]) => ({
        key,
        label: getDateLabel(key),
        reservations: dateReservations
      }))
  }, [visibleReservations])

  return (
    <div className="order-page-wrapper-dark orders-page-dark">
      <div className="saas-header-dark reservation-admin-header">
        <div className="saas-title-group">
          <h3>Restaurant Admin: <span>Reservations</span></h3>
          <p>Review guest requests and confirm table bookings</p>
        </div>
        <WorkspaceTabs activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
        <button className="saas-btn-sync" onClick={fetchReservations} disabled={loading}>
          {loading ? 'Loading...' : '↻ Sync reservations'}
        </button>
      </div>

      <div className="reservation-admin-metrics">
        <article><span>Needs review</span><b>{pendingCount}</b><small>Pending requests</small></article>
        <article><span>Confirmed</span><b>{confirmedCount}</b><small>Guest bookings</small></article>
        <article><span>Today</span><b>{todayCount}</b><small>Non-cancelled bookings</small></article>
      </div>

      <div className="reservation-admin-toolbar">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search guest, contact or reference..."
          aria-label="Search reservations"
        />
        <div className="reservation-admin-filters" aria-label="Filter reservations">
          {['All', 'Pending', 'Confirmed', 'Cancelled', 'Completed'].map((filter) => (
            <button
              key={filter}
              className={activeFilter === filter ? 'active' : ''}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
              {filter === 'All' ? ` (${reservations.length})` : ` (${reservations.filter((reservation) => reservation.status === filter).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="reservation-admin-empty"><div className="spinner-dark" /><p>Loading reservations...</p></div>
      ) : loadError ? (
        <div className="reservation-admin-empty">
          <p>{loadError}</p>
          <button onClick={fetchReservations}>Try again</button>
        </div>
      ) : visibleReservations.length === 0 ? (
        <div className="reservation-admin-empty">
          <span>✳</span>
          <b>No reservations found</b>
          <p>New requests from the customer website will appear here.</p>
        </div>
      ) : (
        <div className="reservation-admin-date-groups">
          {reservationDateGroups.map((group) => (
            <section className="reservation-admin-date-group" key={group.key}>
              <header className="admin-date-group-heading">
                <div>
                  <span className="admin-date-group-kicker">BOOKING SCHEDULE</span>
                  <h3>{group.label}</h3>
                </div>
                <span>{group.reservations.length} {group.reservations.length === 1 ? 'booking' : 'bookings'}</span>
              </header>
              <div className="reservation-admin-list">
                {group.reservations.map((reservation) => (
                  <article className="reservation-admin-card" key={reservation._id}>
              <div className="reservation-admin-date">
                <span>{new Date(reservation.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                <b>{new Date(reservation.date).getDate()}</b>
                <small>{new Date(reservation.date).toLocaleDateString(undefined, { weekday: 'short' })}</small>
              </div>
              <div className="reservation-admin-guest">
                <div className="reservation-admin-guest-heading">
                  <h4>{reservation.name}</h4>
                  <span className={`reservation-status-pill ${reservation.status.toLowerCase()}`}>{reservation.status}</span>
                </div>
                <p>{reservation.guests} {reservation.guests === 1 ? 'guest' : 'guests'} <span>·</span> {new Date(reservation.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                <div className="reservation-admin-contact">
                  <a href={`mailto:${reservation.email}`}>{reservation.email}</a>
                  <a href={`tel:${reservation.phone}`}>{reservation.phone}</a>
                </div>
                {reservation.requests && <p className="reservation-admin-note">“{reservation.requests}”</p>}
                <small className="reservation-admin-reference">Ref: {reservation._id}</small>
              </div>
              <label className="reservation-admin-status">
                <span>Booking status</span>
                <select
                  value={reservation.status}
                  onChange={(event) => updateReservationStatus(reservation._id, event.target.value)}
                  aria-label={`Update reservation status for ${reservation.name}`}
                >
                  {['Pending', 'Confirmed', 'Cancelled', 'Completed'].map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </label>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

const Orders = ({ url, adminKey, completedOnly = false }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState(completedOnly ? 'Delivered' : 'Active');
  const [activeWorkspace, setActiveWorkspace] = useState('orders');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    outForDeliveryOrders: 0,
    completedOrders: 0
  });
  const latestRequestId = useRef(0);

  const fetchAllOrders = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      setLoading(true);
      const statusByTab = {
        Active: "Active",
        Processing: "Food Processing",
        OnTheWay: "Out for delivery",
        Delivered: "Delivered"
      };
      const response = await axios.get(url + "/api/order/list", {
        params: {
          page,
          limit: pageSize,
          search: debouncedSearch,
          ...(statusByTab[activeTab] && { status: statusByTab[activeTab] })
        }
      });
      if (
        !response.data?.success ||
        !Array.isArray(response.data.data) ||
        !response.data.pagination ||
        !response.data.stats
      ) {
        throw new Error(response.data?.message || "Failed to fetch orders");
      }
      if (requestId !== latestRequestId.current) return;
      const lastPage = Math.max(response.data.pagination.totalPages, 1);
      if (page > lastPage) {
        setPage(lastPage);
        return;
      }
      setLoadError('');
      setOrders(response.data.data);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
    } catch (error) {
      if (requestId === latestRequestId.current) {
        const message = error.response?.data?.message || error.message || "Server connection error";
        setLoadError(message);
        toast.error(message);
      }
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, [activeTab, debouncedSearch, page, pageSize, url]);

  const statusHandler = useCallback(async (event, orderId) => {
    const nextStatus = event.target.value;
    try {
      const response = await axios.post(url + "/api/order/status", {
        orderId,
        status: nextStatus
      })
      if (response.data.success) {
        if (nextStatus === "Delivered" && response.data.emailNotificationSent === false) {
          toast.error("Order status updated, but the customer notification email could not be sent. Check backend email settings.");
        } else {
          toast.success("Order status updated successfully");
        }
        await fetchAllOrders();
      } else {
        toast.error(response.data?.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Error updating status");
    }
  }, [fetchAllOrders, url]);

  useEffect(() => {
    fetchAllOrders();
  }, [fetchAllOrders])

  useEffect(() => {
    const debounce = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(debounce);
  }, [searchTerm]);

  const totalOrders = stats.totalOrders;
  const totalRevenue = stats.totalRevenue;
  const pendingOrders = stats.pendingOrders;
  const outForDeliveryOrders = stats.outForDeliveryOrders;
  const completedOrders = stats.completedOrders;

  const pendingPercent = totalOrders > 0 ? (pendingOrders / totalOrders) * 100 : 0;
  const deliveryPercent = totalOrders > 0 ? (outForDeliveryOrders / totalOrders) * 100 : 0;
  const completedPercent = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
  const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : 0;

  const orderDateGroups = useMemo(() => {
    const groups = new Map();
    orders.forEach((order) => {
      const key = getDateKey(order.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(order);
    });
    return [...groups.entries()]
      .sort(([first], [second]) => second.localeCompare(first))
      .map(([key, dateOrders]) => ({
        key,
        label: getDateLabel(key),
        orders: dateOrders
      }));
  }, [orders]);

  if (activeWorkspace === 'reservations') {
    return (
      <ReservationsPanel
        url={url}
        adminKey={adminKey}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
      />
    )
  }

  return (
    <div className='order-page-wrapper-dark orders-page-dark'>
      <div className="saas-header-dark">
        <div className="saas-title-group">
          <h3>Restaurant Admin: <span>{completedOnly ? 'Completed orders' : 'Active orders'}</span></h3>
          <p>
            {completedOnly
              ? 'Delivered orders are kept here separately from current service.'
              : 'Only orders still being prepared or delivered appear here.'}
          </p>
        </div>
        <WorkspaceTabs activeWorkspace={activeWorkspace} setActiveWorkspace={setActiveWorkspace} />
        <button className="saas-btn-sync" onClick={fetchAllOrders} disabled={loading}>
          {loading ? 'Loading orders...' : '↻ Refresh orders'}
        </button>
      </div>

      <div className="analytics-grid-dark">
        <div className="widget-box-dark">
          <div className="widget-head">
            <span>Financial Overview</span>
            <span className="live-dot"></span>
          </div>
          <div className="metric-flex">
            <div>
              <p className="metric-title">Total Revenue</p>
              <h2 className="metric-value text-emerald-glow">${totalRevenue.toFixed(2)}</h2>
            </div>
            <div>
              <p className="metric-title">Avg. Order Value</p>
              <h2 className="metric-value text-cyan-glow">${avgOrderValue}</h2>
            </div>
          </div>
          <span className="widget-sub-note">Verified secure database transactions</span>
        </div>

        <div className="widget-box-dark">
          <div className="widget-head">
            <span>Fulfillment Distribution Pipeline</span>
            <span>Total: {totalOrders}</span>
          </div>

          <div className="stacked-bar-dark">
            <div className="sb-fill pending" style={{ width: `${pendingPercent}%` }}></div>
            <div className="sb-fill delivery" style={{ width: `${deliveryPercent}%` }}></div>
            <div className="sb-fill completed" style={{ width: `${completedPercent}%` }}></div>
          </div>

          <div className="legend-flex-dark">
            <span className="leg-item"><i className="dot-p"></i> Processing ({pendingOrders})</span>
            <span className="leg-item"><i className="dot-d"></i> On the Way ({outForDeliveryOrders})</span>
            <span className="leg-item"><i className="dot-c"></i> Delivered ({completedOrders})</span>
          </div>
        </div>
      </div>

      <div className="toolbar-box-dark">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Search customer, email, phone, dish or order ID..."
            aria-label="Search orders"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-tabs-dark">
          {completedOnly ? (
            <button className="ft-btn active" type="button" aria-current="page">
              Delivered ({completedOrders})
            </button>
          ) : (
            <>
              <button className={`ft-btn ${activeTab === 'Active' ? 'active' : ''}`} onClick={() => { setPage(1); setActiveTab('Active'); }}>
                Active ({totalOrders - completedOrders})
              </button>
              <button className={`ft-btn ${activeTab === 'Processing' ? 'active' : ''}`} onClick={() => { setPage(1); setActiveTab('Processing'); }}>
                Processing ({pendingOrders})
              </button>
              <button className={`ft-btn ${activeTab === 'OnTheWay' ? 'active' : ''}`} onClick={() => { setPage(1); setActiveTab('OnTheWay'); }}>
                On The Way ({outForDeliveryOrders})
              </button>
            </>
          )}
        </div>
      </div>

      <div className="orders-list-dark">
        {loading ? (
          <div className="no-records-dark order-list-loading" role="status">
            <div className="spinner-dark"></div>
            <p>Loading this page of orders...</p>
          </div>
        ) : loadError ? (
          <div className="no-records-dark">
            <b>Orders could not be loaded</b>
            <p>{loadError}</p>
            <button type="button" className="orders-retry-button" onClick={fetchAllOrders}>Try again</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-records-dark">
            <b>
              {pagination.total
                ? 'No orders on this page'
                : (completedOnly ? completedOrders : totalOrders - completedOrders)
                  ? 'No orders match these filters'
                  : completedOnly ? 'No completed orders yet' : 'No active orders right now'}
            </b>
            <p>
              {pagination.total
                ? 'Use the page controls to view another set of orders.'
                : completedOnly
                  ? 'Orders move here automatically when you mark them as delivered.'
                  : 'New and in-progress customer orders will appear here.'}
            </p>
          </div>
        ) : (
          orderDateGroups.map((group) => (
            <section className="order-date-group" key={group.key}>
              <header className="admin-date-group-heading">
                <div>
                  <span className="admin-date-group-kicker">ORDER SERVICE</span>
                  <h3>{group.label}</h3>
                </div>
                <span>{group.orders.length} {group.orders.length === 1 ? 'order' : 'orders'}</span>
              </header>
              <div className="order-date-orders">
                {group.orders.map((order) => {
                  const address = order.address || {};
                  const placedAt = new Date(order.date);
                  const fullAddress = [
                    address.street,
                    address.city,
                    address.state,
                    address.zipcode,
                    address.country
                  ].filter(Boolean).join(', ');
                  return (
                    <article key={order._id} className="order-row-card">
                      <div className="row-col-icon">
                        <div className="gool-icon-badge"><span>🍔</span></div>
                        <span className="row-hash-tag">#{order._id.slice(-6).toUpperCase()}</span>
                      </div>

                      <div className="row-col-main">
                        <div className="order-placed-at">
                          <span>ORDER RECEIVED</span>
                          <time dateTime={placedAt.toISOString()}>
                            {placedAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {' · '}
                            {placedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </time>
                        </div>
                        <div className="food-pills-row">
                          {(order.items || []).map((item, index) => (
                            <span key={`${item._id || item.name}-${index}`} className="food-pill-dark">
                              {item.name} <b>×{item.quantity}</b>
                            </span>
                          ))}
                        </div>
                        <p className="customer-text">
                          <b>{order.customer?.name || `${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Guest customer'}</b>
                          {address.phone && <a href={`tel:${address.phone}`}>{address.phone}</a>}
                        </p>
                        {fullAddress && <p className="address-text">📍 {fullAddress}</p>}
                      </div>

                      <div className="row-col-bill">
                        <span className="bill-title">Total bill</span>
                        <p className="bill-val">${Number(order.amount || 0).toFixed(2)}</p>
                        <span className={`pay-badge-dark ${order.payment ? 'paid' : 'pending'}`}>
                          {order.payment ? "🟢 Paid online" : order.paymentMethod === "cod" ? "🟡 Cash on delivery" : "🟡 Payment pending"}
                        </span>
                      </div>

                      <div className="row-col-status">
                        <label htmlFor={`order-status-${order._id}`}>Update status</label>
                        <select
                          id={`order-status-${order._id}`}
                          onChange={(event) => statusHandler(event, order._id)}
                          value={order.status || 'Food Processing'}
                          className={`status-select-dark ${(order.status || 'Food Processing').toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <option value="Food Processing">⏳ Food processing</option>
                          <option value="Out for delivery">🚚 Out for delivery</option>
                          <option value="Delivered">✅ Delivered</option>
                        </select>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
      {pagination.total > 0 && (
        <nav className="orders-pagination" aria-label="Order list pagination">
          <p className="orders-pagination-summary">
            Showing <b>{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, pagination.total)}</b> of <b>{pagination.total}</b> matching orders
          </p>
          <div className="orders-pagination-controls">
            <label>
              <span>Per page</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
                aria-label="Orders per page"
              >
                {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <span className="orders-pagination-page">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={loading || page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}

export default Orders