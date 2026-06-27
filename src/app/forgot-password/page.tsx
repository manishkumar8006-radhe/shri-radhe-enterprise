"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AlertCircle, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSupabase } from "@/lib/supabase-provider";

const forgotSchema = z.object({
    email: z.string().email("Enter a valid email"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
    const { supabase } = useSupabase();
    const [isSending, setIsSending] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotFormData>({
        resolver: zodResolver(forgotSchema),
    });

    const onSubmit = async (data: ForgotFormData) => {
        setIsSending(true);
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
            redirectTo: `${location.origin}/update-password`, // ये URL वह पेज है जहां reset के बाद redirect होगा
        });

        if (error) {
            toast.error("Failed to send reset link", {
                description: error.message,
                icon: <AlertCircle className="w-5 h-5 text-red-600" />,
            });
        } else {
            toast.success("Reset email sent", {
                description: "Check your email to reset your password",
            });
        }
        setIsSending(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-white">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full max-w-md bg-white p-8 border rounded-lg space-y-5 shadow-lg"
            >
                <h2 className="text-2xl font-bold text-center text-pink-600">
                    Forgot Password
                </h2>

                <div>
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="your@email.com"
                            className="pl-10"
                            {...register("email")}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4" />
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <Button
                    type="submit"
                    className="w-full bg-pink-500 text-white hover:bg-pink-600"
                    disabled={isSending}
                >
                    {isSending ? "Sending..." : "Send Reset Link"}
                </Button>
            </form>
        </div>
    );
}
