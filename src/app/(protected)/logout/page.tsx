"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase-provider";
import { toast } from "sonner";
import { Loader2, LogOut } from "lucide-react";

export default function LogoutPage() {
    const router = useRouter();
    const { supabase } = useSupabase();

    useEffect(() => {
        const logoutNow = async () => {
            const { error } = await supabase.auth.signOut(); // ✅ Only once

            if (error) {
                toast.error("Logout failed", {
                    description: error.message,
                });
            } else {
                toast.success("Logged out successfully", {
                    description: "Redirecting to login...",
                });

                setTimeout(() => {
                    router.push("/login"); // ✅ Safe redirect after toast
                }, 1000); // Optional delay
            }
        };

        logoutNow();
    }, [router, supabase]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-r from-rose-100 to-teal-100">
            <div className="text-center space-y-4">
                <LogOut className="w-10 h-10 text-pink-500 animate-bounce" />
                <h1 className="text-2xl font-semibold text-gray-800">
                    Logging you out...
                </h1>
                <p className="text-sm text-gray-600">Please wait while we redirect.</p>
                <Loader2 className="h-5 w-5 animate-spin text-gray-500 mx-auto mt-4" />
            </div>
        </div>
    );
}
