import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import axios from "axios";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiBell, FiClock, FiCreditCard, FiShoppingBag, FiTrendingUp } from "react-icons/fi";

const Dashboard = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordersRes, listRes] = await Promise.all([
        axios.get(`${url}/api/order/list`),
        axios.get(`${url}/api/food/list`),
      ]);

      if (ordersRes.data.success) {
        setOrders(ordersRes.data.data);
      }
      if (listRes.data.success) {
        setList(listRes.data.data);
      }
    } catch (error) {
      toast.error("Failed to load live data stream");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // CSV Export Function
  const exportToCSV = () => {
    if (list.length === 0) {
      toast.error("No data available to export");
      return;
    }

    let csvContent =
      "data:text/csv;charset=utf-8,Dish Name,Category,Price ($)\n";
    list.forEach((item) => {
      let row = `"${item.name}","${item.category}",${item.price}`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "restaurant_inventory_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("CSV Report downloaded successfully!");
  };

  // Real-time calculations
  const totalDishes = list.length;
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (acc, order) => acc + (order.amount || 0),
    0,
  );
  const todayOrders = orders.filter((order) => {
    const orderDate = new Date(order.date);
    return !Number.isNaN(orderDate.getTime()) && orderDate.toDateString() === new Date().toDateString();
  });
  const todayPaidOrders = todayOrders.filter((order) => order.payment);
  const todaySales = todayPaidOrders.reduce(
    (total, order) => total + Number(order.amount || 0),
    0,
  );
  const ordersToPrepare = orders.filter(
    (order) => order.payment && order.status === "Food Processing",
  );
  const unpaidOrders = orders.filter(
    (order) => !order.payment && order.status !== "Delivered",
  );
  const latestTodayOrders = [...todayOrders]
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime())
    .slice(0, 4);

  const deliveredCount = orders.filter((o) => o.status === "Delivered").length;
  const processingCount = orders.filter(
    (o) => o.status === "Food Processing",
  ).length;
  const outDeliveryCount = orders.filter(
    (o) => o.status === "Out for delivery",
  ).length;

  const satisfactionRate =
    totalOrders > 0 ? Math.round((deliveredCount / totalOrders) * 100) : 100;

  const categoryCounts = list.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const categoriesList = Object.keys(categoryCounts);
  const filteredDishes =
    selectedCategory === "All"
      ? list
      : list.filter((item) => item.category === selectedCategory);

  if (loading) {
    return (
      <div className="order-loading-dark">
        <div className="spinner-dark"></div>
        <p>Syncing real-time database metrics...</p>
      </div>
    );
  }

  return (
    <div className="order-page-wrapper-dark dashboard-page-light">
      {/* Report Viewer Top Navigation Tabs */}
      <div className="report-tabs-bar">
        <button
          className={`report-tab-btn ${activeTab === "summary" ? "active" : ""}`}
          onClick={() => setActiveTab("summary")}
        >
          Sales Performance Summary
        </button>
        <button
          className={`report-tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          Product Sales & Volume
        </button>
        <button
          className={`report-tab-btn ${activeTab === "operations" ? "active" : ""}`}
          onClick={() => setActiveTab("operations")}
        >
          Operational Status
        </button>
      </div>

      <div className="saas-header-dark" style={{ marginTop: "15px" }}>
        <div className="saas-title-group">
          <h3>
            Subhan's Restaurant: <span>Live Executive Analytics</span>
          </h3>
          <p>Real-time database intelligence connected with MongoDB backend</p>
        </div>

        {/* Buttons Group (Export CSV + Sync) */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="saas-btn-sync"
            onClick={exportToCSV}
            style={{
              backgroundColor: "#059669",
              color: "#fff",
              border: "1px solid #10b981",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📥 Export CSV
          </button>
          <button className="saas-btn-sync" onClick={fetchData}>
            🔄 Sync Live Data
          </button>
        </div>
      </div>

      <section className="dashboard-alert-center" aria-labelledby="dashboard-alert-title">
        <div className="dashboard-alert-heading">
          <div className="dashboard-alert-heading-icon"><FiBell /></div>
          <div>
            <span className="dashboard-alert-eyebrow">TODAY&apos;S BUSINESS SNAPSHOT</span>
            <h2 id="dashboard-alert-title">Today at a glance</h2>
          </div>
          <span className="dashboard-alert-date">
            <FiClock />
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>

        <div className="dashboard-alert-metrics">
          <article className="dashboard-alert-card sales">
            <span className="dashboard-alert-card-icon"><FiTrendingUp /></span>
            <span className="dashboard-alert-card-copy">
              <small>PAID SALES TODAY</small>
              <b>${todaySales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
              <span>{todayPaidOrders.length} paid {todayPaidOrders.length === 1 ? "order" : "orders"}</span>
            </span>
          </article>
          <article className="dashboard-alert-card orders">
            <span className="dashboard-alert-card-icon"><FiShoppingBag /></span>
            <span className="dashboard-alert-card-copy">
              <small>NEW ORDERS TODAY</small>
              <b>{todayOrders.length}</b>
              <span>{todayPaidOrders.length} payment{todayPaidOrders.length === 1 ? "" : "s"} confirmed</span>
            </span>
          </article>
          <article className={`dashboard-alert-card attention ${ordersToPrepare.length || unpaidOrders.length ? "has-alert" : ""}`}>
            <span className="dashboard-alert-card-icon"><FiCreditCard /></span>
            <span className="dashboard-alert-card-copy">
              <small>NEEDS ATTENTION</small>
              <b>{ordersToPrepare.length + unpaidOrders.length}</b>
              <span>{ordersToPrepare.length} to prepare · {unpaidOrders.length} unpaid</span>
            </span>
          </article>
        </div>

        <div className="dashboard-alert-feed">
          <div className="dashboard-alert-feed-heading">
            <h3>Recent order activity</h3>
            <Link to="/orders">View all orders <FiArrowUpRight /></Link>
          </div>
          {latestTodayOrders.length ? (
            <div className="dashboard-alert-feed-list">
              {latestTodayOrders.map((order) => {
                const customerName = order.customer?.name
                  || `${order.address?.firstName || ""} ${order.address?.lastName || ""}`.trim()
                  || "Guest customer";
                const orderTime = new Date(order.date);
                return (
                  <article className="dashboard-alert-feed-item" key={order._id}>
                    <span className={`dashboard-alert-feed-mark ${order.payment ? "paid" : "unpaid"}`}>
                      {order.payment ? <FiShoppingBag /> : <FiCreditCard />}
                    </span>
                    <span className="dashboard-alert-feed-copy">
                      <b>{order.payment ? "Order received" : "Payment pending"} <small>#{String(order._id).slice(-6).toUpperCase()}</small></b>
                      <span>{customerName} · {orderTime.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                    </span>
                    <span className="dashboard-alert-feed-total">${Number(order.amount || 0).toFixed(2)}</span>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-alert-feed-empty">No orders have come in today. New activity will appear here after the next data sync.</p>
          )}
        </div>
      </section>

      {/* Filter Control Bar */}
      <div
        className="toolbar-box-dark"
        style={{ display: "flex", gap: "20px", alignItems: "center" }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flex: 1,
          }}
        >
          <label
            style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}
          >
            Active Period
          </label>
          <select className="saas-select-dark">
            <option value="current">Current Session (Live)</option>
          </select>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            flex: 1,
          }}
        >
          <label
            style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "600" }}
          >
            Category Filter
          </label>
          <select
            className="saas-select-dark"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories ({totalDishes} Items)</option>
            {categoriesList.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat} ({categoryCounts[cat]} items)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Report Canvas */}
      {activeTab === "summary" && (
        <div className="report-canvas-dark">
          <div className="report-kpi-grid">
            <div className="report-kpi-card">
              <span className="kpi-title">TOTAL REVENUE ($)</span>
              <h1 className="kpi-value text-cyan-glow">
                $
                {totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </h1>
              <span className="kpi-sub">
                Calculated from {totalOrders} total orders
              </span>
            </div>

            <div className="report-kpi-card">
              <span className="kpi-title">TOTAL ORDERS TAKEN</span>
              <h1 className="kpi-value text-emerald-glow">{totalOrders}</h1>
              <span className="kpi-sub">
                {processingCount} pending processing
              </span>
            </div>

            <div className="report-kpi-card-circle">
              <div className="circular-progress-wrap">
                <span className="circle-percent">{satisfactionRate}%</span>
              </div>
              <div className="circle-info">
                <span className="kpi-title">FULFILLMENT RATE</span>
                <p className="kpi-sub">
                  {deliveredCount} of {totalOrders} orders successfully
                  delivered
                </p>
              </div>
            </div>
          </div>

          <div className="widget-box-dark" style={{ marginTop: "20px" }}>
            <div className="widget-head">
              <span>📊 Real-Time Dish Pricing Distribution</span>
              <span className="text-cyan-glow" style={{ fontSize: "12px" }}>
                Live Inventory Items
              </span>
            </div>

            <div className="vertical-bars-container">
              {filteredDishes.length === 0 ? (
                <p style={{ color: "#94a3b8", padding: "20px" }}>
                  No items found in this category.
                </p>
              ) : (
                filteredDishes.slice(0, 7).map((item, idx) => {
                  const maxPrice = Math.max(
                    ...filteredDishes.map((i) => i.price),
                    10,
                  );
                  const barHeight = Math.min(
                    100,
                    Math.max(25, (item.price / maxPrice) * 100),
                  );
                  return (
                    <div className="v-bar-item" key={idx}>
                      <span className="v-bar-val">${item.price}</span>
                      <div className="v-bar-track">
                        <div
                          className="v-bar-fill"
                          style={{ height: `${barHeight}%` }}
                        ></div>
                      </div>
                      <span className="v-bar-label" title={item.name}>
                        {item.name.split(" ")[0]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div className="report-canvas-dark">
          <div className="widget-box-dark">
            <div className="widget-head">
              <span>
                Live Inventory Catalog ({filteredDishes.length} items shown)
              </span>
            </div>
            <div
              style={{
                marginTop: "15px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "15px",
              }}
            >
              {filteredDishes.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#0b0f19",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #1e293b",
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                  }}
                >
                  <img
                    src={`${url}/images/` + item.image}
                    alt=""
                    style={{
                      width: "45px",
                      height: "45px",
                      borderRadius: "6px",
                      objectFit: "cover",
                    }}
                  />
                  <div>
                    <p
                      style={{
                        fontWeight: "600",
                        color: "#f8fafc",
                        fontSize: "14px",
                      }}
                    >
                      {item.name}
                    </p>
                    <p
                      style={{
                        color: "#38bdf8",
                        fontSize: "13px",
                        marginTop: "2px",
                      }}
                    >
                      ${item.price} •{" "}
                      <span style={{ color: "#94a3b8" }}>{item.category}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "operations" && (
        <div className="report-canvas-dark">
          <div className="widget-box-dark">
            <div className="widget-head">
              <span>Live Order Fulfillment Stream</span>
            </div>
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "#0b0f19",
                  borderRadius: "8px",
                  border: "1px solid #1e293b",
                }}
              >
                <span>⏳ Food Processing (Pending)</span>
                <span
                  className="text-amber-glow"
                  style={{ fontWeight: "bold" }}
                >
                  {processingCount} Orders
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "#0b0f19",
                  borderRadius: "8px",
                  border: "1px solid #1e293b",
                }}
              >
                <span>🚴 Out for Delivery</span>
                <span className="text-cyan-glow" style={{ fontWeight: "bold" }}>
                  {outDeliveryCount} Orders
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "12px",
                  background: "#0b0f19",
                  borderRadius: "8px",
                  border: "1px solid #1e293b",
                }}
              >
                <span>✅ Successfully Delivered</span>
                <span
                  className="text-emerald-glow"
                  style={{ fontWeight: "bold" }}
                >
                  {deliveredCount} Orders
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
