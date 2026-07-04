"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase-provider";

export default function HomeRedirect() {
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session?.user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkSession();
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
      Redirecting...
    </div>
  );
}