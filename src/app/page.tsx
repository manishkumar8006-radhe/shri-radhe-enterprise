"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";

export default function HomeRedirect() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      const session = data.session;

      if (session?.user) {
        router.push("/login");
      } else {
        router.push("/dashboard");
      }

      setIsChecking(false);
    };

    checkSession();
  }, [router]);

  // Optional: Show nothing or loading spinner during redirect
  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 text-sm">
        Checking session...
      </div>
    );
  }

  return null;
}
