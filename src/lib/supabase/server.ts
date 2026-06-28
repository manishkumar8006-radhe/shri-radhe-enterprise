import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '../types/supabase'

export const createClient = () => {
  const cookieStore = cookies()
  // ✅ Options को `as any` में Cast करें – TypeScript Error से बचने के लिए
  const options = {
    cookies: () => cookieStore,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  } as any
  return createServerComponentClient<Database>(options)
}