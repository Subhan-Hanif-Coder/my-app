import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FiArrowDownRight,
  FiArrowUpRight,
  FiBox,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiDownload,
  FiPlus,
  FiRefreshCw,
  FiShoppingBag,
  FiTruck,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "./Dashboard.css";

const PERIODS = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "yearly", label: "This year" },
];

const localDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const money = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const compactMoney = (value) =>
  `$${Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  })}`;

const comparisonLabel = (current, previous) => {
  if (!previous) return current ? "New activity" : "No change";
  const change = ((current - previous) / previous) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}% vs previous period`;
};

const formatBucketLabel = (key, period) => {
  if (period === "daily") {
    const hour = Number(key.slice(-2));
    return new Date(2000, 0, 1, hour).toLocaleTimeString([], {
      hour: "numeric",
    });
  }

  if (period === "yearly") {
    return new Date(`${key}-01T12:00:00`).toLocaleDateString(undefined, {
      month: "short",
    });
  }

  const date = new Date(`${key}T12:00:00`);
  return period === "weekly"
    ? date.toLocaleDateString(undefined, { weekday: "short" })
    : String(date.getDate());
};

const escapeCsv = (value) =>
  `"${String(value ?? "").replace(/"/g, '""')}"`;

const MetricCard = ({ label, value, detail, comparison, icon: Icon, tone }) => (
  <article className={`executive-metric-card ${tone}`}>
    <div className="executive-metric-top">
      <span>{label}</span>
      <i><Icon aria-hidden="true" /></i>
    </div>
    <strong>{value}</strong>
    <div className="executive-metric-bottom">
      <span>{detail}</span>
      {comparison && (
        <small className={comparison.startsWith("-") ? "negative" : ""}>
          {comparison.startsWith("-") ? <FiArrowDownRight /> : <FiArrowUpRight />}
          {comparison}
        </small>
      )}
    </div>
  </article>
);

