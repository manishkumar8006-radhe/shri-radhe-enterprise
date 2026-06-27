"use client";

import React, { useEffect, useState } from "react";
import { useSupabase } from '@/lib/supabase-provider';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FiDownload, FiPrinter, FiSearch, FiFileText, FiDollarSign } from "react-icons/fi";
import { format } from "date-fns";

interface PayrollRow {
    id_code: string;
    name: string;
    department: string;
    designation: string;
    days: number;
    earn_basic: number;
    earn_hra: number;
    earn_conveyance: number;
    earn_gross: number;
    ot_amount: number;
    total_ded: number;
    lunch_amount: number;
    total_amount: number;
    advance: number;
    net_payable: number;
    joining_date?: string;
    bank_account?: string;
    ifsc_code?: string;
}

// Safe fixed function – NaN/undefined को 0 में बदलता है
const fixed = (val: any, digits = 0) => {
    const num = typeof val === 'number' && !isNaN(val) ? val : 0;
    return num.toFixed(digits);
};

export default function SalarySlipPage() {
    const [data, setData] = useState<PayrollRow[]>([]);
    const { supabase } = useSupabase();
    const [search, setSearch] = useState("");
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [companyDetails, setCompanyDetails] = useState({
        name: "Your Company Name",
        address: "123 Business Park, City - 100001",
        logo: "",
        signature: ""
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // ✅ View का उपयोग करें – यह employee details भी लाता है
            const { data: sheet, error } = await supabase
                .from("salary_slip_view")
                .select("*")
                .eq("month", selectedMonth);

            if (error) throw error;
            if (sheet) setData(sheet as PayrollRow[]);
        } catch (error) {
            console.error("Error fetching payroll data:", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ CSV Export – सभी fields के लिए safe handling
    const downloadAllSlipsCSV = () => {
        const headers = [
            "Employee ID", "Name", "Department", "Designation", "Days Worked",
            "Basic Salary", "HRA", "Conveyance", "Gross Earnings", "Overtime Amount",
            "Total Deductions", "Lunch Allowance", "Total Amount", "Advance", "Net Payable",
            "Bank Account", "IFSC Code"
        ];

        const rows = data.map(row => [
            `"${row.id_code || ''}"`,
            `"${row.name || ''}"`,
            `"${row.department || ''}"`,
            `"${row.designation || ''}"`,
            row.days || 0,
            fixed(row.earn_basic),
            fixed(row.earn_hra),
            fixed(row.earn_conveyance),
            fixed(row.earn_gross),
            fixed(row.ot_amount),
            fixed(row.total_ded),
            fixed(row.lunch_amount),
            fixed(row.total_amount),
            fixed(row.advance),
            fixed(row.net_payable),
            row.bank_account ? `"${row.bank_account}"` : 'N/A',
            row.ifsc_code ? `"${row.ifsc_code}"` : 'N/A'
        ]);

        const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Salary_Slips_${selectedMonth}.csv`;
        link.click();
    };

    const generateIndividualPDF = (row: PayrollRow) => {
        const doc = new jsPDF();

        // Company Header
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(companyDetails.name, 105, 15, { align: "center" });

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(companyDetails.address, 105, 20, { align: "center" });

        doc.setFontSize(14);
        doc.text("PAYSLIP", 105, 30, { align: "center" });

        // Month and Employee Details
        doc.setFontSize(10);
        doc.text(`Month: ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}`, 14, 40);
        doc.text(`Employee ID: ${row.id_code || ''}`, 14, 45);
        doc.text(`Name: ${row.name || ''}`, 14, 50);
        doc.text(`Department: ${row.department || ''}`, 14, 55);
        doc.text(`Designation: ${row.designation || ''}`, 14, 60);

        // Earnings Table
        autoTable(doc, {
            startY: 70,
            head: [['Earnings', 'Amount (₹)']],
            body: [
                ['Basic Salary', fixed(row.earn_basic)],
                ['HRA', fixed(row.earn_hra)],
                ['Conveyance', fixed(row.earn_conveyance)],
                ['Overtime', fixed(row.ot_amount)],
                ['Lunch Allowance', fixed(row.lunch_amount)],
                ['Total Earnings', fixed((row.earn_gross || 0) + (row.ot_amount || 0) + (row.lunch_amount || 0))]
            ],
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185] }
        });

        // Deductions Table
        const totalDed = row.total_ded || 0;
        autoTable(doc, {
            startY: 120,
            head: [['Deductions', 'Amount (₹)']],
            body: [
                ['Taxes', '0.00'],
                ['PF', fixed(totalDed * 0.6)],
                ['ESI', fixed(totalDed * 0.3)],
                ['Advance', fixed(row.advance)],
                ['Total Deductions', fixed(totalDed + (row.advance || 0))]
            ],
            theme: 'grid',
            headStyles: { fillColor: [231, 76, 60] }
        });

        // Summary
        autoTable(doc, {
            startY: 170,
            body: [
                ['Days Worked', row.days || 0],
                ['Net Payable', fixed(row.net_payable)],
                ['Bank Account', row.bank_account || 'N/A'],
                ['IFSC Code', row.ifsc_code || 'N/A']
            ],
            theme: 'grid',
            headStyles: { fillColor: [39, 174, 96] }
        });

        // Footer
        doc.setFontSize(8);
        doc.text("This is computer generated payslip and does not require signature", 105, 210, { align: "center" });
        doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy hh:mm a')}`, 105, 215, { align: "center" });

        doc.save(`${row.name || 'Employee'}_Payslip_${selectedMonth}.pdf`);
    };

    const generateBulkPDF = () => {
        const doc = new jsPDF();
        let yPos = 15;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(companyDetails.name, 105, yPos, { align: "center" });
        yPos += 5;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(companyDetails.address, 105, yPos, { align: "center" });
        yPos += 5;

        doc.setFontSize(14);
        doc.text(`Salary Slips - ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}`, 105, yPos, { align: "center" });
        yPos += 15;

        autoTable(doc, {
            startY: yPos,
            head: [[
                "ID", "Name", "Dept", "Desig", "Days", "Basic", "HRA", "Conv", "Gross",
                "OT", "Ded", "Net Pay", "Bank", "IFSC"
            ]],
            body: data.map(row => [
                row.id_code || '',
                row.name || '',
                row.department || '',
                row.designation || '',
                row.days || 0,
                fixed(row.earn_basic),
                fixed(row.earn_hra),
                fixed(row.earn_conveyance),
                fixed(row.earn_gross),
                fixed(row.ot_amount),
                fixed(row.total_ded),
                fixed(row.net_payable),
                row.bank_account?.slice(-4) || 'N/A',
                row.ifsc_code?.slice(0, 4) + '...' || 'N/A'
            ]),
            styles: { fontSize: 7 },
            headStyles: { fillColor: [52, 73, 94] }
        });

        doc.save(`Salary_Summary_${selectedMonth}.pdf`);
    };

    // ✅ सही Filtering – जब सर्च न हो तो पूरा data दिखाएँ
    const filtered = search
        ? data.filter(d =>
            (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.id_code || '').toLowerCase().includes(search.toLowerCase()) ||
            (d.department || '').toLowerCase().includes(search.toLowerCase())
        )
        : data;

    // ✅ Totals – सुरक्षित गणना
    const totalDays = data.reduce((sum, row) => sum + (row.days || 0), 0);
    const totalGross = data.reduce((sum, row) => sum + (row.earn_gross || 0), 0);
    const totalDed = data.reduce((sum, row) => sum + (row.total_ded || 0), 0);
    const totalNetPay = data.reduce((sum, row) => sum + (row.net_payable || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Salary Slips Management</h1>
                        <p className="text-gray-600">Generate and manage employee salary slips</p>
                    </div>

                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <input
                            type="month"
                            className="border rounded px-3 py-2"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                        <button
                            onClick={fetchData}
                            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? "Loading..." : (
                                <>
                                    <FiSearch /> Refresh
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button
                        onClick={generateBulkPDF}
                        className="bg-indigo-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <FiFileText size={18} />
                        <span>Generate Summary Report</span>
                    </button>

                    <button
                        onClick={() => data.forEach(generateIndividualPDF)}
                        className="bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors"
                    >
                        <FiPrinter size={18} />
                        <span>Generate All Payslips</span>
                    </button>

                    <button
                        onClick={downloadAllSlipsCSV}
                        className="bg-green-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                    >
                        <FiDownload size={18} />
                        <span>Export Salary Data</span>
                    </button>

                    <button
                        onClick={() => alert("Bank transfer file generation would be implemented here")}
                        className="bg-teal-600 text-white px-4 py-3 rounded-lg flex items-center gap-2 hover:bg-teal-700 transition-colors"
                    >
                        <FiDollarSign size={18} />
                        <span>Generate Bank Transfer File</span>
                    </button>
                </div>

                <div className="mb-6">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search employee by name, ID or department"
                            className="border px-4 py-3 w-full rounded-lg pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <FiSearch className="absolute left-3 top-3.5 text-gray-400" />
                    </div>

                    {filtered.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-medium text-gray-700 mb-2">
                                Search Results ({filtered.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {filtered.map((row, index) => (
                                    <div key={row.id_code || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-800">{row.name || 'Unknown'}</h4>
                                                <p className="text-sm text-gray-600">{row.department || ''} • {row.designation || ''}</p>
                                            </div>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                {row.id_code || 'N/A'}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-sm">Days: {row.days || 0}</p>
                                                <p className="font-bold text-green-700">₹{fixed(row.net_payable)}</p>
                                            </div>
                                            <button
                                                onClick={() => generateIndividualPDF(row)}
                                                className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 transition-colors"
                                            >
                                                Generate Slip
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {data.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                            <thead className="bg-gray-800 text-white">
                                <tr>
                                    <th className="px-4 py-3 text-left">ID</th>
                                    <th className="px-4 py-3 text-left">Name</th>
                                    <th className="px-4 py-3 text-left">Department</th>
                                    <th className="px-4 py-3 text-left">Designation</th>
                                    <th className="px-4 py-3 text-right">Days</th>
                                    <th className="px-4 py-3 text-right">Gross</th>
                                    <th className="px-4 py-3 text-right">Deductions</th>
                                    <th className="px-4 py-3 text-right">Net Pay</th>
                                    <th className="px-4 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {data.map((row, index) => (
                                    <tr key={row.id_code || index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">{row.id_code || 'N/A'}</td>
                                        <td className="px-4 py-3 font-medium">{row.name || 'Unknown'}</td>
                                        <td className="px-4 py-3">{row.department || ''}</td>
                                        <td className="px-4 py-3">{row.designation || ''}</td>
                                        <td className="px-4 py-3 text-right">{row.days || 0}</td>
                                        <td className="px-4 py-3 text-right">₹{fixed(row.earn_gross)}</td>
                                        <td className="px-4 py-3 text-right">₹{fixed(row.total_ded)}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-700">₹{fixed(row.net_payable)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => generateIndividualPDF(row)}
                                                className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
                                            >
                                                Generate
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-100 font-bold">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right">Totals:</td>
                                    <td className="px-4 py-3 text-right">{totalDays}</td>
                                    <td className="px-4 py-3 text-right">₹{fixed(totalGross)}</td>
                                    <td className="px-4 py-3 text-right">₹{fixed(totalDed)}</td>
                                    <td className="px-4 py-3 text-right text-green-700">₹{fixed(totalNetPay)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}