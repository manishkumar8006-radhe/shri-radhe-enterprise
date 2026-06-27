// app/bill/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSupabase } from '@/lib/supabase-provider';
import { format } from 'date-fns';
import { FiDownload } from "react-icons/fi";

interface PayrollRow {
    earn_basic: number;
    earn_hra: number;
    earn_conveyance: number;
    earn_gross: number;
    ot_amount: number;
    total_ded: number;
    net_payable: number;
    total_amount: number;
    days: number;
    month: string;
}

const round = (num: number) => Math.round(num);

export default function InvoicePage() {
    const { supabase } = useSupabase();
    const [data, setData] = useState<PayrollRow[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [loading, setLoading] = useState(false);

    const fetchPayroll = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('payroll_sheet')
            .select('*')
            .eq('month', selectedMonth);
        if (data) setData(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchPayroll();
    }, [selectedMonth]);

    const totalBasic = round(data.reduce((sum, d) => sum + d.earn_basic, 0));
    const totalHRA = round(data.reduce((sum, d) => sum + d.earn_hra, 0));
    const totalCON = round(data.reduce((sum, d) => sum + d.earn_conveyance, 0));
    const performanceAmount = round(data.reduce((sum, d) => sum + d.ot_amount, 0));
    const totalGross = round(data.reduce((sum, d) => sum + d.earn_gross, 0));

    const ESI = round(totalGross * 0.0325);
    const PF = round(totalGross * 0.13);
    const LWF = round(totalGross * 0.004);
    const serviceCharge = round(totalGross * 0.05);
    const total = totalGross + ESI + PF + LWF + serviceCharge;
    const sgst = round(total * 0.09);
    const cgst = round(total * 0.09);
    const finalTotal = total + sgst + cgst;

    const downloadCSV = () => {
        const headers = [
            "PARTICULARS", "RATE", "DAYS", "AMOUNT"
        ];
        const rows = [
            ["BASIC", "", "", totalBasic],
            ["HRA", "", "", totalHRA],
            ["CON.", "", "", totalCON],
            ["PERFORMANCE", "", "", performanceAmount],
            ["ESI CHARGES", "3.25%", "", ESI],
            ["PF CHARGES", "13%", "", PF],
            ["LWF CHARGES", "0.40%", "", LWF],
            ["SERVICE CHARGE", "5%", "", serviceCharge],
            ["TOTAL", "", "", total],
            ["SGST", "9%", "", sgst],
            ["CGST", "9%", "", cgst],
            ["FINAL TOTAL", "", "", finalTotal]
        ];
        const csv = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Invoice_${selectedMonth}.csv`;
        link.click();
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Tax Invoice - Shri Radhe Enterprises</h1>
            <div className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center mb-4">
                    <input
                        type="month"
                        className="border px-3 py-2 rounded"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                    />
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                        <FiDownload /> Export CSV
                    </button>
                </div>

                <div className="space-y-2">
                    <p><strong>BASIC:</strong> ₹{totalBasic}</p>
                    <p><strong>HRA:</strong> ₹{totalHRA}</p>
                    <p><strong>CONVEYANCE:</strong> ₹{totalCON}</p>
                    <p><strong>PERFORMANCE:</strong> ₹{performanceAmount}</p>
                    <p><strong>GROSS WAGES:</strong> ₹{totalGross}</p>
                    <p><strong>ESI (3.25%):</strong> ₹{ESI}</p>
                    <p><strong>PF (13%):</strong> ₹{PF}</p>
                    <p><strong>LWF (0.40%):</strong> ₹{LWF}</p>
                    <p><strong>SERVICE CHARGE (5%):</strong> ₹{serviceCharge}</p>
                    <p><strong>Total:</strong> ₹{total}</p>
                    <p><strong>SGST (9%):</strong> ₹{sgst}</p>
                    <p><strong>CGST (9%):</strong> ₹{cgst}</p>
                    <p className="text-xl font-bold">Final Invoice Total: ₹{finalTotal}</p>
                </div>
            </div>
        </div>
    );
}
