// src/app/performance/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useSupabase } from '@/lib/supabase-provider';


interface PerformanceData {
  id: string;
  employee_id: string;
  employee_name: string;
  month: string;
  tasks_completed: number;
  target_achieved_percent: number;
  rating: number;
  behavior: string;
  status: string;
  feedback: string;
}

export default function Performance() {
  const [data, setData] = useState<PerformanceData[]>([]);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const { supabase } = useSupabase(); // already working


  const fetchPerformance = async () => {
    try {
      const { data: perfData, error: perfError } = await supabase
        .from("performance")
        .select("*, employees(employee_name)")
        .order("created_at", { ascending: false });

      if (perfError) throw perfError;
      if (!perfData) throw new Error("No performance data found");

      const enriched = await Promise.all(
        perfData.map(async (item: any) => {
          let attendanceRating = 0;

          const { data: attData, error: attError } = await supabase
            .from("attendance_summary_table")
            .select("total_present, total_days")
            .eq("employee_id", item.employee_id)
            .eq("month", item.month);

          if (attData && attData.length > 0 && attData[0].total_days > 0) {
            const { total_present, total_days } = attData[0];
            const percent = (total_present / total_days) * 100;
            if (percent >= 90) attendanceRating = 5;
            else if (percent >= 80) attendanceRating = 4;
            else if (percent >= 70) attendanceRating = 3;
            else if (percent >= 60) attendanceRating = 2;
            else attendanceRating = 1;
          }

          return {
            ...item,
            employee_name: item.employees?.employee_name ?? "Unknown",
            rating: attendanceRating,
          };
        })
      );

      setData(enriched);
      setFetchError(null);
    } catch (err: any) {
      setFetchError(JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Performance Overview</h1>

      {fetchError && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          ⚠️ Error loading performance data:
          <pre className="whitespace-pre-wrap">{fetchError}</pre>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <SummaryCard title="Monthly Reviews" count={data.length} color="blue" />
        <SummaryCard title="Top Performers" count={data.filter((d) => d.rating >= 4).length} color="green" />
        <SummaryCard title="Improvement Needed" count={data.filter((d) => d.rating <= 2).length} color="red" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Performance Table</h2>
        <table className="w-full text-sm">
          <thead className="bg-indigo-50 text-indigo-800">
            <tr>
              <th className="py-2 px-4 text-left">Employee</th>
              <th className="py-2 px-4 text-left">Month</th>
              <th className="py-2 px-4 text-left">Tasks</th>
              <th className="py-2 px-4 text-left">Target %</th>
              <th className="py-2 px-4 text-left">Rating</th>
              <th className="py-2 px-4 text-left">Behavior</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Feedback</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="py-2 px-4">{row.employee_name}</td>
                <td className="py-2 px-4">{row.month}</td>
                <td className="py-2 px-4">{row.tasks_completed}</td>
                <td className="py-2 px-4">{row.target_achieved_percent}%</td>
                <td className="py-2 px-4">{"⭐".repeat(row.rating)}</td>
                <td className="py-2 px-4">{row.behavior}</td>
                <td className="py-2 px-4">{row.status}</td>
                <td className="py-2 px-4">{row.feedback}</td>
              </tr>
            ))}
            {data.length === 0 && !fetchError && (
              <tr>
                <td colSpan={8} className="text-center py-4 text-gray-500">
                  कोई performance data उपलब्ध नहीं है।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SummaryCard({
  title,
  count,
  color,
}: {
  title: string;
  count: number;
  color: "blue" | "green" | "red";
}) {
  const colorMap = {
    blue: "text-blue-500",
    green: "text-green-500",
    red: "text-red-500",
  };
  return (
    <div className="bg-white p-5 rounded-xl shadow hover:shadow-lg flex flex-col items-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className={`text-3xl font-bold mt-2 ${colorMap[color]}`}>{count}</p>
    </div>
  );
}