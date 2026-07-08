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
  FiLogOut,
  FiHome
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
  const [error, setError] = useState<string | null>(null);

  // ==================== SESSION CHECK ====================
  useEffect(() => {
    const checkSession = async () => {
      console.log("🔍 Checking session...");

      try {
        // Method 1: Check from useSupabase hook
        if (session) {
          console.log("✅ Session found from hook:", session);
          setIsAuthenticated(true);
          setSessionChecked(true);
          await fetchDashboardData();
          return;
        }

        // Method 2: Directly check from supabase
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Session error:", error);
          setError(error.message);
          setIsAuthenticated(false);
          setSessionChecked(true);
          router.replace("/login");
          return;
        }

        if (data?.session) {
          console.log("✅ Session found directly:", data.session);
          setIsAuthenticated(true);
          setSessionChecked(true);
          await fetchDashboardData();
        } else {
          console.log("❌ No session found, redirecting to login");
          setIsAuthenticated(false);
          setSessionChecked(true);
          router.replace("/login");
        }
      } catch (err) {
        console.error("❌ Session check error:", err);
        setError("Session check failed");
        setIsAuthenticated(false);
        setSessionChecked(true);
        router.replace("/login");
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 Auth event:", event);
        console.log("🔄 Session:", session);

        if (event === "SIGNED_IN" && session) {
          console.log("✅ User signed in");
          setIsAuthenticated(true);
          setSessionChecked(true);
          await fetchDashboardData();
        } else if (event === "SIGNED_OUT") {
          console.log("❌ User signed out");
          setIsAuthenticated(false);
          setSessionChecked(true);
          router.replace("/login");
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router, supabase, session]);

  // ==================== HANDLE LOGOUT ====================
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // ==================== FETCH DASHBOARD DATA ====================
  const fetchDashboardData = async () => {
    console.log("🚀 Fetching dashboard data...");
    try {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];
      const currentYear = new Date().getFullYear();

      // Fetch employee count
      const { count: employeeCount } = await supabase
        .from("employees")
        .select("*", { count: "exact", head: true });

      // Fetch department data
      const { data: deptData } = await supabase
        .from("employees")
        .select("department")
        .neq("department", null);

      const deptCounts = deptData?.reduce((acc: Record<string, number>, { department }) => {
        acc[department] = (acc[department] || 0) + 1;
        return acc;
      }, {});

      const departmentDistribution = Object.entries(deptCounts || {}).map(([name, value]) => ({ name, value }));

      // Fetch attendance data
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("*")
        .eq("date", today);

      const presentToday = attendanceData?.filter(a => a.status === "Present").length ?? 0;
      const absentToday = attendanceData?.filter(a => a.status === "Absent").length ?? 0;
      const attendanceRate = attendanceData?.length
        ? Math.round((presentToday / attendanceData.length) * 100)
        : 0;

      // Fetch pending leaves
      const { count: pendingLeaves } = await supabase
        .from("leave_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "Pending");

      // Fetch active recruitments
      const { count: activeRecruitments } = await supabase
        .from("requirements")
        .select("*", { count: "exact", head: true })
        .eq("status", "Active");

      // Generate mock attendance trend
      const attendanceTrend = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          present: Math.floor(Math.random() * 30) + 40,
          absent: Math.floor(Math.random() * 8) + 2,
          attendanceRate: Math.floor(Math.random() * 15) + 80
        };
      });

      // Generate mock payroll trend
      const payrollTrend = Array.from({ length: 12 }, (_, i) => ({
        name: new Date(currentYear, i, 1).toLocaleString('default', { month: 'short' }),
        amount: Math.floor(Math.random() * 8) + 5,
      }));

      // Mock recent activity
      const recentActivity = [
        "New employee John Doe joined the team",
        "Payroll processed for current month",
        "System updated to version 2.1",
        "Leave request approved for Sarah Smith",
        "New department added: Data Science"
      ];

      // Update stats
      setStats({
        employeeCount: employeeCount || 0,
        attendanceRate: `${attendanceRate}%`,
        pendingLeaves: pendingLeaves || 0,
        monthlyPayroll: `₹ ${(Math.random() * 5 + 10).toFixed(1)}L`,
        presentToday,
        absentToday,
        activeRecruitments: activeRecruitments || 0,
        upcomingBirthdays: Math.floor(Math.random() * 10) + 2,
        trainingSessions: Math.floor(Math.random() * 8) + 3
      });

      setDepartmentDistribution(departmentDistribution);
      setAttendanceTrend(attendanceTrend);
      setPayrollTrend(payrollTrend);
      setRecentActivity(recentActivity);

      console.log("✅ Dashboard data loaded successfully");

    } catch (error: any) {
      console.error("❌ Error fetching dashboard data:", error);
      setError(error.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (!sessionChecked) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-lg text-indigo-800 font-medium">Checking session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Session Expired</h2>
          <p className="text-gray-600 mb-4">Please login again to continue</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <FiAlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 mx-auto"
          >
            <FiRefreshCw /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-lg text-indigo-800 font-medium">Loading Dashboard...</p>
          <p className="text-sm text-gray-500">Fetching your data</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER DASHBOARD ====================
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      {/* Animated Background */}
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
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50 flex items-center gap-2 border border-indigo-100"
              onClick={() => router.push('/')}
            >
              <FiHome className="h-5 w-5" /> Home
            </motion.button>
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
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg shadow-sm hover:bg-red-100 flex items-center gap-2 border border-red-200"
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
        </motion.div>
      </div>
    </div>
  );
}

// ==================== REUSABLE COMPONENTS ====================
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