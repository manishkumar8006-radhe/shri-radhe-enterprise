// src/app/(protected)/layout.tsx

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-indigo-500">
            <span>🪔</span>
          </div>
          <span className="font-bold text-2xl ml-2 text-indigo-700 tracking-wide">
            Shri Radhe Enterprise
          </span>
        </div>
        <nav className="flex gap-8 text-base font-medium text-gray-600">
          <a href="/dashboard" className="hover:text-indigo-600">
            Dashboard
          </a>
          <a href="/employees" className="hover:text-indigo-600">
            Employees
          </a>
          <a href="/attendance" className="hover:text-indigo-600">
            Attendance
          </a>
          <a href="/payroll" className="hover:text-indigo-600">
            Payroll
          </a>
          <a href="/recruitment" className="hover:text-indigo-600">
            Recruitment
          </a>
          <a href="/performance" className="hover:text-indigo-600">
            Performance
          </a>
          <a href="/salary_slips" className="hover:text-indigo-600">
            Salary Slips
          </a>
          <a href="/bills" className="hover:text-indigo-600">
            Bills
          </a>
          <a href="/logout" className="hover:text-indigo-600">
            Logout
          </a>
        </nav>
      </header>

      <main className="px-4 pt-6 pb-10">{children}</main>
    </>
  );
}
