"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from '@/lib/supabase-provider';
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import {
  FiUsers,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiAlertCircle,
  FiTrendingUp,
  FiSettings,
  FiRefreshCw,
  FiUser,
  FiActivity,
  FiLogOut
} from "react-icons/fi";
import { FaRegCalendarCheck, FaUserClock } from "react-icons/fa";
import { BsGraphUpArrow, BsCashCoin } from "react-icons/bs";
import { TbReportAnalytics } from "react-icons/tb";
import { MdOutlinePendingActions } from "react-icons/md";

type DashboardStats = {
  employeeCount: number;
  attendanceRate: string;
  pendingLeaves: number;
  monthlyPayroll: string;
  presentToday: number;
  absentToday: number;
  activeRecruitments: number;
  upcomingBirthdays: number;
  trainingSessions: number;
};

type DepartmentData = {
  name: string;
  value: number;
};

type AttendanceTrendData = {
  date: string;
  present: number;
  absent: number;
  attendanceRate?: number;
};

type PayrollData = {
  name: string;
  amount: number;
};

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#f59e0b", "#10b981", "#06b6d4"];

export default function Dashboard() {
  const router = useRouter();
  const { supabase, session } = useSupabase();
  const [sessionChecked, setSessionChecked] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    employeeCount: 0,
    attendanceRate: "0%",
    pendingLeaves: 0,
    monthlyPayroll: "₹ 0",
    presentToday: 0,
    absentToday: 0,
    activeRecruitments: 0,
    upcomingBirthdays: 0,
    trainingSessions: 0
  });

  const [departmentDistribution, setDepartmentDistribution] = useState<DepartmentData[]>([]);
  const [attendanceTrend, setAttendanceTrend] = useState<AttendanceTrendData[]>([]);
  const [payrollTrend, setPayrollTrend] = useState<PayrollData[]>([]);
  const [recentActivity, setRecentActivity] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      console.log("Dashboard Mounted");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log("SESSION ERROR:", error);
      console.log("SESSION:", session);

      if (!session) {
        console.log("Redirecting to login");
        router.replace("/login");
        return;
      }

      console.log("Going to fetch dashboard");

      setSessionChecked(true);
      await fetchDashboardData();
    };

    checkSession();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const fetchDashboardData = async () => {
    console.log("FETCH START");
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      // Mock data fetch functions - replace with your actual Supabase queries
      const fetchEmployeeCount = async () => {
        const { count } = await supabase
          .from("employees")
          .select("*", { count: "exact", head: true });
        return count ?? 0;
      };

      const fetchDepartmentData = async () => {
        const { data } = await supabase
          .from("employees")
          .select("department")
          .neq("department", null);

        const deptCounts = data?.reduce((acc: Record<string, number>, { department }) => {
          acc[department] = (acc[department] || 0) + 1;
          return acc;
        }, {});

        return Object.entries(deptCounts || {}).map(([name, value]) => ({ name, value }));
      };

      const fetchPendingLeaves = async () => {
        try {
          const { count } = await supabase
            .from("leave_requests")
            .select("*", { count: "exact", head: true })
            .eq("status", "Pending");
          return count ?? 0;
        } catch {
          return 0;
        }
      };

      const fetchAttendanceData = async () => {
        try {
          const { data } = await supabase
            .from("attendance")
            .select("*")
            .eq("date", today);

          const present = data?.filter(a => a.status === "Present").length ?? 0;
          const absent = data?.filter(a => a.status === "Absent").length ?? 0;
          const rate = data?.length ? Math.round((present / data.length) * 100) : 0;

          return {
            present,
            absent,
            rate: `${rate}%`
          };
        } catch {
          return { present: 0, absent: 0, rate: "0%" };
        }
      };

      const fetchPayrollData = async () => {
        try {
          const { data } = await supabase
            .from("payroll_sheet")
            .select("total_amount, month_int")
            .eq("year_int", currentYear)
            .order("month_int", { ascending: true });

          const total = data?.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0) || 0;
          const monthlyDisplay = total >= 100000 ? `₹ ${(total / 100000).toFixed(1)}L` : `₹ ${total.toLocaleString()}`;

          const trendData = Array.from({ length: currentMonth }, (_, i) => {
            const monthData = data?.find(p => p.month_int === i + 1);
            return {
              name: new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' }),
              amount: monthData ? Number(monthData.total_amount) / 100000 : 0,
            };
          });

          return { monthlyDisplay, trendData };
        } catch {
          return { monthlyDisplay: "₹ 0", trendData: [] };
        }
      };

      const fetchRecruitmentData = async () => {
        try {
          const { count } = await supabase
            .from("requirements")
            .select("*", { count: "exact", head: true })
            .eq("status", "Active");
          return count ?? 0;
        } catch {
          return 0;
        }
      };

      const fetchBirthdays = async () => {
        try {
          const { data } = await supabase
            .from("employees")
            .select("date_of_birth");

          const today = new Date();
          const next30Days = new Date();
          next30Days.setDate(today.getDate() + 30);

          return data?.filter(emp => {
            if (!emp.date_of_birth) return false;
            const dob = new Date(emp.date_of_birth);
            dob.setFullYear(today.getFullYear());
            return dob >= today && dob <= next30Days;
          }).length || 0;
        } catch {
          return 0;
        }
      };

      const fetchTrainingSessions = async () => {
        try {
          const { count } = await supabase
            .from("information")
            .select("*", { count: "exact", head: true })
            .eq("type", "training")
            .gte("date", today);
          return count ?? 0;
        } catch {
          return 0;
        }
      };

      const fetchRecentActivity = async () => {
        try {
          const { data } = await supabase
            .from("settings")
            .select("activity_log")
            .order("created_at", { ascending: false })
            .limit(5);
          return data?.map(a => a.activity_log) || [];
        } catch {
          return [
            "New employee John Doe joined",
            "Payroll processed for March",
            "System updated to v2.1"
          ];
        }
      };

      const fetchAttendanceTrend = async () => {
        try {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data } = await supabase
            .from("attendance")
            .select("date, status")
            .gte("date", sevenDaysAgo.toISOString().split("T")[0])
            .order("date", { ascending: true });

          const trendByDay = data?.reduce((acc: Record<string, AttendanceTrendData>, { date, status }) => {
            if (!acc[date]) {
              acc[date] = {
                present: 0,
                absent: 0,
                date: date.split("-").slice(1).join("/"),
              };
            }
            if (status === "Present") acc[date].present++;
            if (status === "Absent") acc[date].absent++;
            return acc;
          }, {});

          return Object.values(trendByDay || {}).map(day => ({
            ...day,
            attendanceRate: Math.round((day.present / (day.present + day.absent)) * 100)
          }));
        } catch {
          // Return mock data if table doesn't exist
          return Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
              date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              present: Math.floor(Math.random() * 50) + 50,
              absent: Math.floor(Math.random() * 10) + 1,
              attendanceRate: Math.floor(Math.random() * 20) + 80
            };
          });
        }
      };

      // Execute all queries in parallel
      const [
        employeeCount,
        departmentData,
        pendingLeaves,
        attendanceData,
        payrollData,
        activeRecruitments,
        upcomingBirthdays,
        trainingSessions,
        activityLogs,
        attendanceTrendData
      ] = await Promise.all([
        fetchEmployeeCount(),
        fetchDepartmentData(),
        fetchPendingLeaves(),
        fetchAttendanceData(),
        fetchPayrollData(),
        fetchRecruitmentData(),
        fetchBirthdays(),
        fetchTrainingSessions(),
        fetchRecentActivity(),
        fetchAttendanceTrend()
      ]);

      setStats({
        employeeCount,
        attendanceRate: attendanceData.rate,
        pendingLeaves,
        monthlyPayroll: payrollData.monthlyDisplay,
        presentToday: attendanceData.present,
        absentToday: attendanceData.absent,
        activeRecruitments,
        upcomingBirthdays,
        trainingSessions
      });

      setDepartmentDistribution(departmentData);
      setAttendanceTrend(attendanceTrendData);
      setPayrollTrend(payrollData.trendData);
      setRecentActivity(activityLogs);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionChecked) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-lg text-indigo-800">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-indigo-100 opacity-20"
            style={{
              width: Math.random() * 200 + 100,
              height: Math.random() * 200 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 mb-1">HRMS Dashboard</h1>
            <p className="text-indigo-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50 flex items-center gap-2 border border-indigo-100"
            >
              <FiSettings className="h-5 w-5" /> Settings
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50 flex items-center gap-2 border border-indigo-100"
              onClick={handleLogout}
            >
              <FiLogOut className="h-5 w-5" /> Logout
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 flex items-center gap-2"
            >
              <TbReportAnalytics className="h-5 w-5" /> Generate Report
            </motion.button>
          </div>
        </motion.header>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatCard
            icon={<FiUsers className="text-indigo-600" size={24} />}
            value={stats.employeeCount}
            label="Total Employees"
            trend="+5% from last month"
            bgColor="bg-white/80 backdrop-blur-sm"
          />
          <StatCard
            icon={<FaRegCalendarCheck className="text-green-600" size={24} />}
            value={stats.attendanceRate}
            label="Today's Attendance"
            trend={`${stats.presentToday} present, ${stats.absentToday} absent`}
            bgColor="bg-white/80 backdrop-blur-sm"
          />
          <StatCard
            icon={<MdOutlinePendingActions className="text-yellow-600" size={24} />}
            value={stats.pendingLeaves}
            label="Pending Leaves"
            trend="3 new this week"
            bgColor="bg-white/80 backdrop-blur-sm"
          />
          <StatCard
            icon={<FiDollarSign className="text-teal-600" size={24} />}
            value={stats.monthlyPayroll}
            label="Monthly Payroll"
            trend="+2.5% from last month"
            bgColor="bg-white/80 backdrop-blur-sm"
          />
        </motion.section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Department Distribution */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 lg:col-span-1 border border-white"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-indigo-700 flex items-center gap-2">
                <FiUsers /> Department Distribution
              </h2>
              <select className="text-sm border rounded-lg px-2 py-1 bg-white focus:ring-indigo-500 focus:border-indigo-500">
                <option>This Month</option>
                <option>Last Month</option>
                <option>This Year</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {departmentDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} employees`, "Count"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Attendance Trend */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 lg:col-span-2 border border-white"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-indigo-700 flex items-center gap-2">
                <FaUserClock /> Attendance Trend (Last 7 Days)
              </h2>
              <div className="flex gap-2">
                <div className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  Present
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  Absent
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="present" name="Present" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Payroll Trend */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 lg:col-span-2 border border-white"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg text-indigo-700 flex items-center gap-2">
                <BsCashCoin /> Payroll Trend ({new Date().getFullYear()})
              </h2>
              <select className="text-sm border rounded-lg px-2 py-1 bg-white focus:ring-indigo-500 focus:border-indigo-500">
                <option>Amount (in Lakhs)</option>
                <option>Employee Count</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={payrollTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis
                  stroke="#64748b"
                  label={{
                    value: 'Amount (L)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b'
                  }}
                />
                <Tooltip
                  formatter={(value) => [`₹ ${value}L`, "Amount"]}
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    borderColor: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Payroll Amount"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#06b6d4" }}
                  activeDot={{ r: 6, fill: "#0891b2" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white"
          >
            <h2 className="font-bold text-lg text-indigo-700 mb-4 flex items-center gap-2">
              <FiTrendingUp /> Quick Stats
            </h2>
            <div className="space-y-4">
              <StatBox
                icon={<FiUsers className="text-indigo-600" />}
                label="Active Recruitments"
                value={stats.activeRecruitments}
                color="indigo"
              />
              <StatBox
                icon={<FiCalendar className="text-pink-600" />}
                label="Upcoming Birthdays"
                value={stats.upcomingBirthdays}
                color="pink"
              />
              <StatBox
                icon={<FiClock className="text-yellow-600" />}
                label="Training Sessions"
                value={stats.trainingSessions}
                color="yellow"
              />
              <StatBox
                icon={<FiAlertCircle className="text-red-600" />}
                label="Pending Approvals"
                value="3"
                color="red"
              />
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 mb-8 border border-white"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-lg text-indigo-700 flex items-center gap-2">
              <BsGraphUpArrow className="text-indigo-600" /> Recent Activity
            </h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              onClick={fetchDashboardData}
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </motion.button>
          </div>

          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-3 p-3 hover:bg-indigo-50/50 rounded-lg transition-colors"
                >
                  <div className={`mt-1 flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full ${index % 3 === 0
                    ? 'bg-indigo-100 text-indigo-600'
                    : index % 3 === 1
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                    }`}>
                    {index % 3 === 0 ? (
                      <FiUser className="h-4 w-4" />
                    ) : index % 3 === 1 ? (
                      <FiCalendar className="h-4 w-4" />
                    ) : (
                      <FiSettings className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity}
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {index % 3 === 0 ? 'Employee' : index % 3 === 1 ? 'Leave' : 'System'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiActivity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No activity yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All recent activities will appear here
                </p>
              </div>
            )}
          </div>

          {recentActivity.length > 0 && (
            <div className="mt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
              >
                View all activity <span className="ml-1">→</span>
              </motion.button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Reusable Stat Card Component
function StatCard({
  icon,
  value,
  label,
  trend,
  bgColor,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend: string;
  bgColor: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`${bgColor} rounded-xl shadow-sm p-6 flex flex-col border border-white`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-white shadow-sm">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-indigo-600 uppercase tracking-wider">{label}</h3>
        <p className="text-3xl font-bold mt-1 text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-2">{trend}</p>
      </div>
    </motion.div>
  );
}

// Reusable Stat Box Component
function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "indigo" | "pink" | "yellow" | "red" | "green" | "teal";
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-800 border-l-4 border-indigo-400",
    pink: "bg-pink-50 text-pink-800 border-l-4 border-pink-400",
    yellow: "bg-yellow-50 text-yellow-800 border-l-4 border-yellow-400",
    red: "bg-red-50 text-red-800 border-l-4 border-red-400",
    green: "bg-green-50 text-green-800 border-l-4 border-green-400",
    teal: "bg-teal-50 text-teal-800 border-l-4 border-teal-400",
  };

  return (
    <motion.div
      whileHover={{ x: 5 }}
      className={`flex items-center justify-between p-4 rounded-lg ${colorClasses[color]}`}
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-white shadow-sm">
          {icon}
        </div>
        <span className="font-medium text-sm">{label}</span>
      </div>
      <span className="text-xl font-bold">{value}</span>
    </motion.div>
  );
}