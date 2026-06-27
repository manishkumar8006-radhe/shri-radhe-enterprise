"use client";

import React, { useEffect, useState } from "react";
import { useSupabase } from '@/lib/supabase-provider';

import { format } from "date-fns";

type Contact = {
  employee_id: string;
  employee_name: string;
  phone: string;
  department: string;
  designation: string;
};

type Requirement = {
  id: number;
  text: string;
  status: string;
  created_at: string;
};

export default function Recruitment() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [newRequirement, setNewRequirement] = useState("");
  const { supabase } = useSupabase(); // already working


  const [summary, setSummary] = useState({
    total: 0,
    filled: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchContacts();
    fetchRequirements();
  }, []);



  const fetchContacts = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("employee_id, employee_name, phone, department, designation");

    if (!error && data) {
      const filtered = data.filter((c) => c.phone);
      setContacts(filtered);
    }
  };

  const fetchRequirements = async () => {
    const { data, error } = await supabase
      .from("requirements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequirements(data);
      const total = data.length;
      const filled = data.filter((r) => r.status === "Filled").length;
      const pending = total - filled;
      setSummary({ total, filled, pending });
    }
  };

  const addRequirement = async () => {
    if (!newRequirement.trim()) return alert("Requirement message लिखें!");

    const { error } = await supabase
      .from("requirements")
      .insert([{ text: newRequirement, status: "Pending" }]);

    if (!error) {
      alert("✅ Requirement जोड़ी गई");
      setNewRequirement("");
      fetchRequirements();
    }
  };

  const markAsFilled = async (id: number) => {
    const { error } = await supabase
      .from("requirements")
      .update({ status: "Filled" })
      .eq("id", id);

    if (!error) {
      fetchRequirements();
    }
  };

  const sendWhatsApp = (text: string) => {
    if (!text || contacts.length === 0) return alert("No contacts or message!");

    contacts.forEach((c) => {
      const phone = c.phone.replace(/[^\d]/g, "");
      const url = `https://api.whatsapp.com/send?phone=91${phone}&text=${encodeURIComponent(text)}`;
      window.open(url, "_blank");
    });
  };

  return (
    <section className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-indigo-700 mb-6">Recruitment Dashboard</h1>

      {/* Dashboard Summary */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <div className="text-gray-500">Total Requirements</div>
          <div className="text-3xl font-bold text-indigo-600">{summary.total}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <div className="text-gray-500">Filled</div>
          <div className="text-3xl font-bold text-green-600">{summary.filled}</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow text-center">
          <div className="text-gray-500">Pending</div>
          <div className="text-3xl font-bold text-red-600">{summary.pending}</div>
        </div>
      </div>

      {/* Add New Requirement */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">नई Requirement जोड़ें</h2>
        <textarea
          className="w-full border p-3 rounded mb-3"
          rows={4}
          value={newRequirement}
          onChange={(e) => setNewRequirement(e.target.value)}
          placeholder="नई Requirement लिखें..."
        />
        <button
          onClick={addRequirement}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          + Requirement जोड़ें
        </button>
      </div>

      {/* All Requirements Table */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">सभी Requirements</h2>
        <table className="w-full text-sm">
          <thead className="bg-indigo-50 text-indigo-800">
            <tr>
              <th className="py-2 px-4">Message</th>
              <th className="py-2 px-4">Date</th>
              <th className="py-2 px-4">Status</th>
              <th className="py-2 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requirements.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 px-4">{r.text}</td>
                <td className="py-2 px-4">
                  {format(new Date(r.created_at), "dd MMM yyyy hh:mm a")}
                </td>
                <td className="py-2 px-4 font-semibold text-sm">
                  {r.status === "Filled" ? (
                    <span className="text-green-600">Filled</span>
                  ) : (
                    <span className="text-red-600">Pending</span>
                  )}
                </td>
                <td className="py-2 px-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => sendWhatsApp(r.text)}
                      className="bg-teal-600 text-white px-3 py-1 rounded"
                    >
                      WhatsApp
                    </button>
                    {r.status === "Pending" && (
                      <button
                        onClick={() => markAsFilled(r.id)}
                        className="bg-gray-800 text-white px-3 py-1 rounded"
                      >
                        Mark Filled
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {requirements.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-500">
                  कोई Requirement नहीं है।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
