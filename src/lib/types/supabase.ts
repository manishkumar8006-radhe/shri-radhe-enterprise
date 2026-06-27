export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          employee_id: string
          employee_name: string
          department: string
          designation: string
          esi_number: string
          uan_number: string
          joining_date: string
        }
        Insert: {
          employee_id: string
          employee_name: string
          department: string
          designation: string
          esi_number: string
          uan_number: string
          joining_date: string
        }
        Update: {
          employee_id?: string
          employee_name?: string
          department?: string
          designation?: string
          esi_number?: string
          uan_number?: string
          joining_date?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
