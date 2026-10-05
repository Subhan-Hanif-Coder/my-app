import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FiActivity,
  FiArrowDownRight,
  FiArrowUpRight,
  FiCalendar,
  FiCheckCircle,
  FiDollarSign,
  FiPlus,
  FiRefreshCw,
  FiUsers
} from "react-icons/fi";
import "./ReportsPayroll.css";

const API_PATH = "/api/order/admin";
const PERIODS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

const localDateValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const currentMonthValue = () => localDateValue(new Date()).slice(0, 7);
const money = (value) => `$${Number(value || 0).toFixed(2)}`;

const dateRangeLabel = (start, end) => {
  const endDate = new Date(new Date(end).getTime() - 1);
  return `${new Date(start).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} – ${endDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
};

const ReportsPayroll = ({ url, adminKey }) => {
  const [period, setPeriod] = useState("daily");
  const [reportDate, setReportDate] = useState(localDateValue(new Date()));
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);
  const [reportError, setReportError] = useState("");
  const [payrollPeriod, setPayrollPeriod] = useState(currentMonthValue());
  const [employees, setEmployees] = useState([]);
  const [payroll, setPayroll] = useState([]);
  const [payrollLoading, setPayrollLoading] = useState(true);
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [savingPayroll, setSavingPayroll] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({ name: "", role: "", phone: "", monthlySalary: "" });
  const [payrollForm, setPayrollForm] = useState({ employeeId: "", bonus: "0", deductions: "0", advance: "0" });

  const headers = useMemo(() => ({ "x-admin-key": adminKey }), [adminKey]);

  const loadReport = useCallback(async () => {
    try {
      const response = await axios.get(`${url}${API_PATH}/business-report`, {
        headers,
        params: { period, date: reportDate, timezoneOffset: new Date().getTimezoneOffset() }
      });
      if (!response.data?.success || !response.data.data?.current || !response.data.data?.previous) {
        throw new Error(response.data?.message || "The report response was invalid.");
      }
      setReport(response.data.data);
      setReportError("");
    } catch (error) {
      const message = error.response?.data?.message || error.message || "Could not load the business report.";
      setReportError(message);
    } finally {
      setReportLoading(false);
    }
  }, [headers, period, reportDate, url]);

  const loadPayroll = useCallback(async () => {
    try {
      const response = await axios.get(`${url}${API_PATH}/employees`, {
        headers,
        params: { period: payrollPeriod }
      });
      if (!response.data?.success || !Array.isArray(response.data.data) || !Array.isArray(response.data.payroll)) {
        throw new Error(response.data?.message || "The staff payroll response was invalid.");
      }
      setEmployees(response.data.data);
      setPayroll(response.data.payroll);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not load staff payroll.");
    } finally {
      setPayrollLoading(false);
    }
  }, [headers, payrollPeriod, url]);

  useEffect(() => { loadReport(); }, [loadReport]);
  useEffect(() => { loadPayroll(); }, [loadPayroll]);

  const submitEmployee = async (event) => {
    event.preventDefault();
    setSavingEmployee(true);
    try {
      const response = await axios.post(`${url}${API_PATH}/employees`, {
        ...employeeForm,
        monthlySalary: Number(employeeForm.monthlySalary)
      }, { headers });
      if (!response.data?.success) throw new Error(response.data?.message || "Could not add employee.");
      setEmployeeForm({ name: "", role: "", phone: "", monthlySalary: "" });
      toast.success("Employee added.");
      setPayrollLoading(true);
      await loadPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not add employee.");
    } finally {
      setSavingEmployee(false);
    }
  };

  const submitPayroll = async (event) => {
    event.preventDefault();
    setSavingPayroll(true);
    try {
      const response = await axios.post(`${url}${API_PATH}/payroll`, {
        employeeId: payrollForm.employeeId || employees.find((employee) => employee.active)?._id || "",
        period: payrollPeriod,
        bonus: Number(payrollForm.bonus || 0),
        deductions: Number(payrollForm.deductions || 0),
        advance: Number(payrollForm.advance || 0)
      }, { headers });
      if (!response.data?.success) throw new Error(response.data?.message || "Could not save payroll.");
      toast.success("Salary calculation saved.");
      setPayrollForm((current) => ({ ...current, bonus: "0", deductions: "0", advance: "0" }));
      setPayrollLoading(true);
      await loadPayroll();
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not save payroll.");
    } finally {
      setSavingPayroll(false);
    }
  };

  const updatePaidStatus = async (entry) => {
    try {
      const response = await axios.patch(
        `${url}${API_PATH}/payroll/${entry._id}/payment`,
        { paid: !entry.paid },
        { headers }
      );
      if (!response.data?.success) throw new Error(response.data?.message || "Could not update payment.");
      setPayroll((current) => current.map((record) => record._id === entry._id
        ? { ...response.data.data, employeeId: record.employeeId }
        : record
      ));
      toast.success(entry.paid ? "Payment marked unpaid." : "Salary marked as paid.");
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || "Could not update payment.");
    }
  };

  const activeEmployees = employees.filter((employee) => employee.active);
  const selectedEmployee = activeEmployees.find((employee) => employee._id === payrollForm.employeeId) || activeEmployees[0];
  const calculatedSalary = selectedEmployee
    ? Number(selectedEmployee.monthlySalary) + Number(payrollForm.bonus || 0)
      - Number(payrollForm.deductions || 0) - Number(payrollForm.advance || 0)
    : 0;
  const payrollTotals = payroll.reduce((total, entry) => ({
    net: total.net + Number(entry.netSalary || 0),
    paid: total.paid + (entry.paid ? Number(entry.netSalary || 0) : 0),
    due: total.due + (entry.paid ? 0 : Number(entry.netSalary || 0))
  }), { net: 0, paid: 0, due: 0 });

  const comparison = (currentValue, previousValue) => {
    if (!previousValue) return currentValue ? "New activity" : "No change";
    const change = ((currentValue - previousValue) / previousValue) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs previous`;
  };

  return (
    <main className="business-page">
      <header className="business-header">
        <div>
          <span className="business-eyebrow">RESTAURANT PERFORMANCE</span>
          <h1>Reports & payroll</h1>
          <p>See how business is doing and keep monthly staff salaries organized.</p>
        </div>
        <button className="business-refresh" type="button" onClick={() => {
          setReportLoading(true);
          setPayrollLoading(true);
          setReportError("");
          loadReport();
          loadPayroll();
        }}>
          <FiRefreshCw /> Refresh data
        </button>
      </header>

      <section className="business-report-panel">
        <div className="business-section-heading">
          <div className="business-section-icon"><FiActivity /></div>
          <div><h2>Business report</h2><p>Calculated automatically from saved orders.</p></div>
        </div>
        <div className="business-report-controls">
          <div className="business-period-switch" role="group" aria-label="Report period">
            {PERIODS.map((option) => (
              <button
                type="button"
                key={option.value}
                className={period === option.value ? "active" : ""}
                onClick={() => {
                  setReportLoading(true);
                  setReportError("");
                  if (period === option.value) loadReport();
                  else setPeriod(option.value);
                }}
              >{option.label}</button>
            ))}
          </div>
          <label className="business-date-control">
            <FiCalendar />
            <span className="business-visually-hidden">Choose date for report period</span>
            <input
              aria-label="Choose date for report period"
              type="date"
              value={reportDate}
              onChange={(event) => {
                setReportLoading(true);
                setReportError("");
                if (reportDate === event.target.value) loadReport();
                else setReportDate(event.target.value);
              }}
            />
          </label>
        </div>

        {reportLoading ? (
          <div className="business-feedback" role="status">Calculating report from orders…</div>
        ) : reportError ? (
          <div className="business-feedback business-feedback-error" role="alert">
            <p>{reportError}</p><button type="button" onClick={() => {
              setReportLoading(true);
              setReportError("");
              loadReport();
            }}>Try again</button>
          </div>
        ) : report && (
          <>
            <p className="business-range-label">
              {dateRangeLabel(report.start, report.end)} <span>· compared with the previous {period} period</span>
            </p>
            <div className="business-kpi-grid">
              <article className="business-kpi-card">
                <span className="business-kpi-icon sales"><FiDollarSign /></span>
                <small>Total sales</small><b>{money(report.current.sales)}</b>
                <span className="business-kpi-compare">{comparison(report.current.sales, report.previous.sales)}</span>
              </article>
              <article className="business-kpi-card">
                <span className="business-kpi-icon orders"><FiActivity /></span>
                <small>Orders received</small><b>{report.current.orderCount}</b>
                <span className="business-kpi-compare">{comparison(report.current.orderCount, report.previous.orderCount)}</span>
              </article>
              <article className="business-kpi-card">
                <span className="business-kpi-icon delivered"><FiCheckCircle /></span>
                <small>Delivered</small><b>{report.current.deliveredCount}</b>
                <span className="business-kpi-compare">{report.current.processingCount} preparing · {report.current.deliveryCount} on the way</span>
              </article>
              <article className="business-kpi-card">
                <span className="business-kpi-icon average"><FiUsers /></span>
                <small>Average order</small><b>{money(report.current.averageOrderValue)}</b>
                <span className="business-kpi-compare">{money(report.current.paidSales)} paid · {report.current.unpaidCount} unpaid orders</span>
              </article>
            </div>
            <div className="business-report-detail-grid">
              <section className="business-detail-card">
                <div className="business-detail-title"><h3>Compared to previous period</h3><span>Sales performance</span></div>
                <div className="business-comparison-row"><span>This period</span><b>{money(report.current.sales)}</b></div>
                <div className="business-comparison-row"><span>Previous period</span><b>{money(report.previous.sales)}</b></div>
                <div className={`business-change ${report.current.sales >= report.previous.sales ? "positive" : "negative"}`}>
                  {report.current.sales >= report.previous.sales ? <FiArrowUpRight /> : <FiArrowDownRight />}
                  {comparison(report.current.sales, report.previous.sales)}
                </div>
              </section>
              <section className="business-detail-card">
                <div className="business-detail-title"><h3>Popular dishes</h3><span>By units sold</span></div>
                {report.current.topItems.length ? (
                  <div className="business-top-items">
                    {report.current.topItems.map((item, index) => (
                      <div className="business-top-item" key={`${item.name}-${index}`}>
                        <span className="business-top-rank">{index + 1}</span>
                        <b>{item.name}</b><span>{item.quantity} sold</span><strong>{money(item.sales)}</strong>
                      </div>
                    ))}
                  </div>
                ) : <p className="business-empty-note">No items sold in this period.</p>}
              </section>
            </div>
          </>
        )}
      </section>

      <section className="business-payroll-section">
        <div className="business-section-heading">
          <div className="business-section-icon payroll"><FiUsers /></div>
          <div><h2>Staff & monthly payroll</h2><p>Add staff manually, then calculate and track each month's salary.</p></div>
        </div>
        <div className="business-payroll-period">
          <label htmlFor="payroll-month">Payroll month</label>
          <input id="payroll-month" type="month" value={payrollPeriod} onChange={(event) => {
            setPayrollLoading(true);
            if (payrollPeriod === event.target.value) loadPayroll();
            else setPayrollPeriod(event.target.value);
          }} />
        </div>

        <div className="business-payroll-overview">
          <article><small>Staff records</small><b>{employees.length}</b></article>
          <article><small>Payroll total</small><b>{money(payrollTotals.net)}</b></article>
          <article><small>Paid</small><b>{money(payrollTotals.paid)}</b></article>
          <article><small>Still due</small><b>{money(payrollTotals.due)}</b></article>
        </div>

        <div className="business-payroll-grid">
          <form className="business-form-card" onSubmit={submitEmployee}>
            <div className="business-form-title"><span><FiPlus /></span><div><h3>Add employee</h3><p>Store their role and fixed monthly salary.</p></div></div>
            <label>Employee name<input required minLength="2" maxLength="100" value={employeeForm.name} onChange={(event) => setEmployeeForm({ ...employeeForm, name: event.target.value })} placeholder="e.g. Ali Khan" /></label>
            <label>Job title / role<input required minLength="2" maxLength="80" value={employeeForm.role} onChange={(event) => setEmployeeForm({ ...employeeForm, role: event.target.value })} placeholder="e.g. Chef" /></label>
            <label>Phone (optional)<input type="tel" maxLength="30" value={employeeForm.phone} onChange={(event) => setEmployeeForm({ ...employeeForm, phone: event.target.value })} placeholder="Contact number" /></label>
            <label>Fixed monthly salary<input required type="number" min="0" step="0.01" value={employeeForm.monthlySalary} onChange={(event) => setEmployeeForm({ ...employeeForm, monthlySalary: event.target.value })} placeholder="0.00" /></label>
            <button className="business-primary-button" disabled={savingEmployee}>{savingEmployee ? "Saving employee…" : "Add employee"}</button>
          </form>

          <form className="business-form-card" onSubmit={submitPayroll}>
            <div className="business-form-title"><span><FiDollarSign /></span><div><h3>Calculate monthly salary</h3><p>Net pay = salary + bonus − deductions − advance.</p></div></div>
            <label>Employee
              <select required value={payrollForm.employeeId || selectedEmployee?._id || ""} onChange={(event) => setPayrollForm({ ...payrollForm, employeeId: event.target.value })}>
                <option value="">Choose an employee</option>
                {activeEmployees.map((employee) => (
                  <option value={employee._id} key={employee._id}>{employee.name} · {employee.role}</option>
                ))}
              </select>
            </label>
            <div className="business-salary-base"><span>Fixed salary for this month</span><b>{money(selectedEmployee?.monthlySalary)}</b></div>
            <div className="business-money-fields">
              <label>Bonus<input type="number" min="0" step="0.01" value={payrollForm.bonus} onChange={(event) => setPayrollForm({ ...payrollForm, bonus: event.target.value })} /></label>
              <label>Deductions<input type="number" min="0" step="0.01" value={payrollForm.deductions} onChange={(event) => setPayrollForm({ ...payrollForm, deductions: event.target.value })} /></label>
              <label>Advance paid<input type="number" min="0" step="0.01" value={payrollForm.advance} onChange={(event) => setPayrollForm({ ...payrollForm, advance: event.target.value })} /></label>
            </div>
            <div className={`business-net-preview ${calculatedSalary < 0 ? "invalid" : ""}`}>
              <span>Calculated take-home pay</span><b>{money(Math.max(0, calculatedSalary))}</b>
            </div>
            <button className="business-primary-button" disabled={savingPayroll || !activeEmployees.length || calculatedSalary < 0}>
              {savingPayroll ? "Saving calculation…" : "Save this month's salary"}
            </button>
          </form>
        </div>

        <section className="business-staff-directory">
          <div className="business-detail-title">
            <h3>Staff directory</h3>
            <span>{employees.length} {employees.length === 1 ? "employee" : "employees"}</span>
          </div>
          {payrollLoading ? (
            <p className="business-empty-note">Loading staff records…</p>
          ) : employees.length ? (
            <div className="business-staff-list">
              {employees.map((employee) => (
                <article className="business-staff-card" key={employee._id}>
                  <span className="business-staff-avatar">{employee.name.slice(0, 1).toUpperCase()}</span>
                  <div className="business-staff-copy">
                    <b>{employee.name}</b>
                    <small>{employee.role}{employee.phone ? ` · ${employee.phone}` : ""}</small>
                  </div>
                  <span className="business-staff-salary">{money(employee.monthlySalary)}<small>/ month</small></span>
                </article>
              ))}
            </div>
          ) : (
            <p className="business-empty-note">Add your first employee using the form above.</p>
          )}
        </section>

        <section className="business-payroll-records">
          <div className="business-detail-title"><h3>Payroll for {payrollPeriod}</h3><span>{payroll.length} {payroll.length === 1 ? "record" : "records"}</span></div>
          {payrollLoading ? <div className="business-feedback">Loading staff payroll…</div> : payroll.length ? (
            <div className="business-table-wrap">
              <table>
                <thead><tr><th>Employee</th><th>Fixed salary</th><th>Bonus</th><th>Deductions</th><th>Advance</th><th>Net pay</th><th>Payment</th></tr></thead>
                <tbody>
                  {payroll.map((entry) => (
                    <tr key={entry._id}>
                      <td><b>{entry.employeeId?.name || "Employee"}</b><small>{entry.employeeId?.role || ""}</small></td>
                      <td>{money(entry.baseSalary)}</td><td>{money(entry.bonus)}</td><td>{money(entry.deductions)}</td><td>{money(entry.advance)}</td>
                      <td><b>{money(entry.netSalary)}</b></td>
                      <td><button className={`business-payment-button ${entry.paid ? "paid" : ""}`} type="button" onClick={() => updatePaidStatus(entry)}>{entry.paid ? "Paid · mark due" : "Mark as paid"}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="business-empty-note">No salaries calculated for this month yet. Add a staff member or calculate a salary above.</p>
          )}
        </section>
      </section>
    </main>
  );
};

export default ReportsPayroll;
