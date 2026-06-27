"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSupabase } from '@/lib/supabase-provider';
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiDownload, FiPrinter, FiFilter, FiSearch, FiEdit, FiEye, FiTrash2, FiSave, FiSettings } from "react-icons/fi";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Employee {
  employee_id: string;
  employee_name: string;
  father_name: string;
  esi_number: string;
  uan_number: string;
  department: string;
  designation: string;
  basic: number;
  hra: number;
  conveyance: number;
  joining_date: string;
}

interface Attendance {
  employee_id: string;
  status: string;
  ot_hours: number;
  date: string;
}

interface PayrollRow {
  id_code: string;
  name: string;
  father: string;
  esi: string;
  uan: string;
  department: string;
  designation: string;
  basic: number;
  hra: number;
  conveyance: number;
  gross: number;
  days: number;
  earn_basic: number;
  earn_hra: number;
  earn_conveyance: number;
  earn_gross: number;
  overtime: number;
  ot_amount: number;
  earning_total_gross: number;
  esi_ded: number;
  pf: number;
  lwf: number;
  total_ded: number;
  total: number;
  lunch: number;
  lunch_amount: number;
  total_amount: number;
  advance: number;
  net_payable: number;
  joining_date?: string;
}

const safe = (val: any) => isNaN(Number(val)) ? 0 : Number(val);
const fixed = (val: number, digits = 0) => isNaN(val) ? "0" : val.toFixed(digits);

