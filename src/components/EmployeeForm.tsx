"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabase-provider";

export default function EmployeeForm({
    initialData = null,
    mode = "add", // "add" or "edit"
}: {
    initialData?: any;
    mode?: "add" | "edit";
}) {
    const { supabase } = useSupabase();
    const [formData, setFormData] = useState({
        employee_id: "",
        employee_name: "",
        father_name: "",
        date_of_birth: "",
        email: "",
        phone: "",
        address: "",
        department: "",
        designation: "",
        joining_date: "",
        basic_salary: "",
        hra: "",
        conveyance: "",
        advance: "",
        aadhaar_number: "",
        pan_number: "",
        bank_name: "",
        bank_account_number: "",
        ifsc_code: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relationship: "",
    });

    useEffect(() => {
        if (initialData) {
            setFormData({ ...initialData });
        }
    }, [initialData]);

    const handleChange = (e: any) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (mode === "edit") {
            const { error } = await supabase
                .from("employees")
                .update(formData)
                .eq("employee_id", formData.employee_id);
            if (error) alert("Error updating: " + error.message);
            else alert("Employee updated successfully");
        } else {
            const { error } = await supabase.from("employees").insert([formData]);
            if (error) alert("Error adding: " + error.message);
            else alert("Employee added successfully");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {[
                    { label: "Employee ID", name: "employee_id" },
                    { label: "Employee Name", name: "employee_name" },
                    { label: "Father's Name", name: "father_name" },
                    { label: "Date of Birth", name: "date_of_birth", type: "date" },
                    { label: "Email", name: "email", type: "email" },
                    { label: "Phone", name: "phone" },
                    { label: "Address", name: "address", full: true },
                    { label: "Department", name: "department" },
                    { label: "Designation", name: "designation" },
                    { label: "Joining Date", name: "joining_date", type: "date" },
                    { label: "Basic Salary", name: "basic_salary" },
                    { label: "Aadhaar Number", name: "aadhaar_number" },
                    { label: "PAN Number", name: "pan_number" },
                    { label: "Bank Name", name: "bank_name" },
                    { label: "Account Number", name: "bank_account_number" },
                    { label: "IFSC Code", name: "ifsc_code" },
                    { label: "Emergency Contact Name", name: "emergency_contact_name" },
                    { label: "Emergency Contact Phone", name: "emergency_contact_phone" },
                    {
                        label: "Emergency Relationship",
                        name: "emergency_contact_relationship",
                    },
                ].map((field, index) => (
                    <div
                        key={index}
                        className={field.full ? "col-span-2" : ""}
                    >
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {field.label}
                        </label>
                        <input
                            name={field.name}
                            type={field.type || "text"}
                            value={formData[field.name as keyof typeof formData] ?? ""}

                            onChange={handleChange}
                            className="w-full border px-3 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder={field.label}
                        />
                    </div>
                ))}
            </div>

            <div className="flex justify-end gap-3">
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                >
                    {mode === "edit" ? "Update" : "Add"} Employee
                </button>
            </div>
        </form>
    );
}
