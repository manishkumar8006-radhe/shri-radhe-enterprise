'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabase } from '@/lib/supabase-provider';

// ✅ Reusable Input component – now with proper typing
function Input({
    name,
    label,
    value,
    onChange,
    type = 'text'
}: {
    name: string;
    label: string;
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
}) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-600 mb-1">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value ?? ''}  // ✅ prevent uncontrolled warning
                onChange={onChange}
                className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={`Enter ${label}`}
            />
        </div>
    );
}

export default function EmployeeEditPage() {
    const { supabase } = useSupabase();
    const { id } = useParams<{ id: string }>();  // ✅ typed params
    const router = useRouter();

    const [formData, setFormData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEmployee() {
            if (!id) {
                alert('Employee ID missing');
                router.push('/employees');
                return;
            }

            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('employee_id', id as any)   // ✅ type-safe for build
                .single();

            if (error || !data) {
                alert('Employee not found');
                router.push('/employees');
                return;
            }

            setFormData(data);
            setLoading(false);
        }

        fetchEmployee();
    }, [id, supabase, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData) {
            alert('No data to update');
            return;
        }

        const { error } = await supabase
            .from('employees')
            .update(formData)
            .eq('employee_id', id as any);   // ✅ type-safe

        if (error) {
            alert('Update failed: ' + error.message);
        } else {
            alert('Employee updated successfully');
            router.push('/employees');
        }
    };

    if (loading) {
        return <p className="text-center p-10 text-gray-500">Loading employee data...</p>;
    }

    return (
        <section className="max-w-5xl mx-auto p-6 space-y-8">
            <h1 className="text-3xl font-bold text-indigo-700 mb-4">Edit Employee</h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="employee_name" label="Employee Name" value={formData.employee_name} onChange={handleChange} />
                        <Input name="father_name" label="Father's Name" value={formData.father_name} onChange={handleChange} />
                        <Input name="email" label="Email" value={formData.email} onChange={handleChange} type="email" />
                        <Input name="phone" label="Phone" value={formData.phone} onChange={handleChange} />
                    </div>
                </div>

                {/* Job Details */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Job Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="department" label="Department" value={formData.department} onChange={handleChange} />
                        <Input name="designation" label="Designation" value={formData.designation} onChange={handleChange} />
                        <Input name="joining_date" label="Joining Date" value={formData.joining_date?.slice(0, 10)} onChange={handleChange} type="date" />
                        <Input name="basic" label="Basic Salary" value={formData.basic} onChange={handleChange} />
                        <Input name="esi_number" label="ESI Number" value={formData.esi_number} onChange={handleChange} />
                        <Input name="hra" label="HRA" value={formData.hra} onChange={handleChange} />
                        <Input name="epf_number" label="EPF Number" value={formData.epf_number} onChange={handleChange} />
                        <Input name="uan_number" label="UAN Number" value={formData.uan_number} onChange={handleChange} />
                        <Input name="conveyance" label="Conveyance" value={formData.conveyance} onChange={handleChange} />
                        <Input name="advance" label="Advance" value={formData.advance} onChange={handleChange} />
                    </div>
                </div>

                {/* Documents */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Documents</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="aadhaar_number" label="Aadhaar Number" value={formData.aadhaar_number} onChange={handleChange} />
                        <Input name="pan_number" label="PAN Number" value={formData.pan_number} onChange={handleChange} />
                    </div>
                </div>

                {/* Bank Details */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Bank Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="bank_name" label="Bank Name" value={formData.bank_name} onChange={handleChange} />
                        <Input name="bank_account_number" label="Account Number" value={formData.bank_account_number} onChange={handleChange} />
                        <Input name="ifsc_code" label="IFSC Code" value={formData.ifsc_code} onChange={handleChange} />
                    </div>
                </div>

                {/* Salary Details – removed duplicate fields (already covered above) */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Salary & Compensation</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="basic" label="Basic Salary" value={formData.basic} onChange={handleChange} />
                        <Input name="hra" label="HRA" value={formData.hra} onChange={handleChange} />
                        <Input name="conveyance" label="Conveyance" value={formData.conveyance} onChange={handleChange} />
                        <Input name="advance" label="Advance" value={formData.advance} onChange={handleChange} />
                        <Input name="esi_number" label="ESI Number" value={formData.esi_number} onChange={handleChange} />
                        <Input name="uan_number" label="UAN Number" value={formData.uan_number} onChange={handleChange} />
                        <Input name="epf_number" label="EPF Number" value={formData.epf_number} onChange={handleChange} />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Emergency Contact</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="emergency_contact_name" label="Contact Name" value={formData.emergency_contact_name} onChange={handleChange} />
                        <Input name="emergency_contact_phone" label="Contact Phone" value={formData.emergency_contact_phone} onChange={handleChange} />
                        <Input name="emergency_contact_relationship" label="Relationship" value={formData.emergency_contact_relationship} onChange={handleChange} />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="text-right">
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-semibold shadow"
                    >
                        Save Changes
                    </button>
                </div>
            </form>
        </section>
    );
}