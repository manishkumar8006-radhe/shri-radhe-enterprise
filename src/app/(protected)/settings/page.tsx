"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from '@/lib/supabase-provider';
import { motion } from "framer-motion";
import {
    FiUser,
    FiMail,
    FiLock,
    FiBell,
    FiMoon,
    FiSun,
    FiShield,
    FiAlertCircle,
    FiCheckCircle,
    FiRefreshCw,
    FiSave,
    FiHome,
    FiLogOut,
    FiSettings,
    FiUsers,
    FiDollarSign,
    FiCalendar,
    FiClock,
    FiShare2,
    FiDatabase,
    FiActivity,
    FiArrowLeft,
    FiEye,
    FiEyeOff,
    FiEdit2,
    FiGlobe,
    FiBriefcase,
    FiMapPin,
    FiPhone,
    FiUserCheck,
    FiUserX,
    FiArrowRight,
    FiMessageSquare,
    FiSmartphone, // ✅ Added this import
    FiInfo,
    FiHelpCircle,
    FiClipboard,
    FiPrinter,
    FiExternalLink,
    FiCheck,
    FiChevronDown,
    FiChevronUp,
    FiGrid,
    FiList,
    FiLayout,
    FiMonitor,
    FiTablet,
    FiTool,
    FiServer,
    FiCpu,
    FiHardDrive,
    FiCloud,
    FiFolder,
    FiFileText,
    FiDownload,
    FiUpload,
    FiTrash2,
    FiPlus,
    FiMinus,
    FiTrendingUp,
    FiTrendingDown,
    FiBarChart2,
    FiPieChart,
    FiX,
    FiMenu
} from "react-icons/fi";
import { toast } from "react-toastify";

// ==================== TYPES ====================
interface ProfileData {
    employee_id: string;
    employee_name: string;
    father_name: string;
    date_of_birth: string;
    email: string;
    phone: string;
    address: string;
    department: string;
    designation: string;
    joining_date: string;
    bank_name: string;
    bank_account_number: string;
    ifsc_code: string;
    emergency_contact_name: string;
    emergency_contact_phone: string;
    emergency_contact_relationship: string;
    hra: string;
    conveyance: string;
    basic_salary: string;
    esi_number: string;
    uan_number: string;
    epf_number: string;
    aadhaar_number: string;
    pan_number: string;
}

interface SettingsData {
    id: string;
    company_name: string;
    policies: string;
    security_settings: {
        two_factor_auth: boolean;
        session_timeout: number;
        login_attempts: number;
        password_expiry_days: number;
    };
    notification_settings: {
        email_leave_requests: boolean;
        email_attendance: boolean;
        email_payroll: boolean;
        email_new_employee: boolean;
        email_security: boolean;
        email_announcements: boolean;
        push_leave_requests: boolean;
        push_attendance: boolean;
        push_payroll: boolean;
        push_new_employee: boolean;
        push_security: boolean;
        push_announcements: boolean;
        sms_leave_requests: boolean;
        sms_attendance: boolean;
        sms_security: boolean;
    };
    created_at: string;
    updated_at: string;
}

// ==================== TOGGLE SWITCH ====================
const ToggleSwitch = ({
    label,
    checked,
    onChange,
    description
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
    description?: string;
}) => {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div>
                <span className="text-sm font-medium text-gray-700">{label}</span>
                {description && (
                    <p className="text-xs text-gray-400">{description}</p>
                )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
        </div>
    );
};