export default function PayrollTable() {
  const router = useRouter();
  const [payroll, setPayroll] = useState<PayrollRow[]>([]);
  const [filteredPayroll, setFilteredPayroll] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [startDate, setStartDate] = useState<Date | null>(new Date(new Date().setDate(1)));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [editAdvance, setEditAdvance] = useState<{ id: string | null, value: number }>({ id: null, value: 0 });
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const { supabase } = useSupabase();

  // ---------- Lunch Settings State ----------
  const [showLunchModal, setShowLunchModal] = useState(false);
  const [enableLunch, setEnableLunch] = useState(false);
  const [dailyLunchAmount, setDailyLunchAmount] = useState(50); // default ₹50 per day
  // -----------------------------------------

  // Calculate summary statistics
  const summary = useMemo(() => {
    return filteredPayroll.reduce((acc, row) => {
      acc.totalEmployees++;
      acc.totalDays += row.days;
      acc.totalOvertime += row.overtime;
      acc.totalEarnings += row.earning_total_gross;
      acc.totalDeductions += row.total_ded;
      acc.totalNetPay += row.net_payable;
      return acc;
    }, {
      totalEmployees: 0,
      totalDays: 0,
      totalOvertime: 0,
      totalEarnings: 0,
      totalDeductions: 0,
      totalNetPay: 0
    });
  }, [filteredPayroll]);

  // Employee actions
  const handleViewEmployee = (employeeId: string) => {
    router.push(`/employees/${employeeId}`);
  };

  const handleEditEmployee = (employeeId: string) => {
    router.push(`/employees/${employeeId}/edit`);
  };

  const handlePrintPayslip = (employeeId: string) => {
    const employee = payroll.find(e => e.id_code === employeeId);
    if (!employee) {
      toast.error("Employee not found!");
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>Payslip - ${employee.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .company { font-size: 24px; font-weight: bold; }
            .payslip-title { font-size: 18px; margin: 10px 0; }
            .employee-info { margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; }
            .table th { background-color: #f2f2f2; }
            .text-right { text-align: right; }
            .summary { margin-top: 30px; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">YOUR COMPANY NAME</div>
            <div class="payslip-title">PAYSLIP FOR THE MONTH</div>
            <div>${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}</div>
          </div>

          <div class="employee-info">
            <div><strong>Employee ID:</strong> ${employee.id_code}</div>
            <div><strong>Name:</strong> ${employee.name}</div>
            <div><strong>Department:</strong> ${employee.department}</div>
            <div><strong>Designation:</strong> ${employee.designation}</div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Earnings</th>
                <th>Amount (₹)</th>
                <th>Deductions</th>
                <th>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Basic Salary</td>
                <td class="text-right">${fixed(employee.earn_basic)}</td>
                <td>ESI</td>
                <td class="text-right">${fixed(employee.esi_ded)}</td>
              </tr>
              <tr>
                <td>HRA</td>
                <td class="text-right">${fixed(employee.earn_hra)}</td>
                <td>PF</td>
                <td class="text-right">${fixed(employee.pf)}</td>
              </tr>
              <tr>
                <td>Conveyance</td>
                <td class="text-right">${fixed(employee.earn_conveyance)}</td>
                <td>LWF</td>
                <td class="text-right">${fixed(employee.lwf)}</td>
              </tr>
              <tr>
                <td>Overtime</td>
                <td class="text-right">${fixed(employee.ot_amount)}</td>
                <td>Advance</td>
                <td class="text-right">${fixed(employee.advance)}</td>
              </tr>
              <tr>
                <td>Lunch Allowance</td>
                <td class="text-right">${fixed(employee.lunch_amount)}</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <div class="summary">
            <div><strong>Total Days Worked:</strong> ${employee.days}</div>
            <div><strong>Total Overtime Hours:</strong> ${fixed(employee.overtime, 2)}</div>
            <div><strong>Net Payable Amount:</strong> ₹${fixed(employee.net_payable)}</div>
          </div>

          <div class="signature">
            <div>Employee Signature</div>
            <div>Authorized Signature</div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } else {
      toast.error("Popup blocked! Please allow popups for this site.");
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm(`Are you sure you want to delete employee ${employeeId}?`)) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('employee_id', employeeId);

      if (error) throw error;

      toast.success(`Employee ${employeeId} deleted successfully`);
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to delete employee: ${error.message}`);
    }
  };

  // Fetch data with error handling (updated to use lunch settings)
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: employees, error: empError } = await supabase
        .from("employees")
        .select("*");

      const { data: attendance, error: attError } = await supabase
        .from("attendance")
        .select("*")
        .gte("date", startDate?.toISOString())
        .lte("date", endDate?.toISOString());

      if (empError || attError) throw empError || attError;

      const payrollData: PayrollRow[] = (employees || []).map((emp: any) => {
        const empAttendance = (attendance || []).filter((a) => a.employee_id === emp.employee_id);
        const present = empAttendance.filter((a) => a.status === "Present" || a.status === "Late").length;
        const ot = empAttendance.reduce((sum, a) => sum + safe(a.ot_hours), 0);

        const per_day = safe(emp.basic) / daysInMonth;
        const per_hour = per_day / 8;

        const earn_basic = per_day * present;
        const earn_hra = (safe(emp.hra) / daysInMonth) * present;
        const earn_conveyance = (safe(emp.conveyance) / daysInMonth) * present;
        const earn_gross = earn_basic + earn_hra + earn_conveyance;
        const ot_amount = per_hour * 1.5 * ot;
        const earning_total_gross = earn_gross + ot_amount;

        const esi_ded = earning_total_gross * 0.0075;
        const pf = safe(earn_basic) * 0.12;
        const lwf = Math.round(safe(earning_total_gross) > 12500 ? 31 : safe(earning_total_gross) * 0.002);
        const total_ded = esi_ded + pf + lwf;

        // Lunch calculation based on settings
        const lunch = present;
        const lunch_amount = enableLunch ? present * dailyLunchAmount : 0;

        const total = earning_total_gross - total_ded;
        const total_amount = total + lunch_amount;
        const advance = 0;
        const net_payable = total_amount - advance;

        return {
          id_code: emp.employee_id,
          name: emp.employee_name,
          father: emp.father_name,
          esi: emp.esi_number,
          uan: emp.uan_number,
          department: emp.department,
          designation: emp.designation,
          basic: safe(emp.basic),
          hra: safe(emp.hra),
          conveyance: safe(emp.conveyance),
          gross: safe(emp.basic + emp.hra + emp.conveyance),
          days: present,
          earn_basic,
          earn_hra,
          earn_conveyance,
          earn_gross,
          overtime: ot,
          ot_amount,
          earning_total_gross,
          esi_ded,
          pf,
          lwf,
          total_ded,
          total,
          lunch,
          lunch_amount,
          total_amount,
          advance,
          net_payable,
          joining_date: emp.joining_date
        };
      });

      setPayroll(payrollData);
      setFilteredPayroll(payrollData);
      toast.success("Payroll data loaded successfully");
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error(`Failed to load payroll data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Save Payroll to Database
  const savePayrollToDatabase = async () => {
    if (filteredPayroll.length === 0) {
      toast.warning("No payroll data to save. Please load data first.");
      return;
    }

    setLoading(true);
    try {
      const monthNum = startDate?.getMonth() + 1;
      const yearNum = startDate?.getFullYear();
      if (!monthNum || !yearNum) {
        toast.error("Invalid date range selected.");
        return;
      }
      const monthStr = `${yearNum}-${String(monthNum).padStart(2, '0')}`;

      const rows = filteredPayroll.map(row => ({
        employee_id: row.id_code,
        month: monthStr,
        month_int: monthNum,
        year_int: yearNum,
        earn_basic: row.earn_basic,
        earn_hra: row.earn_hra,
        earn_conveyance: row.earn_conveyance,
        ot_amount: row.ot_amount,
        esi: row.esi_ded,
        pf: row.pf,
        lwf: row.lwf,
        advance: row.advance,
        net_payable: row.net_payable,
        days_present: row.days,
        days_in_month: new Date(yearNum, monthNum, 0).getDate(),
        lunch_amount: row.lunch_amount,   // updated
        total_amount: row.total_amount,
        total_ded: row.total_ded
      }));

      const { error } = await supabase
        .from('payroll_sheet')
        .upsert(rows, { onConflict: 'employee_id, month_int, year_int' });

      if (error) throw error;

      toast.success(`Payroll saved for ${rows.length} employees for ${monthStr}`);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(`Failed to save payroll: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...payroll];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        row.name.toLowerCase().includes(term) ||
        row.id_code.toLowerCase().includes(term) ||
        row.department.toLowerCase().includes(term) ||
        row.designation.toLowerCase().includes(term)
      );
    }

    if (selectedDepartment !== "all") {
      result = result.filter(row => row.department === selectedDepartment);
    }

    setFilteredPayroll(result);
  }, [searchTerm, selectedDepartment, payroll]);

  // Re-fetch when date range changes
  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Also re-fetch when lunch settings change (so the UI updates)
  useEffect(() => {
    if (payroll.length > 0) {
      // Re-run fetchData to reflect new lunch settings
      fetchData();
    }
  }, [enableLunch, dailyLunchAmount]);

  // Download CSV with better formatting
  const downloadCSV = () => {
    const headers = [
      "S.No.", "ID CODE", "Name", "FATHER", "ESI", "UAN", "DEPARTMENT", "DESIGNATION",
      "BASIC", "HRA", "CONV", "GROSS", "Days", "Earn BASIC", "Earn HRA", "Earn CONV",
      "Earn GROSS", "OT", "OT Amount", "Total Gross", "ESI", "PF", "LWF", "Total Ded",
      "Total", "Lunch", "Lunch Amt", "Total Amt", "Advance", "Net Pay"
    ];

    const rows = filteredPayroll.map((row, i) => [
      i + 1,
      `"${row.id_code}"`,
      row.name,
      row.father,
      `"${row.esi}"`,
      `"${row.uan}"`,
      row.department,
      row.designation,
      fixed(row.basic),
      fixed(row.hra),
      fixed(row.conveyance),
      fixed(row.gross),
      row.days,
      fixed(row.earn_basic),
      fixed(row.earn_hra),
      fixed(row.earn_conveyance),
      fixed(row.earn_gross),
      fixed(row.overtime, 2),
      fixed(row.ot_amount),
      fixed(row.earning_total_gross),
      fixed(row.esi_ded),
      fixed(row.pf),
      fixed(row.lwf),
      fixed(row.total_ded),
      fixed(row.total),
      row.lunch,
      fixed(row.lunch_amount),
      fixed(row.total_amount),
      row.advance,
      fixed(row.net_payable)
    ]);

    // Add summary row
    rows.push([
      "",
      "",
      "TOTALS",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      summary.totalDays,
      "",
      "",
      "",
      "",
      fixed(summary.totalOvertime, 2),
      "",
      fixed(summary.totalEarnings),
      "",
      "",
      "",
      fixed(summary.totalDeductions),
      "",
      "",
      "",
      "",
      fixed(summary.totalNetPay)
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  // Print payroll
  const printPayroll = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Payroll Report</title>
            <style>
              body { font-family: Arial, sans-serif; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .summary { margin-top: 20px; padding: 10px; background-color: #f9f9f9; }
              .header { text-align: center; margin-bottom: 20px; }
              @media print {
                .no-print { display: none; }
                table { font-size: 12px; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Payroll Report</h2>
              <p>Period: ${startDate?.toLocaleDateString()} to ${endDate?.toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  ${["S.No.", "ID", "Name", "Dept", "Desig", "Days", "Basic", "HRA", "Conv", "Gross", "OT", "Deductions", "Net Pay"].map(h => `<th>${h}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${filteredPayroll.map((row, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${row.id_code}</td>
                    <td>${row.name}</td>
                    <td>${row.department}</td>
                    <td>${row.designation}</td>
                    <td>${row.days}</td>
                    <td>${fixed(row.earn_basic)}</td>
                    <td>${fixed(row.earn_hra)}</td>
                    <td>${fixed(row.earn_conveyance)}</td>
                    <td>${fixed(row.earn_gross)}</td>
                    <td>${fixed(row.overtime, 2)}</td>
                    <td>${fixed(row.total_ded)}</td>
                    <td>${fixed(row.net_payable)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <div class="summary">
              <p><strong>Summary:</strong></p>
              <p>Employees: ${summary.totalEmployees} | Total Days: ${summary.totalDays} | Total OT: ${fixed(summary.totalOvertime, 2)} hrs</p>
              <p>Total Earnings: ₹${fixed(summary.totalEarnings)} | Total Deductions: ₹${fixed(summary.totalDeductions)} | Net Pay: ₹${fixed(summary.totalNetPay)}</p>
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 200);
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Handle advance edit
  const handleAdvanceEdit = (id: string, currentValue: number) => {
    setEditAdvance({ id, value: currentValue });
  };

  const saveAdvanceEdit = (id: string) => {
    setPayroll(prev => prev.map(row =>
      row.id_code === id
        ? {
          ...row,
          advance: editAdvance.value,
          net_payable: row.total_amount - editAdvance.value
        }
        : row
    ));
    setEditAdvance({ id: null, value: 0 });
    toast.success("Advance amount updated");
  };

  // Get unique departments for filter dropdown
  const departments = useMemo(() => {
    const depts = new Set(payroll.map(row => row.department));
    return ["all", ...Array.from(depts).sort()];
  }, [payroll]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Lunch Settings Modal */}
      {showLunchModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-indigo-800">Lunch Allowance Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">Enable Lunch Allowance</span>
                <button
                  onClick={() => setEnableLunch(!enableLunch)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enableLunch ? 'bg-green-600' : 'bg-gray-300'}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enableLunch ? 'translate-x-6' : 'translate-x-1'}`}
                  />
                </button>
              </div>
              {enableLunch && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Lunch Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={dailyLunchAmount}
                    onChange={(e) => setDailyLunchAmount(Number(e.target.value) || 0)}
                    className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">This amount will be multiplied by working days.</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setShowLunchModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowLunchModal(false);
                    toast.success("Lunch settings updated. Refresh data to apply.");
                    // Optionally re-fetch to apply changes instantly
                    fetchData();
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Apply & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-800">Advanced Payroll System</h1>
            <p className="text-gray-600">
              {startDate && endDate &&
                `Period: ${String(startDate.getDate()).padStart(2, "0")
                }/${String(startDate.getMonth() + 1).padStart(2, "0")
                }/${startDate.getFullYear()} - ${String(endDate.getDate()).padStart(2, "0")
                }/${String(endDate.getMonth() + 1).padStart(2, "0")
                }/${endDate.getFullYear()}`
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLunchModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded shadow flex items-center"
            >
              <FiSettings className="mr-2" /> Lunch Settings
            </button>
            <button
              onClick={savePayrollToDatabase}
              className="bg-yellow-600 text-white px-4 py-2 rounded shadow flex items-center"
              disabled={loading}
            >
              <FiSave className="mr-2" /> Save Payroll
            </button>
            <button
              onClick={printPayroll}
              className="bg-blue-600 text-white px-4 py-2 rounded shadow flex items-center"
            >
              <FiPrinter className="mr-2" /> Print
            </button>
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded shadow flex items-center"
            >
              <FiDownload className="mr-2" /> Export
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search employees..."
                className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg flex items-center"
            >
              <FiFilter className="mr-2" /> Filters
            </button>

            <div className="flex items-center space-x-2">
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dateFormat="dd/MM/yyyy"
              />
              <span>to</span>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate!}
                className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                dateFormat="dd/MM/yyyy"
              />
              <button
                onClick={fetchData}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
                disabled={loading}
              >
                {loading ? "Loading..." : "Apply"}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === "all" ? "All Departments" : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">Employees</h3>
            <p className="text-2xl font-bold">{summary.totalEmployees}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">Total Earnings</h3>
            <p className="text-2xl font-bold">₹{fixed(summary.totalEarnings)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-medium">Total Deductions</h3>
            <p className="text-2xl font-bold">₹{fixed(summary.totalDeductions)}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm font-medium">Net Payable</h3>
            <p className="text-2xl font-bold">₹{fixed(summary.totalNetPay)}</p>
          </div>
        </div>

        {/* Payroll Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-indigo-50">
                <tr>
                  {[
                    "S.No.", "ID CODE", "Name", "FATHER", "ESI", "UAN", "DEPARTMENT", "DESIGNATION",
                    "BASIC", "HRA", "CONV", "GROSS", "Days", "Earn BASIC", "Earn HRA", "Earn CONV",
                    "Earn GROSS", "OT", "OT Amount", "Total Gross", "ESI", "PF", "LWF", "Total Ded",
                    "Total", "Lunch", "Lunch Amt", "Total Amt", "Advance", "Net Pay"
                  ].map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-indigo-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={31} className="px-4 py-6 text-center text-gray-500">
                      Loading payroll data...
                    </td>
                  </tr>
                ) : filteredPayroll.length === 0 ? (
                  <tr>
                    <td colSpan={31} className="px-4 py-6 text-center text-gray-500">
                      No payroll data available for the selected criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayroll.map((row, index) => (
                    <tr key={row.id_code} className="hover:bg-gray-50">
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-blue-600">
                        {row.id_code}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {row.name}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {row.father}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {row.esi}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {row.uan}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {row.department}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {row.designation}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.basic)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.hra)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.conveyance)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.gross)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {row.days}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.earn_basic)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.earn_hra)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.earn_conveyance)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.earn_gross)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.overtime, 2)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.ot_amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.earning_total_gross)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.esi_ded)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.pf)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.lwf)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.total_ded)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.total)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {row.lunch}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.lunch_amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {fixed(row.total_amount)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                        {editAdvance.id === row.id_code ? (
                          <input
                            type="number"
                            value={editAdvance.value}
                            onChange={(e) => setEditAdvance({ ...editAdvance, value: safe(e.target.value) })}
                            className="w-20 border rounded px-1 py-0.5"
                            onBlur={() => saveAdvanceEdit(row.id_code)}
                            onKeyDown={(e) => e.key === "Enter" && saveAdvanceEdit(row.id_code)}
                            autoFocus
                          />
                        ) : (
                          <span
                            className="cursor-pointer hover:text-blue-600 hover:underline"
                            onClick={() => handleAdvanceEdit(row.id_code, row.advance)}
                          >
                            {row.advance}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-green-700 text-right">
                        {fixed(row.net_payable)}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewEmployee(row.id_code);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                            title="View Employee"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEmployee(row.id_code);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50"
                            title="Edit Employee"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePrintPayslip(row.id_code);
                            }}
                            className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50"
                            title="Print Payslip"
                          >
                            <FiPrinter size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEmployee(row.id_code);
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete Employee"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredPayroll.length > 0 && (
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={12} className="px-4 py-2 text-sm font-bold text-right">
                      TOTALS:
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-right">{summary.totalDays}</td>
                    <td colSpan={6}></td>
                    <td className="px-4 py-2 text-sm font-bold text-right">{fixed(summary.totalOvertime, 2)}</td>
                    <td></td>
                    <td className="px-4 py-2 text-sm font-bold text-right">{fixed(summary.totalEarnings)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="px-4 py-2 text-sm font-bold text-right">{fixed(summary.totalDeductions)}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td className="px-4 py-2 text-sm font-bold text-right text-green-700">
                      {fixed(summary.totalNetPay)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Summary Section */}
        {filteredPayroll.length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold text-indigo-800 mb-3">Payroll Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Earnings</h4>
                <ul className="space-y-1">
                  <li className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.earn_basic, 0))}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>HRA:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.earn_hra, 0))}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Conveyance:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.earn_conveyance, 0))}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Overtime:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.ot_amount, 0))}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Lunch Allowance:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.lunch_amount, 0))}</span>
                  </li>
                  <li className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total Earnings:</span>
                    <span>₹{fixed(summary.totalEarnings)}</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Deductions</h4>
                <ul className="space-y-1">
                  <li className="flex justify-between">
                    <span>ESI:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.esi_ded, 0))}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>PF:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.pf, 0))}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>LWF:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.lwf, 0))}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Advances:</span>
                    <span>₹{fixed(filteredPayroll.reduce((sum, row) => sum + row.advance, 0))}</span>
                  </li>
                  <li className="flex justify-between font-bold border-t pt-2 mt-2">
                    <span>Total Deductions:</span>
                    <span>₹{fixed(summary.totalDeductions)}</span>
                  </li>
                </ul>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h4 className="font-medium text-indigo-800 mb-2">Final Summary</h4>
                <ul className="space-y-2">
                  <li className="flex justify-between">
                    <span>Total Employees:</span>
                    <span>{summary.totalEmployees}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total Days Worked:</span>
                    <span>{summary.totalDays}</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Total Overtime Hours:</span>
                    <span>{fixed(summary.totalOvertime, 2)}</span>
                  </li>
                  <li className="flex justify-between text-lg font-bold mt-4 pt-2 border-t border-indigo-200">
                    <span>Net Payable Amount:</span>
                    <span className="text-green-700">₹{fixed(summary.totalNetPay)}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}