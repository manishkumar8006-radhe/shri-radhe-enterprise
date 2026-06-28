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
        .eq("employee_id", id as any)   // ✅ `as any` डालें – Type Checking Override
        .single();

    if (error || !data) {
        notFound();
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Employee Details</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p><strong>ID:</strong> {data.employee_id}</p>
                    <p><strong>Name:</strong> {data.employee_name}</p>
                    <p><strong>Department:</strong> {data.department}</p>
                    <p><strong>Designation:</strong> {data.designation}</p>
                </div>
                <div>
                    <p><strong>ESI Number:</strong> {data.esi_number}</p>
                    <p><strong>UAN Number:</strong> {data.uan_number}</p>
                    <p><strong>Joining Date:</strong> {new Date(data.joining_date).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