// ==================== MAIN COMPONENT ====================
export default function SettingsPage() {
    const router = useRouter();
    const { supabase, session } = useSupabase();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [sessionChecked, setSessionChecked] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // ==================== PROFILE STATE ====================
    const [profile, setProfile] = useState<ProfileData>({
        employee_id: '',
        employee_name: '',
        father_name: '',
        date_of_birth: '',
        email: '',
        phone: '',
        address: '',
        department: '',
        designation: '',
        joining_date: '',
        bank_name: '',
        bank_account_number: '',
        ifsc_code: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relationship: '',
        hra: '',
        conveyance: '',
        basic_salary: '',
        esi_number: '',
        uan_number: '',
        epf_number: '',
        aadhaar_number: '',
        pan_number: ''
    });

    // ==================== SETTINGS STATE ====================
    const [settings, setSettings] = useState<SettingsData>({
        id: '',
        company_name: '',
        policies: '',
        security_settings: {
            two_factor_auth: false,
            session_timeout: 60,
            login_attempts: 5,
            password_expiry_days: 90
        },
        notification_settings: {
            email_leave_requests: true,
            email_attendance: true,
            email_payroll: true,
            email_new_employee: true,
            email_security: true,
            email_announcements: true,
            push_leave_requests: true,
            push_attendance: true,
            push_payroll: true,
            push_new_employee: true,
            push_security: true,
            push_announcements: true,
            sms_leave_requests: false,
            sms_attendance: false,
            sms_security: true
        },
        created_at: '',
        updated_at: ''
    });

    // ==================== PASSWORD STATE ====================
    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // ==================== SESSION CHECK ====================
    useEffect(() => {
        const checkSession = async () => {
            try {
                if (session) {
                    setIsAuthenticated(true);
                    setSessionChecked(true);
                    await fetchData();
                    return;
                }

                const { data, error } = await supabase.auth.getSession();

                if (error || !data?.session) {
                    setIsAuthenticated(false);
                    setSessionChecked(true);
                    router.replace("/login");
                    return;
                }

                setIsAuthenticated(true);
                setSessionChecked(true);
                await fetchData();
            } catch (err) {
                setIsAuthenticated(false);
                setSessionChecked(true);
                router.replace("/login");
            }
        };

        checkSession();
    }, [router, supabase, session]);

    // ==================== FETCH DATA ====================
    const fetchData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Employee Profile
            const { data: profileData, error: profileError } = await supabase
                .from('employees')
                .select('*')
                .eq('employee_id', session?.user?.id)
                .single();

            if (!profileError && profileData) {
                setProfile(profileData);
            }

            // 2. Fetch Settings
            const { data: settingsData, error: settingsError } = await supabase
                .from('settings')
                .select('*')
                .limit(1)
                .single();

            if (!settingsError && settingsData) {
                let parsedSettings = { ...settingsData };
                try {
                    if (typeof settingsData.security_settings === 'string') {
                        parsedSettings.security_settings = JSON.parse(settingsData.security_settings);
                    }
                    if (typeof settingsData.notification_settings === 'string') {
                        parsedSettings.notification_settings = JSON.parse(settingsData.notification_settings);
                    }
                } catch (e) {
                    console.log('Settings already parsed or invalid JSON');
                }
                setSettings(parsedSettings);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    // ==================== SAVE PROFILE ====================
    const saveProfile = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('employees')
                .update({
                    employee_name: profile.employee_name,
                    phone: profile.phone,
                    address: profile.address,
                    bank_name: profile.bank_name,
                    bank_account_number: profile.bank_account_number,
                    ifsc_code: profile.ifsc_code,
                    emergency_contact_name: profile.emergency_contact_name,
                    emergency_contact_phone: profile.emergency_contact_phone,
                    emergency_contact_relationship: profile.emergency_contact_relationship,
                    updated_at: new Date().toISOString()
                })
                .eq('employee_id', session?.user?.id);

            if (error) throw error;

            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(`Failed to update profile: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ==================== SAVE SETTINGS ====================
    const saveSettings = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    id: settings.id || undefined,
                    company_name: settings.company_name,
                    policies: settings.policies,
                    security_settings: settings.security_settings,
                    notification_settings: settings.notification_settings,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Settings saved successfully!');
        } catch (error: any) {
            toast.error(`Failed to save settings: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ==================== CHANGE PASSWORD ====================
    const changePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            toast.error('New password and confirm password do not match');
            return;
        }

        if (passwordData.new_password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.new_password
            });

            if (error) throw error;

            toast.success('Password changed successfully!');
            setPasswordData({
                current_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error: any) {
            toast.error(`Failed to change password: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    // ==================== HANDLE LOGOUT ====================
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push("/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    // ==================== TABS ====================
    const tabs = [
        { id: 'profile', label: 'Profile', icon: FiUser },
        { id: 'settings', label: 'Settings', icon: FiSettings },
        { id: 'notifications', label: 'Notifications', icon: FiBell },
        { id: 'security', label: 'Security', icon: FiShield },
        { id: 'password', label: 'Change Password', icon: FiLock }
    ];

    // ==================== RENDER ====================
    if (!sessionChecked || !isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-indigo-800 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-indigo-800 font-medium">Loading Settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
                >
                    <div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => router.push('/protected/dashboard')}
                                className="p-2 hover:bg-indigo-100 rounded-lg transition-colors"
                            >
                                <FiArrowLeft className="h-5 w-5 text-indigo-600" />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-2">
                                    <FiSettings className="text-indigo-600" /> Settings
                                </h1>
                                <p className="text-indigo-600">Manage your account and application preferences</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-2 border border-red-200"
                        >
                            <FiLogOut className="h-5 w-5" /> Logout
                        </button>
                    </div>
                </motion.div>

                {/* Tabs */}
                <div className="flex overflow-x-auto gap-2 mb-8 pb-2 scrollbar-hide">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'bg-white text-gray-600 hover:bg-indigo-50'
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content - Same as before */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-6 border border-white"
                >
                    {/* Profile Tab Content */}
                    {activeTab === 'profile' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <FiUser className="text-indigo-600" /> Profile Settings
                                </h2>
                                <span className="text-xs text-gray-400">Employee ID: {profile.employee_id}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.employee_name}
                                        onChange={(e) => setProfile({ ...profile, employee_name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Father's Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.father_name}
                                        onChange={(e) => setProfile({ ...profile, father_name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        disabled
                                        className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Department
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.department}
                                        disabled
                                        className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Designation
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.designation}
                                        disabled
                                        className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        value={profile.date_of_birth}
                                        disabled
                                        className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Joining Date
                                    </label>
                                    <input
                                        type="date"
                                        value={profile.joining_date}
                                        disabled
                                        className="w-full border border-gray-300 rounded-lg p-2 bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <textarea
                                        value={profile.address}
                                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                {/* Bank Details */}
                                <div className="md:col-span-2 mt-4">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <FiDollarSign className="text-indigo-600" /> Bank Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bank Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.bank_name}
                                                onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Account Number
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.bank_account_number}
                                                onChange={(e) => setProfile({ ...profile, bank_account_number: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                IFSC Code
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.ifsc_code}
                                                onChange={(e) => setProfile({ ...profile, ifsc_code: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Emergency Contact */}
                                <div className="md:col-span-2 mt-4">
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <FiAlertCircle className="text-red-600" /> Emergency Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contact Name
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.emergency_contact_name}
                                                onChange={(e) => setProfile({ ...profile, emergency_contact_name: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Contact Phone
                                            </label>
                                            <input
                                                type="tel"
                                                value={profile.emergency_contact_phone}
                                                onChange={(e) => setProfile({ ...profile, emergency_contact_phone: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Relationship
                                            </label>
                                            <input
                                                type="text"
                                                value={profile.emergency_contact_relationship}
                                                onChange={(e) => setProfile({ ...profile, emergency_contact_relationship: e.target.value })}
                                                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={() => fetchData()}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <FiRefreshCw className="h-4 w-4" /> Reset
                                </button>
                                <button
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                                    Save Profile
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab Content */}
                    {activeTab === 'settings' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FiSettings className="text-indigo-600" /> Company & System Settings
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Company Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.company_name || ''}
                                        onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Policies & Procedures
                                    </label>
                                    <textarea
                                        value={settings.policies || ''}
                                        onChange={(e) => setSettings({ ...settings, policies: e.target.value })}
                                        rows={4}
                                        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Session Timeout
                                        </label>
                                        <select
                                            value={settings.security_settings?.session_timeout || 60}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security_settings: {
                                                    ...settings.security_settings,
                                                    session_timeout: parseInt(e.target.value)
                                                }
                                            })}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="120">2 hours</option>
                                            <option value="240">4 hours</option>
                                            <option value="480">8 hours</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Login Attempts
                                        </label>
                                        <select
                                            value={settings.security_settings?.login_attempts || 5}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security_settings: {
                                                    ...settings.security_settings,
                                                    login_attempts: parseInt(e.target.value)
                                                }
                                            })}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="3">3 attempts</option>
                                            <option value="5">5 attempts</option>
                                            <option value="10">10 attempts</option>
                                            <option value="999">Unlimited</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                                        <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.security_settings?.two_factor_auth || false}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security_settings: {
                                                    ...settings.security_settings,
                                                    two_factor_auth: e.target.checked
                                                }
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => fetchData()}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                                    >
                                        <FiRefreshCw className="h-4 w-4" /> Reset
                                    </button>
                                    <button
                                        onClick={saveSettings}
                                        disabled={saving}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                                        Save Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab Content */}
                    {activeTab === 'notifications' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FiBell className="text-indigo-600" /> Notification Preferences
                            </h2>
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <FiMail className="text-indigo-600" /> Email Notifications
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <ToggleSwitch
                                            label="Leave Requests"
                                            checked={settings.notification_settings?.email_leave_requests || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    email_leave_requests: !settings.notification_settings?.email_leave_requests
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Attendance Updates"
                                            checked={settings.notification_settings?.email_attendance || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    email_attendance: !settings.notification_settings?.email_attendance
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Payroll Generated"
                                            checked={settings.notification_settings?.email_payroll || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    email_payroll: !settings.notification_settings?.email_payroll
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="New Employee Join"
                                            checked={settings.notification_settings?.email_new_employee || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    email_new_employee: !settings.notification_settings?.email_new_employee
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Security Alerts"
                                            checked={settings.notification_settings?.email_security || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    email_security: !settings.notification_settings?.email_security
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Announcements"
                                            checked={settings.notification_settings?.email_announcements || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    email_announcements: !settings.notification_settings?.email_announcements
                                                }
                                            })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <FiSmartphone className="text-indigo-600" /> Push Notifications
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <ToggleSwitch
                                            label="Leave Requests"
                                            checked={settings.notification_settings?.push_leave_requests || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    push_leave_requests: !settings.notification_settings?.push_leave_requests
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Attendance Updates"
                                            checked={settings.notification_settings?.push_attendance || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    push_attendance: !settings.notification_settings?.push_attendance
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Payroll Generated"
                                            checked={settings.notification_settings?.push_payroll || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    push_payroll: !settings.notification_settings?.push_payroll
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="New Employee Join"
                                            checked={settings.notification_settings?.push_new_employee || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    push_new_employee: !settings.notification_settings?.push_new_employee
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Security Alerts"
                                            checked={settings.notification_settings?.push_security || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    push_security: !settings.notification_settings?.push_security
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Announcements"
                                            checked={settings.notification_settings?.push_announcements || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    push_announcements: !settings.notification_settings?.push_announcements
                                                }
                                            })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <FiMessageSquare className="text-indigo-600" /> SMS Notifications
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <ToggleSwitch
                                            label="Leave Requests"
                                            checked={settings.notification_settings?.sms_leave_requests || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    sms_leave_requests: !settings.notification_settings?.sms_leave_requests
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Attendance Updates"
                                            checked={settings.notification_settings?.sms_attendance || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    sms_attendance: !settings.notification_settings?.sms_attendance
                                                }
                                            })}
                                        />
                                        <ToggleSwitch
                                            label="Security Alerts"
                                            checked={settings.notification_settings?.sms_security || false}
                                            onChange={() => setSettings({
                                                ...settings,
                                                notification_settings: {
                                                    ...settings.notification_settings,
                                                    sms_security: !settings.notification_settings?.sms_security
                                                }
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => fetchData()}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                                    >
                                        <FiRefreshCw className="h-4 w-4" /> Reset
                                    </button>
                                    <button
                                        onClick={saveSettings}
                                        disabled={saving}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                                        Save Preferences
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab Content */}
                    {activeTab === 'security' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FiShield className="text-indigo-600" /> Security Settings
                            </h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Session Timeout
                                        </label>
                                        <select
                                            value={settings.security_settings?.session_timeout || 60}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security_settings: {
                                                    ...settings.security_settings,
                                                    session_timeout: parseInt(e.target.value)
                                                }
                                            })}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="15">15 minutes</option>
                                            <option value="30">30 minutes</option>
                                            <option value="60">1 hour</option>
                                            <option value="120">2 hours</option>
                                            <option value="240">4 hours</option>
                                            <option value="480">8 hours</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max Login Attempts
                                        </label>
                                        <select
                                            value={settings.security_settings?.login_attempts || 5}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security_settings: {
                                                    ...settings.security_settings,
                                                    login_attempts: parseInt(e.target.value)
                                                }
                                            })}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="3">3 attempts</option>
                                            <option value="5">5 attempts</option>
                                            <option value="10">10 attempts</option>
                                            <option value="999">Unlimited</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Password Expiry (days)
                                        </label>
                                        <select
                                            value={settings.security_settings?.password_expiry_days || 90}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security_settings: {
                                                    ...settings.security_settings,
                                                    password_expiry_days: parseInt(e.target.value)
                                                }
                                            })}
                                            className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="30">30 days</option>
                                            <option value="60">60 days</option>
                                            <option value="90">90 days</option>
                                            <option value="180">180 days</option>
                                            <option value="365">365 days</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-medium text-gray-800">Two-Factor Authentication</h3>
                                        <p className="text-sm text-gray-500">Secure your account with 2FA</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.security_settings?.two_factor_auth || false}
                                            onChange={(e) => setSettings({
                                                ...settings,
                                                security_settings: {
                                                    ...settings.security_settings,
                                                    two_factor_auth: e.target.checked
                                                }
                                            })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex items-start gap-3">
                                        <FiCheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium text-green-800">Security Status</h4>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div className="flex items-center gap-2">
                                                    <FiCheck className="h-4 w-4 text-green-600" />
                                                    <span className="text-sm text-green-700">Email verified</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {settings.security_settings?.two_factor_auth ? (
                                                        <FiCheck className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <FiAlertCircle className="h-4 w-4 text-yellow-500" />
                                                    )}
                                                    <span className="text-sm text-gray-700">
                                                        {settings.security_settings?.two_factor_auth ? '2FA enabled' : '2FA disabled'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => fetchData()}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                                    >
                                        <FiRefreshCw className="h-4 w-4" /> Reset
                                    </button>
                                    <button
                                        onClick={saveSettings}
                                        disabled={saving}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}
                                        Save Security Settings
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Change Password Tab Content */}
                    {activeTab === 'password' && (
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <FiLock className="text-indigo-600" /> Change Password
                            </h2>
                            <form onSubmit={changePassword} className="max-w-md space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Current Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showCurrentPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={passwordData.new_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Minimum 6 characters</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={passwordData.confirm_password}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                            className="w-full border border-gray-300 rounded-lg p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPasswordData({
                                            current_password: '',
                                            new_password: '',
                                            confirm_password: ''
                                        })}
                                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                    >
                                        Clear
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <FiRefreshCw className="animate-spin" /> : <FiLock />}
                                        Change Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center text-sm text-gray-400">
                    <p>Last updated: {new Date().toLocaleString()}</p>
                    <p className="mt-1">© 2024 HRMS. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}