const Dashboard = ({ url, adminKey }) => {
  const [period, setPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(localDateValue(new Date()));
  const [overview, setOverview] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const latestRequest = useRef(0);
  const selectedReportKey = `${period}:${reportDate}`;

  const fetchDashboardData = useCallback(async () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;

    try {
      const [reportResponse, ordersResponse, menuResponse] = await Promise.all([
        axios.get(`${url}/api/order/admin/business-report`, {
          headers: { "x-admin-key": adminKey },
          params: {
            period,
            date: reportDate,
            timezoneOffset: new Date().getTimezoneOffset(),
          },
        }),
        axios.get(`${url}/api/order/list`, {
          params: { page: 1, limit: 10 },
        }),
        axios.get(`${url}/api/food/list`),
      ]);

      if (
        !reportResponse.data?.success ||
        !reportResponse.data.data?.current ||
        !reportResponse.data.data?.previous ||
        !Array.isArray(reportResponse.data.data.trend)
      ) {
        throw new Error(reportResponse.data?.message || "The analytics report was invalid.");
      }
      if (
        !ordersResponse.data?.success ||
        !Array.isArray(ordersResponse.data.data) ||
        !ordersResponse.data.stats
      ) {
        throw new Error(ordersResponse.data?.message || "The order summary was invalid.");
      }
      if (!menuResponse.data?.success || !Array.isArray(menuResponse.data.data)) {
        throw new Error(menuResponse.data?.message || "The menu summary was invalid.");
      }

      return {
        requestId,
        report: reportResponse.data.data,
        orderSummary: ordersResponse.data.stats,
        recentOrders: ordersResponse.data.data,
        menu: menuResponse.data.data,
        reportKey: `${period}:${reportDate}`,
        lastUpdated: new Date(),
      };
    } catch (requestError) {
      requestError.requestId = requestId;
      throw requestError;
    }
  }, [adminKey, period, reportDate, url]);

  useEffect(() => {
    let active = true;
    fetchDashboardData()
      .then((data) => {
        if (active && data.requestId === latestRequest.current) {
          setOverview(data);
          setError("");
        }
      })
      .catch((requestError) => {
        if (!active || requestError.requestId !== latestRequest.current) return;
        setError(
          requestError.response?.data?.message ||
            requestError.message ||
            "Could not load the restaurant overview.",
        );
      });

    return () => {
      active = false;
    };
  }, [fetchDashboardData]);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      const data = await fetchDashboardData();
      if (data.requestId === latestRequest.current) {
        setOverview(data);
        setError("");
      }
    } catch (requestError) {
      if (requestError.requestId && requestError.requestId !== latestRequest.current) return;
      const message =
        requestError.response?.data?.message ||
        requestError.message ||
        "Could not load the restaurant overview.";
      setError(message);
      toast.error(message);
    } finally {
      setRefreshing(false);
    }
  };

  const report = overview?.report;
  const orderSummary = overview?.orderSummary;
  const recentOrders = overview?.recentOrders || [];
  const menu = overview?.menu || [];
  const lastUpdated = overview?.lastUpdated;
  const loadedReportKey = overview?.reportKey;

  const current = report?.current;
  const previous = report?.previous;
  const trend = report?.trend || [];
  const peakSales = Math.max(...trend.map((bucket) => bucket.sales), 1);
  const averageMenuPrice = menu.length
    ? menu.reduce((sum, item) => sum + Number(item.price || 0), 0) / menu.length
    : 0;
  const categoryCount = new Set(menu.map((item) => item.category).filter(Boolean)).size;
  const revenueComparison = comparisonLabel(current?.sales || 0, previous?.sales || 0);
  const orderComparison = comparisonLabel(current?.orderCount || 0, previous?.orderCount || 0);
  const averageComparison = comparisonLabel(
    current?.averageOrderValue || 0,
    previous?.averageOrderValue || 0,
  );
  const fulfillmentRate = current?.orderCount
    ? Math.round((current.deliveredCount / current.orderCount) * 100)
    : 0;
  const paymentRate = current?.sales
    ? Math.round((current.paidSales / current.sales) * 100)
    : 0;
  const activeOrders = (orderSummary?.totalOrders || 0) - (orderSummary?.completedOrders || 0);
  const orderStages = [
    { label: "Delivered", value: Number(current?.deliveredCount || 0), color: "#40815a" },
    { label: "Preparing", value: Number(current?.processingCount || 0), color: "#d19a4b" },
    { label: "On the way", value: Number(current?.deliveryCount || 0), color: "#638ab0" },
  ];
  const knownStageCount = orderStages.reduce((sum, stage) => sum + stage.value, 0);
  if (Number(current?.orderCount || 0) > knownStageCount) {
    orderStages.push({
      label: "Other",
      value: Number(current.orderCount) - knownStageCount,
      color: "#a5aea7",
    });
  }
  const paymentMethods = [
    { label: "Online", value: Number(current?.onlinePaymentCount || 0), color: "#6283a6" },
    { label: "Cash on delivery", value: Number(current?.cashOnDeliveryCount || 0), color: "#bd8750" },
  ];
  const unclassifiedPaymentCount = Math.max(
    0,
    Number(current?.orderCount || 0) -
      paymentMethods.reduce((sum, method) => sum + method.value, 0),
  );
  if (unclassifiedPaymentCount) {
    paymentMethods.push({
      label: "Other / legacy",
      value: unclassifiedPaymentCount,
      color: "#a5aea7",
    });
  }
  const reportRangeLabel = useMemo(() => {
    if (!report?.start || !report?.end) return "";
    const start = new Date(report.start);
    const end = new Date(new Date(report.end).getTime() - 1);
    const options = period === "daily"
      ? { weekday: "long", month: "long", day: "numeric" }
      : { month: "short", day: "numeric" };
    const startLabel = start.toLocaleDateString(undefined, options);
    const endLabel = end.toLocaleDateString(undefined, options);
    return period === "daily" || startLabel === endLabel
      ? startLabel
      : `${startLabel} – ${endLabel}`;
  }, [period, report]);

  const exportReport = () => {
    if (!report || !orderSummary) {
      toast.error("Wait for the analytics to finish loading before exporting.");
      return;
    }

    const rows = [
      ["Restaurant performance report", reportRangeLabel],
      ["Metric", "Current period", "Previous period"],
      ["Gross sales", current.sales, previous.sales],
      ["Orders", current.orderCount, previous.orderCount],
      ["Average order value", current.averageOrderValue, previous.averageOrderValue],
      ["Paid sales", current.paidSales, previous.paidSales],
      [],
      ["Sales trend", "Orders", "Gross sales", "Paid sales"],
      ...trend.map((bucket) => [
        formatBucketLabel(bucket.key, period),
        bucket.orders,
        bucket.sales,
        bucket.paidSales,
      ]),
      [],
      ["Top selling dishes", "Quantity", "Sales"],
      ...(current.topItems || []).map((item) => [item.name, item.quantity, item.sales]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `restaurant-${period}-report-${reportDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    toast.success("Analytics report exported.");
  };

  if ((!overview || loadedReportKey !== selectedReportKey) && !error) {
    return (
      <main className="executive-dashboard">
        <div className="executive-loading" role="status">
          <span className="spinner-dark" />
          <b>Preparing your business overview…</b>
          <p>Bringing sales, orders and menu performance together.</p>
        </div>
      </main>
    );
  }

  if (error && (!report || loadedReportKey !== selectedReportKey)) {
    return (
      <main className="executive-dashboard">
        <section className="executive-error" role="alert">
          <span className="executive-error-icon"><FiClock /></span>
          <h1>Analytics are unavailable</h1>
          <p>{error}</p>
          <button type="button" onClick={refreshData} disabled={refreshing}>
            <FiRefreshCw /> {refreshing ? "Retrying…" : "Try again"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="executive-dashboard">
      <header className="executive-page-header">
        <div>
          <span className="executive-eyebrow">RESTAURANT INTELLIGENCE</span>
          <h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}.</h1>
          <p>Your service, sales and menu performance in one clear view.</p>
        </div>
        <div className="executive-header-actions">
          {lastUpdated && (
            <span className="executive-last-updated">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <button className="executive-button secondary" type="button" onClick={exportReport}>
            <FiDownload /> Export report
          </button>
          <button
            className="executive-button primary"
            type="button"
            onClick={refreshData}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "is-spinning" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </header>

      <section className="executive-toolbar" aria-label="Analytics time period">
        <div className="executive-period-tabs" role="group" aria-label="Choose report period">
          {PERIODS.map((option) => (
            <button
              type="button"
              key={option.value}
              className={period === option.value ? "active" : ""}
              aria-pressed={period === option.value}
              onClick={() => setPeriod(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label className="executive-date-control">
          <span>Report date</span>
          <input
            type="date"
            value={reportDate}
            max={localDateValue(new Date())}
            onChange={(event) => setReportDate(event.target.value)}
          />
        </label>
        <span className="executive-range-label">{reportRangeLabel}</span>
      </section>

      {error && (
        <div className="executive-inline-error" role="status">
          <span>Some overview data may be out of date: {error}</span>
          <button type="button" onClick={() => fetchData(true)}>Retry</button>
        </div>
      )}

      <section className="executive-metrics" aria-label="Business performance">
        <MetricCard
          label="Gross sales"
          value={money(current?.sales)}
          detail={`${money(current?.paidSales)} marked paid`}
          comparison={revenueComparison}
          icon={FiDollarSign}
          tone="green"
        />
        <MetricCard
          label="Orders"
          value={Number(current?.orderCount || 0).toLocaleString()}
          detail={`${Number(current?.unpaidCount || 0)} payment${current?.unpaidCount === 1 ? "" : "s"} outstanding`}
          comparison={orderComparison}
          icon={FiShoppingBag}
          tone="blue"
        />
        <MetricCard
          label="Average order value"
          value={money(current?.averageOrderValue)}
          detail="Gross sales per order"
          comparison={averageComparison}
          icon={FiArrowUpRight}
          tone="gold"
        />
        <MetricCard
          label="Fulfilled"
          value={`${fulfillmentRate}%`}
          detail={`${Number(current?.deliveredCount || 0)} delivered · ${paymentRate}% value paid`}
          icon={FiCheckCircle}
          tone="violet"
        />
      </section>

      <section className="executive-main-grid">
        <article className="executive-panel executive-sales-panel">
          <div className="executive-panel-heading">
            <div>
              <span className="executive-panel-kicker">SALES ACTIVITY</span>
              <h2>Sales trend</h2>
              <p>Gross sales across {reportRangeLabel.toLowerCase()} · compared with the previous period above</p>
            </div>
            <div className="executive-chart-total">
              <b>{money(current?.sales)}</b>
              <span>{Number(current?.orderCount || 0)} orders</span>
            </div>
          </div>
          {trend.length ? (
            <div className={`executive-chart ${period === "daily" ? "hourly" : ""}`} role="img" aria-label={`${period} sales trend for ${reportRangeLabel}`}>
              <div className="executive-chart-y-axis" aria-hidden="true">
                <span>{compactMoney(peakSales)}</span>
                <span>{compactMoney(peakSales / 2)}</span>
                <span>$0</span>
              </div>
              <div className="executive-chart-plot">
                <div className="executive-chart-grid" aria-hidden="true"><i /><i /><i /></div>
                <div className="executive-chart-bars">
                  {trend.map((bucket, index) => {
                    const showLabel = period === "daily"
                      ? index % 4 === 0
                      : period === "monthly"
                        ? index === 0 || index === trend.length - 1 || index % 5 === 0
                        : true;
                    const height = bucket.sales > 0
                      ? Math.max(4, (bucket.sales / peakSales) * 100)
                      : 1;
                    return (
                      <div className={`executive-chart-column ${showLabel ? "has-label" : ""}`} key={bucket.key}>
                        <span className="executive-chart-tooltip">
                          {formatBucketLabel(bucket.key, period)} · {money(bucket.sales)} · {bucket.orders} orders
                        </span>
                        <span
                          className="executive-chart-bar"
                          style={{ height: `${height}%` }}
                          title={`${formatBucketLabel(bucket.key, period)}: ${money(bucket.sales)}, ${bucket.orders} orders`}
                        />
                        {showLabel && <small>{formatBucketLabel(bucket.key, period)}</small>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="executive-empty-state">No sales activity for this period yet.</div>
          )}
          <div className="executive-chart-legend">
            <span><i /> Gross sales</span>
            <span>Previous period comparison is shown in the KPI cards</span>
          </div>
        </article>

        <article className="executive-panel executive-operations-panel">
          <div className="executive-panel-heading compact">
            <div>
              <span className="executive-panel-kicker">LIVE OPERATIONS</span>
              <h2>Service pulse</h2>
              <p>All-time order queue</p>
            </div>
            <Link to="/orders" aria-label="Manage orders">Manage <FiArrowUpRight /></Link>
          </div>
          <div className="executive-queue-list">
            <Link to="/orders" className="executive-queue-item urgent">
              <i><FiClock /></i>
              <span><b>To prepare</b><small>Orders waiting in the kitchen</small></span>
              <strong>{Number(orderSummary?.pendingOrders || 0)}</strong>
            </Link>
            <Link to="/orders" className="executive-queue-item transit">
              <i><FiTruck /></i>
              <span><b>Out for delivery</b><small>Orders on their way</small></span>
              <strong>{Number(orderSummary?.outForDeliveryOrders || 0)}</strong>
            </Link>
            <Link to="/completed-orders" className="executive-queue-item complete">
              <i><FiCheckCircle /></i>
              <span><b>Delivered</b><small>Completed orders</small></span>
              <strong>{Number(orderSummary?.completedOrders || 0)}</strong>
            </Link>
          </div>
          <div className="executive-queue-footer">
            <span>{activeOrders.toLocaleString()} active orders</span>
            <span>{Number(orderSummary?.totalOrders || 0).toLocaleString()} total orders</span>
          </div>
        </article>
      </section>

      <section className="executive-rings-grid" aria-label="Order distribution">
        <article className="executive-panel executive-ring-panel">
          <div className="executive-panel-heading compact">
            <div>
              <span className="executive-panel-kicker">SERVICE BREAKDOWN</span>
              <h2>Order fulfillment</h2>
              <p>How orders moved through service · {reportRangeLabel}</p>
            </div>
          </div>
          <div className="executive-ring-content">
            <div
              className="executive-donut"
              role="img"
              aria-label={`Order fulfillment: ${orderStages.map((stage) => `${stage.label} ${stage.value}`).join(", ")}`}
              style={{
                "--ring-gradient": orderStages.length
                  ? `conic-gradient(${orderStages.map((stage, index) => {
                      const total = Number(current?.orderCount || 0) || 1;
                      const start = orderStages.slice(0, index).reduce((sum, entry) => sum + entry.value, 0) / total * 100;
                      const end = (start + stage.value / total * 100);
                      return `${stage.color} ${start}% ${end}%`;
                    }).join(", ")})`
                  : "conic-gradient(#e9eeea 0% 100%)",
              }}
            >
              <span><b>{Number(current?.orderCount || 0).toLocaleString()}</b><small>orders</small></span>
            </div>
            <div className="executive-ring-legend">
              {orderStages.map((stage) => (
                <div key={stage.label}>
                  <i style={{ "--legend-color": stage.color }} />
                  <span>{stage.label}</span>
                  <b>{stage.value.toLocaleString()}</b>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="executive-panel executive-ring-panel">
          <div className="executive-panel-heading compact">
            <div>
              <span className="executive-panel-kicker">PAYMENT PREFERENCE</span>
              <h2>How customers pay</h2>
              <p>Payment method selected at checkout</p>
            </div>
          </div>
          <div className="executive-ring-content">
            <div
              className="executive-donut payment"
              role="img"
              aria-label={`Payment methods: ${paymentMethods.map((method) => `${method.label} ${method.value}`).join(", ")}`}
              style={{
                "--ring-gradient": Number(current?.orderCount || 0)
                  ? `conic-gradient(${paymentMethods.map((method, index) => {
                      const total = Number(current.orderCount) || 1;
                      const start = paymentMethods.slice(0, index).reduce((sum, entry) => sum + entry.value, 0) / total * 100;
                      const end = start + method.value / total * 100;
                      return `${method.color} ${start}% ${end}%`;
                    }).join(", ")})`
                  : "conic-gradient(#e9eeea 0% 100%)",
              }}
            >
              <span><b>{Number(current?.orderCount || 0).toLocaleString()}</b><small>orders</small></span>
            </div>
            <div className="executive-ring-legend">
              {paymentMethods.map((method) => (
                <div key={method.label}>
                  <i style={{ "--legend-color": method.color }} />
                  <span>{method.label}</span>
                  <b>{method.value.toLocaleString()}</b>
                </div>
              ))}
              <p>Payment selection, not proof of payment received.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="executive-insights-grid">
        <article className="executive-panel">
          <div className="executive-panel-heading compact">
            <div>
              <span className="executive-panel-kicker">WHAT CUSTOMERS LOVE</span>
              <h2>Top selling dishes</h2>
              <p>Ranked by quantity · {reportRangeLabel}</p>
            </div>
            <Link to="/list" aria-label="Manage menu">Menu <FiArrowUpRight /></Link>
          </div>
          {(current?.topItems || []).length ? (
            <div className="executive-products-table" role="table" aria-label="Top selling dishes">
              <div className="executive-products-row heading" role="row">
                <span role="columnheader">Dish</span><span role="columnheader">Units</span><span role="columnheader">Sales</span>
              </div>
              {current.topItems.map((item, index) => (
                <div className="executive-products-row" role="row" key={item.name}>
                  <span className="executive-product-name" role="cell"><i>{index + 1}</i>{item.name}</span>
                  <b role="cell">{Number(item.quantity || 0).toLocaleString()}</b>
                  <b role="cell">{money(item.sales)}</b>
                </div>
              ))}
            </div>
          ) : (
            <div className="executive-empty-state small">Top dishes appear after your first orders.</div>
          )}
        </article>

        <article className="executive-panel executive-menu-panel">
          <div className="executive-panel-heading compact">
            <div>
              <span className="executive-panel-kicker">MENU HEALTH</span>
              <h2>Your menu</h2>
              <p>Catalog overview</p>
            </div>
            <i className="executive-menu-icon"><FiBox /></i>
          </div>
          <div className="executive-menu-stats">
            <div><b>{menu.length.toLocaleString()}</b><span>Active dishes</span></div>
            <div><b>{categoryCount.toLocaleString()}</b><span>Categories</span></div>
            <div><b>{money(averageMenuPrice)}</b><span>Average price</span></div>
          </div>
          <div className="executive-menu-actions">
            <Link to="/list"><FiBox /> Manage menu</Link>
            <Link to="/add"><FiPlus /> Add a dish</Link>
          </div>
        </article>
      </section>

      <section className="executive-panel executive-recent-panel">
        <div className="executive-panel-heading compact">
          <div>
            <span className="executive-panel-kicker">LATEST ACTIVITY</span>
            <h2>Recent orders</h2>
            <p>Latest 10 orders across your restaurant</p>
          </div>
          <Link to="/orders">View all orders <FiArrowUpRight /></Link>
        </div>
        {recentOrders.length ? (
          <div className="executive-orders-table" role="table" aria-label="Recent orders">
            <div className="executive-orders-row heading" role="row">
              <span role="columnheader">Order / customer</span>
              <span role="columnheader">Date</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Payment</span>
              <span role="columnheader">Total</span>
            </div>
            {recentOrders.map((order) => {
              const customer = order.customer?.name
                || [order.address?.firstName, order.address?.lastName].filter(Boolean).join(" ")
                || "Guest customer";
              const orderDate = new Date(order.date);
              const statusClass = (order.status || "Food Processing").toLowerCase().replace(/\s+/g, "-");
              const paymentLabel = order.payment
                ? "Paid"
                : order.paymentMethod === "cod"
                  ? "Cash on delivery"
                  : "Awaiting payment";
              return (
                <div className="executive-orders-row" role="row" key={order._id}>
                  <span className="executive-order-customer" role="cell">
                    <b>#{String(order._id).slice(-7).toUpperCase()}</b>
                    <small>{customer}</small>
                  </span>
                  <span role="cell">{Number.isNaN(orderDate.getTime()) ? "—" : orderDate.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                  <span role="cell"><i className={`executive-status-pill ${statusClass}`}>{order.status || "Food Processing"}</i></span>
                  <span role="cell"><i className={`executive-payment-pill ${order.payment ? "paid" : "pending"}`}>{paymentLabel}</i></span>
                  <b className="executive-order-amount" role="cell">{money(order.amount)}</b>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="executive-empty-state">No orders have been placed yet.</div>
        )}
      </section>
      <footer className="executive-dashboard-footer">
        Showing {reportRangeLabel.toLowerCase()} analytics · {Number(orderSummary?.totalOrders || 0).toLocaleString()} orders in your records
      </footer>
    </main>
  );
};

export default Dashboard;
