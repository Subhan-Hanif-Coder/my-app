import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  role: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, trim: true, maxlength: 30, default: "" },
  monthlySalary: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const payrollSchema = new mongoose.Schema({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "employee", required: true },
  period: { type: String, required: true, match: /^\d{4}-\d{2}$/ },
  baseSalary: { type: Number, required: true, min: 0 },
  bonus: { type: Number, min: 0, default: 0 },
  deductions: { type: Number, min: 0, default: 0 },
  advance: { type: Number, min: 0, default: 0 },
  netSalary: { type: Number, required: true, min: 0 },
  paid: { type: Boolean, default: false },
  paidAt: { type: Date, default: null }
}, { timestamps: true });

payrollSchema.index({ employeeId: 1, period: 1 }, { unique: true });

const employeeModel = mongoose.models.employee || mongoose.model("employee", employeeSchema);
const payrollModel = mongoose.models.payroll || mongoose.model("payroll", payrollSchema);

export { employeeModel, payrollModel };
