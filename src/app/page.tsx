"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/lib/supabase-provider";

export default function HomeRedirect() {
  const router = useRouter();
  const { supabase } = useSupabase();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      console.log("SESSION ERROR:", error);
      console.log("SESSION:", data.session);

      if (!isMounted) return;

      if (data.session?.user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("AUTH EVENT:", _event);
      console.log("SESSION (listener):", session);

      if (!isMounted) return;

      if (session?.user) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  return (
    <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
      Redirecting...
    </div>
  );
}