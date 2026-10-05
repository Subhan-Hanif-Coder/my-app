import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { FiCalendar, FiDownload, FiPrinter, FiRefreshCw } from "react-icons/fi";
import "./PrintReports.css";

const PERIOD_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly"
};

const localDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatRange = (start, end) => {
  const finalDay = new Date(new Date(end).getTime() - 1);
  const options = { month: "short", day: "numeric", year: "numeric" };
  return `${new Date(start).toLocaleDateString(undefined, options)} – ${finalDay.toLocaleDateString(undefined, options)}`;
};

const csvCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const PrintReports = ({ url, adminKey }) => {
  const [reportDate, setReportDate] = useState(localDateValue(new Date()));
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReports = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/order/admin/business-report`, {
        headers: { "x-admin-key": adminKey },
        params: {
          period: "all",
          date: reportDate,
          timezoneOffset: new Date().getTimezoneOffset()
        }
      });
      if (!response.data?.success || !Array.isArray(response.data.data?.reports)) {
        throw new Error(response.data?.message || "The report response was invalid.");
      }
      setReports(response.data.data.reports);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || requestError.message || "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }, [adminKey, reportDate, url]);

  useEffect(() => {
    const request = window.setTimeout(loadReports, 0);
    return () => window.clearTimeout(request);
  }, [loadReports]);

  useEffect(() => {
    const currentLocalDate = localDateValue(new Date());
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 100);
    const rolloverTimer = window.setTimeout(() => {
      if (reportDate === currentLocalDate) {
        setLoading(true);
        setReportDate(localDateValue(new Date()));
      }
    }, Math.max(0, nextMidnight.getTime() - Date.now()));
    return () => window.clearTimeout(rolloverTimer);
  }, [reportDate]);

  const downloadCsv = () => {
    const rows = [
      ["Period", "Date range", "Orders", "Sales", "Paid sales", "Unpaid orders", "Delivered", "Preparing", "On the way", "Average order", "Previous sales"],
      ...reports.map((report) => [
        PERIOD_LABELS[report.period],
        formatRange(report.start, report.end),
        report.current.orderCount,
        Number(report.current.sales || 0).toFixed(2),
        Number(report.current.paidSales || 0).toFixed(2),
        report.current.unpaidCount,
        report.current.deliveredCount,
        report.current.processingCount,
        report.current.deliveryCount,
        Number(report.current.averageOrderValue || 0).toFixed(2),
        Number(report.previous.sales || 0).toFixed(2)
      ])
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const objectUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `restaurant-report-${reportDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const printReport = () => window.print();

  return (
    <main className="print-report-page">
      <header className="print-report-toolbar">
        <div>
          <span className="print-report-eyebrow">RESTAURANT PERFORMANCE</span>
          <h1>Print reports</h1>
          <p>Daily, weekly, monthly and yearly totals together on one compact report.</p>
        </div>
        <div className="print-report-actions">
          <label className="print-report-date">
            <FiCalendar />
            <span className="print-report-visually-hidden">Report date</span>
            <input
              aria-label="Report date"
              type="date"
              value={reportDate}
              onChange={(event) => {
                setLoading(true);
                setReportDate(event.target.value);
              }}
            />
          </label>
          <button type="button" className="print-report-secondary" onClick={downloadCsv} disabled={loading || !!error}>
            <FiDownload /> Download CSV
          </button>
          <button type="button" className="print-report-primary" onClick={printReport} disabled={loading || !!error}>
            <FiPrinter /> Print / Save PDF
          </button>
          <button type="button" className="print-report-refresh" onClick={() => {
            setLoading(true);
            setError("");
            loadReports();
          }} aria-label="Refresh report" title="Refresh report">
            <FiRefreshCw />
          </button>
        </div>
      </header>

      <section className="print-report-sheet" aria-label="Printable restaurant report">
        <div className="print-report-sheet-heading">
          <div>
            <span>RESTAURANT MANAGEMENT</span>
            <h2>Business summary</h2>
            <p>Report date: {new Date(`${reportDate}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
          </div>
          <div className="print-report-generated">
            <span>GENERATED</span>
            <b>{new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</b>
          </div>
        </div>

        <div className="print-report-rollover">
          <span className="print-report-rollover-dot" />
          Daily totals start fresh automatically at local midnight. Previous orders remain saved in history.
        </div>

        {loading ? (
          <div className="print-report-state" role="status">Preparing report…</div>
        ) : error ? (
          <div className="print-report-state print-report-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => { setLoading(true); setError(""); loadReports(); }}>Try again</button>
          </div>
        ) : (
          <>
            <div className="print-report-table-wrap">
              <table className="print-report-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Date range</th>
                    <th>Orders</th>
                    <th>Sales</th>
                    <th>Paid</th>
                    <th>Unpaid</th>
                    <th>Delivered</th>
                    <th>In progress</th>
                    <th>Avg. order</th>
                    <th>Previous sales</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.period}>
                      <th scope="row">{PERIOD_LABELS[report.period]}</th>
                      <td>{formatRange(report.start, report.end)}</td>
                      <td>{report.current.orderCount}</td>
                      <td className="print-report-money">{money(report.current.sales)}</td>
                      <td>{money(report.current.paidSales)}</td>
                      <td>{report.current.unpaidCount}</td>
                      <td>{report.current.deliveredCount}</td>
                      <td>{report.current.processingCount + report.current.deliveryCount}</td>
                      <td>{money(report.current.averageOrderValue)}</td>
                      <td>{money(report.previous.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="print-report-notes">
              <p><b>In progress</b> includes orders being prepared and out for delivery.</p>
              <p><b>Sales</b> are order totals; they do not subtract ingredient, operating or payroll costs.</p>
            </div>
            <footer className="print-report-footer">
              <span>Private restaurant business report</span>
              <span>Generated {new Date().toLocaleDateString()}</span>
            </footer>
          </>
        )}
      </section>
      {!loading && !error && (
        <p className="print-report-help">For a PDF, choose <b>Print / Save PDF</b> and select “Save as PDF” in the print dialog.</p>
      )}
    </main>
  );
};

export default PrintReports;
