"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from '@/lib/supabase-provider';
import { saveAs } from "file-saver";
import Papa from "papaparse";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiDownload, FiSearch, FiUserCheck, FiUserX, FiClock, FiCalendar } from "react-icons/fi";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import AttendanceScanner from '@/components/AttendanceScanner'; // <-- new import

// Types (unchanged)
type Employee = {
  employee_id: string;
  employee_name: string;
  department: string;
  designation?: string;
  father_name?: string;
};

type AttendanceRecord = {
  id?: string;
  employee_id: string;
  employee_name: string;
  date: string;
  status: "Present" | "Absent" | "Late";
  check_in?: string | null;
  check_out?: string | null;
  ot_hours?: number;
  note?: string;
};

type MonthlyAttendance = {
  employee_id: string;
  employee_name: string;
  department: string;
  designation?: string;
  father_name?: string;
  days: Record<number, {
    check_in: string;
    check_out: string;
    ot: number;
    code: string;
  }>;
  absent: number;
  present: number;
  total_ot: number;
};

export default function AdvancedAttendanceSystem() {
  // State (existing)
  const [formData, setFormData] = useState<Partial<AttendanceRecord>>({
    status: "Present",
    date: new Date().toISOString().split("T")[0]
  });
  const { supabase } = useSupabase();
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendance[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    search: "",
    department: ""
  });
  const [loading, setLoading] = useState({
    daily: false,
    monthly: false,
    summary: false,
    submit: false
  });
  const [stats, setStats] = useState({
    presentCount: 0,
    absentCount: 0,
    lateCount: 0,
    attendanceRate: "0%"
  });
  const [viewMode, setViewMode] = useState<"daily" | "monthly" | "summary">("daily");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // New state for scanner
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Constants
  const today = new Date().toISOString().split("T")[0];
  const daysInMonth = useMemo(() =>
    new Date(filters.year, filters.month, 0).getDate(),
    [filters.year, filters.month]
  );

  // ... (all your existing functions: fetchInitialData, fetchDailyAttendance, fetchMonthlyAttendance, fetchAttendanceSummary, etc.)
  // They remain exactly the same – no changes needed.

  // I'm copying them here for completeness – but you already have them in your code.
  // Make sure to keep your existing functions.

  // Memoized filtered data
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp =>
      emp.employee_name.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.employee_id.toLowerCase().includes(filters.search.toLowerCase()) ||
      emp.department.toLowerCase().includes(filters.search.toLowerCase())
    );
  }, [employees, filters.search]);

  const departmentOptions = useMemo(() => {
    const depts = new Set(employees.map(e => e.department));
    return Array.from(depts);
  }, [employees]);

  // Fetch data (your existing functions)
  const fetchInitialData = useCallback(async () => {
    try {
      const { data: employeesData } = await supabase
        .from("employees")
        .select("employee_id, employee_name, department, designation, father_name");

      if (employeesData) setEmployees(employeesData);

      await fetchDailyAttendance();
      await fetchMonthlyAttendance();
      await fetchAttendanceSummary();
    } catch (error) {
      toast.error("Failed to load initial data");
      console.error("Initial data error:", error);
    }
  }, []);

  const fetchDailyAttendance = useCallback(async () => {
    setLoading(prev => ({ ...prev, daily: true }));
    try {
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", today);

      if (data) {
        const present = data.filter(d => d.status === "Present").length;
        const absent = data.filter(d => d.status === "Absent").length;
        const late = data.filter(d => d.status === "Late").length;
        const rate = Math.round((present / (data.length || 1)) * 100);

        setAttendance(data);
        setStats({
          presentCount: present,
          absentCount: absent,
          lateCount: late,
          attendanceRate: `${rate}%`
        });
      }
    } catch (error) {
      toast.error("Failed to load daily attendance");
      console.error("Daily attendance error:", error);
    } finally {
      setLoading(prev => ({ ...prev, daily: false }));
    }
  }, [today]);

  const fetchMonthlyAttendance = useCallback(async () => {
    if (!employees.length) return;
    setLoading(prev => ({ ...prev, monthly: true }));
    try {
      const start = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
      const end = `${filters.year}-${String(filters.month).padStart(2, "0")}-${daysInMonth}`;

      const { data: logs } = await supabase
        .from("attendance")
        .select("employee_id, date, check_in, check_out, ot_hours, status")
        .gte("date", start)
        .lte("date", end);

      const map: Record<string, MonthlyAttendance> = {};

      employees.forEach((e) => {
        map[e.employee_id] = {
          ...e,
          days: {},
          absent: 0,
          present: 0,
          total_ot: 0,
        };
      });

      logs?.forEach((log) => {
        const day = new Date(log.date).getDate();
        const emp = map[log.employee_id];
        if (!emp) return;

        emp.days[day] = {
          check_in: log.check_in || "-",
          check_out: log.check_out || "-",
          ot: log.ot_hours || 0,
          code: log.status === "Absent" ? "A" : "P",
        };

        if (log.status === "Absent") emp.absent++;
        else emp.present++;

        if (log.ot_hours) emp.total_ot += parseFloat(log.ot_hours);
      });

      setMonthlyAttendance(Object.values(map));
    } catch (error) {
      toast.error("Failed to load monthly attendance");
      console.error("Monthly attendance error:", error);
    } finally {
      setLoading(prev => ({ ...prev, monthly: false }));
    }
  }, [employees, filters.year, filters.month, daysInMonth]);

  const fetchAttendanceSummary = useCallback(async () => {
    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const start = `${filters.year}-${String(filters.month).padStart(2, "0")}-01`;
      const end = `${filters.year}-${String(filters.month).padStart(2, "0")}-${daysInMonth}`;

      const { data: records } = await supabase
        .from("attendance")
        .select("employee_id, date, status")
        .gte("date", start)
        .lte("date", end);

      const summaryMap: Record<string, any> = {};
      employees.forEach((emp) => {
        summaryMap[emp.employee_id] = {
          ...emp,
          days: Array(daysInMonth).fill("-"),
        };
      });

      records?.forEach((record) => {
        const day = new Date(record.date).getDate();
        const symbol = record.status === "Absent" ? "A" : "P";
        if (summaryMap[record.employee_id]) {
          summaryMap[record.employee_id].days[day - 1] = symbol;
        }
      });

      setSummary(Object.values(summaryMap));
    } catch (error) {
      toast.error("Failed to load attendance summary");
      console.error("Summary error:", error);
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  }, [employees, filters.year, filters.month, daysInMonth]);

  // Form handlers (unchanged)
  const handleEmployeeSelect = useCallback(async (empId: string) => {
    const employee = employees.find(e => e.employee_id === empId);
    if (!employee) {
      toast.error("Employee not found");
      return;
    }

    setSelectedEmployee(employee);
    setFormData(prev => ({
      ...prev,
      employee_id: empId,
      employee_name: employee.employee_name
    }));

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", empId)
      .eq("date", today)
      .maybeSingle();

    if (data) {
      setFormData(prev => ({
        ...prev,
        status: data.status,
        check_in: data.check_in || undefined,
        check_out: data.check_out || undefined,
        note: data.note || undefined
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        status: "Present",
        check_in: undefined,
        check_out: undefined,
        note: undefined
      }));
    }
  }, [employees, today]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, submit: true }));

    try {
      if (!formData.employee_id || !formData.employee_name) {
        toast.warning("Please select an employee");
        return;
      }

      let otHours = 0;
      if (formData.check_in && formData.check_out && formData.status !== "Absent") {
        const checkInTime = new Date(`${today}T${formData.check_in}`);
        const checkOutTime = new Date(`${today}T${formData.check_out}`);

        if (checkOutTime < checkInTime) checkOutTime.setDate(checkOutTime.getDate() + 1);

        const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / 3600000;
        if (hoursWorked > 9) otHours = parseFloat((hoursWorked - 9).toFixed(2));
      }

      const { data: existing } = await supabase
        .from("attendance")
        .select("*")
        .eq("employee_id", formData.employee_id)
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("attendance")
          .update({
            status: formData.status,
            check_in: formData.status === "Absent" ? null : formData.check_in,
            check_out: formData.status === "Absent" ? null : formData.check_out,
            ot_hours: otHours,
            note: formData.note
          })
          .eq("id", existing.id);

        if (error) throw error;
        toast.success("Attendance updated successfully");
      } else {
        const { error } = await supabase.from("attendance").insert([{
          employee_id: formData.employee_id,
          employee_name: formData.employee_name,
          date: today,
          status: formData.status,
          check_in: formData.status === "Absent" ? null : formData.check_in,
          check_out: formData.status === "Absent" ? null : formData.check_out,
          ot_hours: otHours,
          note: formData.note
        }]);

        if (error) throw error;
        toast.success("Attendance marked successfully");
      }

      await Promise.all([
        fetchDailyAttendance(),
        fetchMonthlyAttendance(),
        fetchAttendanceSummary()
      ]);

      setFormData({
        status: "Present",
        date: today
      });
      setSelectedEmployee(null);
    } catch (error) {
      toast.error("Failed to save attendance");
      console.error("Submit error:", error);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  }, [formData, today, fetchDailyAttendance, fetchMonthlyAttendance, fetchAttendanceSummary]);

  const markRemainingAbsent = useCallback(async () => {
    if (!confirm("Mark all unmarked employees as absent?")) return;

    try {
      const { data: todayAttendance } = await supabase
        .from("attendance")
        .select("employee_id")
        .eq("date", today);

      const markedIds = todayAttendance?.map(a => a.employee_id) ?? [];
      const unmarkedEmployees = employees.filter(emp => !markedIds.includes(emp.employee_id));

      if (unmarkedEmployees.length === 0) {
        toast.info("All employees are already marked");
        return;
      }

      const absentEntries = unmarkedEmployees.map(emp => ({
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        date: today,
        status: "Absent",
        check_in: null,
        check_out: null,
        note: "Auto-marked Absent",
        ot_hours: 0,
      }));

      const { error } = await supabase.from("attendance").insert(absentEntries);
      if (error) throw error;

      toast.success(`Marked ${absentEntries.length} employees as absent`);
      await fetchDailyAttendance();
    } catch (error) {
      toast.error("Failed to mark absentees");
      console.error("Mark absent error:", error);
    }
  }, [employees, today, fetchDailyAttendance]);

  // Export functions (unchanged)
  const exportToCSV = useCallback((data: any[], fileName: string) => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`);
  }, []);

  const exportDailyAttendance = useCallback(() => {
    exportToCSV(attendance, "daily_attendance");
  }, [attendance, exportToCSV]);

  const exportMonthlyAttendance = useCallback(() => {
    const data = monthlyAttendance.map(row => {
      const flat: Record<string, any> = {
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        department: row.department,
        designation: row.designation,
        father_name: row.father_name,
      };

      Array.from({ length: daysInMonth }, (_, i) => i + 1).forEach(d => {
        const day = row.days[d] || {};
        flat[`${d}_check_in`] = day.check_in || "-";
        flat[`${d}_check_out`] = day.check_out || "-";
        flat[`${d}_ot`] = day.ot || 0;
        flat[`${d}_code`] = day.code || "A";
      });

      flat["total_absent"] = row.absent;
      flat["total_present"] = row.present;
      flat["total_ot"] = row.total_ot;

      return flat;
    });

    exportToCSV(data, "monthly_attendance");
  }, [monthlyAttendance, daysInMonth, exportToCSV]);

  const exportSummary = useCallback(() => {
    const data = summary.map(row => {
      const flat: Record<string, any> = {
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        department: row.department,
      };

      if (Array.isArray(row.days)) {
        for (let i = 0; i < daysInMonth; i++) {
          flat[`${i + 1}`] = row.days[i] || "-";
        }
      }

      return flat;
    });

    exportToCSV(data, "attendance_summary");
  }, [summary, daysInMonth, exportToCSV]);

  // Effects
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    if (viewMode === "monthly") {
      fetchMonthlyAttendance();
    } else if (viewMode === "summary") {
      fetchAttendanceSummary();
    }
  }, [viewMode, fetchMonthlyAttendance, fetchAttendanceSummary]);

  // Stats for dashboard
  const dashboardStats = [
    { icon: <FiUserCheck className="text-green-500" />, title: "Present", value: stats.presentCount },
    { icon: <FiUserX className="text-red-500" />, title: "Absent", value: stats.absentCount },
    { icon: <FiClock className="text-yellow-500" />, title: "Late", value: stats.lateCount },
    { icon: <FiCalendar className="text-blue-500" />, title: "Attendance Rate", value: stats.attendanceRate },
  ];

  const attendanceChartData = useMemo(() => {
    return [
      { name: "Present", value: stats.presentCount, fill: "#4ade80" },
      { name: "Absent", value: stats.absentCount, fill: "#f87171" },
      { name: "Late", value: stats.lateCount, fill: "#fbbf24" },
    ];
  }, [stats]);

  // ----- NEW: Scanner Button added in View Controls -----
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Employee Attendance System</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm bg-indigo-600 px-3 py-1 rounded-full">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Dashboard Stats (unchanged) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {dashboardStats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-4 flex items-center">
              <div className="p-3 rounded-full bg-gray-100 mr-4">
                {stat.icon}
              </div>
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-xl font-semibold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Stats Chart (unchanged) */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Attendance Overview</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Count">
                  {attendanceChartData.map((entry, index) => (
                    <React.Fragment key={`cell-${index}`}>
                      <Bar dataKey="value" fill={entry.fill} />
                    </React.Fragment>
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Attendance Form (unchanged) */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Mark Attendance</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                <select
                  className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.employee_id || ""}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.employee_id} value={emp.employee_id}>
                      {emp.employee_name} ({emp.employee_id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    status: e.target.value as "Present" | "Absent" | "Late"
                  }))}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              {formData.status !== "Absent" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
                    <input
                      type="time"
                      className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.check_in || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        check_in: e.target.value
                      }))}
                      required={!formData.check_in}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-out (optional)</label>
                    <input
                      type="time"
                      className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                      value={formData.check_out || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        check_out: e.target.value
                      }))}
                    />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Optional note"
                  value={formData.note || ""}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    note: e.target.value
                  }))}
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 flex items-center"
                disabled={loading.submit}
              >
                {loading.submit ? "Processing..." : "Submit Attendance"}
              </button>

              <button
                type="button"
                onClick={markRemainingAbsent}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center"
              >
                <FiUserX className="mr-2" />
                Mark Remaining Absent
              </button>
            </div>
          </form>
        </div>

        {/* View Controls – SCANNER BUTTON ADDED */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-4 py-2 rounded ${viewMode === "daily" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            >
              Daily View
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-4 py-2 rounded ${viewMode === "monthly" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            >
              Monthly View
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 rounded ${viewMode === "summary" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            >
              Summary View
            </button>
          </div>

          <div className="flex space-x-2">
            {/* Scanner Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="bg-purple-600 text-white px-3 py-1 rounded flex items-center"
            >
              📸 Scan Sheet
            </button>

            {viewMode === "daily" && (
              <button
                onClick={exportDailyAttendance}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center"
              >
                <FiDownload className="mr-1" />
                Export
              </button>
            )}
            {viewMode === "monthly" && (
              <button
                onClick={exportMonthlyAttendance}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center"
              >
                <FiDownload className="mr-1" />
                Export
              </button>
            )}
            {viewMode === "summary" && (
              <button
                onClick={exportSummary}
                className="bg-green-600 text-white px-3 py-1 rounded flex items-center"
              >
                <FiDownload className="mr-1" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Date Filters (unchanged) */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center">
              <label className="mr-2 text-sm font-medium">Month:</label>
              <select
                className="border p-2 rounded"
                value={filters.month}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  month: parseInt(e.target.value)
                }))}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="mr-2 text-sm font-medium">Year:</label>
              <select
                className="border p-2 rounded"
                value={filters.year}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  year: parseInt(e.target.value)
                }))}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Search employees..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    search: e.target.value
                  }))}
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="mr-2 text-sm font-medium">Department:</label>
              <select
                className="border p-2 rounded"
                value={filters.department}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  department: e.target.value
                }))}
              >
                <option value="">All Departments</option>
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {(loading.daily || loading.monthly || loading.summary) && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}

        {/* The rest of your tables (Monthly, Daily, Summary) – unchanged */}
        {viewMode === "monthly" && !loading.monthly && (
          <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-indigo-700">
                  Detailed Monthly Attendance - {new Date(filters.year, filters.month - 1).toLocaleString('default', { month: 'long' })} {filters.year}
                </h2>
                <button
                  onClick={exportMonthlyAttendance}
                  className="bg-green-600 text-white px-3 py-1 rounded flex items-center"
                >
                  <FiDownload className="mr-1" />
                  Export Detailed
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse border text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th rowSpan={2} className="border px-2">S.NO</th>
                    <th rowSpan={2} className="border px-2">ID</th>
                    <th rowSpan={2} className="border px-2">Name</th>
                    <th rowSpan={2} className="border px-2">Dept</th>
                    <th rowSpan={2} className="border px-2">Designation</th>
                    <th rowSpan={2} className="border px-2">Father's Name</th>
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <th key={d} colSpan={5} className="border px-1 text-center">
                        {d}
                      </th>
                    ))}
                    <th rowSpan={2} className="border px-2">Absent</th>
                    <th rowSpan={2} className="border px-2">Present</th>
                    <th rowSpan={2} className="border px-2">Total OT</th>
                  </tr>
                  <tr className="bg-gray-200">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                      <React.Fragment key={d}>
                        <th className="border px-1">IN Time</th>
                        <th className="border px-1">Out Time</th>
                        <th className="border px-1">Total Hrs</th>
                        <th className="border px-1">Regular</th>
                        <th className="border px-1">OT Hrs</th>
                        <th className="border px-1">Status</th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyAttendance.length > 0 ? (
                    monthlyAttendance.map((rec, i) => (
                      <tr key={rec.employee_id}>
                        <td className="border px-2 text-center">{i + 1}</td>
                        <td className="border px-2">{rec.employee_id}</td>
                        <td className="border px-2">{rec.employee_name}</td>
                        <td className="border px-2">{rec.department}</td>
                        <td className="border px-2">{rec.designation || "-"}</td>
                        <td className="border px-2">{rec.father_name || "-"}</td>

                        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
                          const day = rec.days[d] || {};
                          const checkIn = day.check_in || "-";
                          const checkOut = day.check_out || "-";
                          const regularHours = 9; // Standard work hours
                          const ot = day.ot || 0;
                          const code = day.code || "-";

                          let hoursWorked = 0;
                          if (checkIn !== "-" && checkOut !== "-") {
                            const t1 = new Date(`1970-01-01T${checkIn}`);
                            const t2 = new Date(`1970-01-01T${checkOut}`);
                            if (t2 < t1) t2.setDate(t2.getDate() + 1);
                            hoursWorked = (t2.getTime() - t1.getTime()) / 3600000;
                          }

                          return (
                            <React.Fragment key={d}>
                              <td className="border px-1 text-center">{checkIn}</td>
                              <td className="border px-1 text-center">{checkOut}</td>
                              <td className="border px-1 text-center">
                                {hoursWorked ? hoursWorked.toFixed(2) : "-"}
                              </td>
                              <td className="border px-1 text-center">{regularHours}</td>
                              <td className="border px-1 text-center">{ot.toFixed(2)}</td>
                              <td className={`border px-1 text-center ${code === "P" ? "text-green-600" :
                                code === "A" ? "text-red-600" : "text-gray-500"
                                }`}>
                                {code}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        <td className="border px-2 text-center">{rec.absent}</td>
                        <td className="border px-2 text-center">{rec.present}</td>
                        <td className="border px-2 text-center">{rec.total_ot.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6 + (daysInMonth * 6) + 3} className="border px-4 py-2 text-center text-gray-500">
                        No attendance records found for selected month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === "daily" && !loading.daily && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.length > 0 ? (
                    attendance.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.employee_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.employee_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === "Present"
                            ? "bg-green-100 text-green-800"
                            : record.status === "Late"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                            }`}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.check_in || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.check_out || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.ot_hours || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{record.note || "-"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                        No attendance records found for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === "monthly" && !loading.monthly && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {i + 1}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OT Hours</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {monthlyAttendance.length > 0 ? (
                    monthlyAttendance.map((record) => (
                      <tr key={record.employee_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.employee_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.employee_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.department}</td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1;
                          const data = record.days[day] || {};
                          return (
                            <td key={day} className="px-1 py-4 text-center text-xs">
                              <div className={`h-6 w-6 mx-auto rounded-full flex items-center justify-center ${data.code === "P" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                {data.code || "A"}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.present}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.absent}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.total_ot.toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={daysInMonth + 6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No attendance records found for selected month
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {viewMode === "summary" && !loading.summary && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <th key={i} className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.length > 0 ? (
                    summary.map((row) => (
                      <tr key={row.employee_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.employee_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.employee_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.department}</td>
                        {row.days.map((day: string, index: number) => (
                          <td key={index} className="px-1 py-4 text-center text-xs">
                            <span className={`inline-block h-6 w-6 rounded-full flex items-center justify-center ${day === "P" ? "bg-green-100 text-green-800" : day === "A" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"
                              }`}>
                              {day}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={daysInMonth + 3} className="px-6 py-4 text-center text-sm text-gray-500">
                        No attendance summary available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>Employee Attendance System &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>

      {/* ---------- Scanner Modal ---------- */}
      <AttendanceScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSuccess={() => {
          // Refresh all data after scanner saves
          fetchDailyAttendance();
          fetchMonthlyAttendance();
          fetchAttendanceSummary();
        }}
        selectedDate={today}
      />
    </div>
  );
}