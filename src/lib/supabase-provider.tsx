'use client';

import {
  createClientComponentClient,
  type Session,
} from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/supabase';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

type SupabaseContextType = {
  supabase: SupabaseClient<Database>;
  session: Session | null;
};

const Context = createContext<SupabaseContextType | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: ReactNode;
}) {
  // ✅ Create only ONE client
  const supabase = useMemo(
    () => createClientComponentClient<Database>(),
    []
  );

  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      console.log("PROVIDER SESSION:", session);

      setSession(session);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {

      console.log("AUTH EVENT:", event);
      console.log("AUTH SESSION:", session);

      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <Context.Provider
      value={{
        supabase,
        session,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);

  if (!context) {
    throw new Error(
      "useSupabase must be used inside SupabaseProvider"
    );
  }

  return context;
};