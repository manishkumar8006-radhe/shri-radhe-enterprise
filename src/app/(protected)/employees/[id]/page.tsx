import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

// 1️⃣ generateMetadata – ‘params’ को await करें
export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    return {
        title: `Employee ${id}`,
    };
}

// 2️⃣ Page Component – ‘params’ को await करें
export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = createClient();

    const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("employee_id", id as any)   // ✅ `as any` – Type Checking Override
        .single();

    if (error || !data) {
        notFound();
    }

    // ✅ This line fixes the TypeScript error: cast data to any
    const employee = data as any;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Employee Details</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p><strong>ID:</strong> {employee.employee_id}</p>
                    <p><strong>Name:</strong> {employee.employee_name}</p>
                    <p><strong>Department:</strong> {employee.department}</p>
                    <p><strong>Designation:</strong> {employee.designation}</p>
                </div>
                <div>
                    <p><strong>ESI Number:</strong> {employee.esi_number}</p>
                    <p><strong>UAN Number:</strong> {employee.uan_number}</p>
                    <p><strong>Joining Date:</strong> {new Date(employee.joining_date).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}