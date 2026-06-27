"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Dialog } from "@headlessui/react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit2, FiTrash2, FiEye, FiSearch, FiPlus, FiDownload, FiPrinter } from "react-icons/fi";
import { useSupabase } from '@/lib/supabase-provider';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface Employee {
  employee_id: string;
  employee_name: string;
  father_name: string;
  date_of_birth: string;
  email: string;
  phone: string;
  address: string;
  department: string;
  designation: string;
  joining_date: string;
  basic_salary: string;
  aadhaar_number: string;
  pan_number: string;
  bank_name: string;
  bank_account_number: string;
  ifsc_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  created_at?: string;
}

export default function Employees() {
  // State management
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form state with proper typing
  const [formData, setFormData] = useState<Omit<Employee, 'created_at'>>({
    employee_id: "",
    employee_name: "",
    father_name: "",
    date_of_birth: "",
    email: "",
    phone: "",
    address: "",
    department: "",
    designation: "",
    joining_date: "",
    basic_salary: "",
    aadhaar_number: "",
    pan_number: "",
    bank_name: "",
    bank_account_number: "",
    ifsc_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
  });

  // Departments for dropdown
  const { supabase } = useSupabase(); // already working

  const departments = useMemo(() => {
    const depts = new Set(employees.map(emp => emp.department));
    return Array.from(depts).filter(Boolean).sort();
  }, [employees]);

  // Fetch employees with error handling
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setEmployees(data || []);
        setFilteredEmployees(data || []);
        toast.success("Employees loaded successfully");
      } catch (error: any) {
        toast.error(`Error loading employees: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Apply search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredEmployees(employees);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = employees.filter(emp =>
      emp.employee_name.toLowerCase().includes(term) ||
      emp.employee_id.toLowerCase().includes(term) ||
      emp.email.toLowerCase().includes(term) ||
      emp.phone.includes(term) ||
      emp.department.toLowerCase().includes(term)
    );
    setFilteredEmployees(filtered);
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, employees]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredEmployees]);

  // Form handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null, field: string) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [field]: date.toISOString().split('T')[0]
      }));
    }
  };

  // CRUD Operations
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("employees").insert([formData]);
      if (error) throw error;

      toast.success("Employee added successfully");
      setIsAddOpen(false);
      // Refresh list
      const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
      setEmployees(data || []);
      resetForm();
    } catch (error: any) {
      toast.error(`Error adding employee: ${error.message}`);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const { error } = await supabase
        .from("employees")
        .update(formData)
        .eq('employee_id', selectedEmployee.employee_id);

      if (error) throw error;

      toast.success("Employee updated successfully");
      setIsEditOpen(false);
      // Refresh list
      const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
      setEmployees(data || []);
    } catch (error: any) {
      toast.error(`Error updating employee: ${error.message}`);
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!confirm("Are you sure you want to delete this employee?")) return;

    try {
      const { error } = await supabase
        .from("employees")
        .delete()
        .eq('employee_id', employeeId);

      if (error) throw error;

      toast.success("Employee deleted successfully");
      // Refresh list
      const { data } = await supabase.from("employees").select("*").order("created_at", { ascending: false });
      setEmployees(data || []);
    } catch (error: any) {
      toast.error(`Error deleting employee: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      employee_id: "",
      employee_name: "",
      father_name: "",
      date_of_birth: "",
      email: "",
      phone: "",
      address: "",
      department: "",
      designation: "",
      joining_date: "",
      basic_salary: "",
      aadhaar_number: "",
      pan_number: "",
      bank_name: "",
      bank_account_number: "",
      ifsc_code: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relationship: "",
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "ID", "Name", "Email", "Phone", "Department", "Designation",
      "Joining Date", "Basic Salary"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredEmployees.map(emp => [
        `"${emp.employee_id}"`,
        `"${emp.employee_name}"`,
        `"${emp.email}"`,
        `"${emp.phone}"`,
        `"${emp.department}"`,
        `"${emp.designation}"`,
        `"${emp.joining_date}"`,
        `"${emp.basic_salary}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `employees_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
  };

  // Print employee list
  const printEmployeeList = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Employee List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Employee List</h1>
              <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Designation</th>
                </tr>
              </thead>
              <tbody>
                ${filteredEmployees.map(emp => `
                  <tr>
                    <td>${emp.employee_id}</td>
                    <td>${emp.employee_name}</td>
                    <td>${emp.email}</td>
                    <td>${emp.phone}</td>
                    <td>${emp.department}</td>
                    <td>${emp.designation}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <script>
              setTimeout(() => {
                window.print();
                window.close();
              }, 200);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <section className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-indigo-800">Employee Management</h1>
          <p className="text-gray-600">{filteredEmployees.length} employees found</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsAddOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded font-semibold shadow flex items-center gap-2"
            >
              <FiPlus /> Add
            </button>
            <button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold shadow flex items-center gap-2"
              title="Export to CSV"
            >
              <FiDownload />
            </button>
            <button
              onClick={printEmployeeList}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold shadow flex items-center gap-2"
              title="Print List"
            >
              <FiPrinter />
            </button>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="rounded-lg shadow bg-white p-4 overflow-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? "No employees match your search" : "No employees found"}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-indigo-50 text-indigo-800 text-left">
                  <tr>
                    <th className="py-3 px-4 font-medium">ID</th>
                    <th className="py-3 px-4 font-medium">Name</th>
                    <th className="py-3 px-4 font-medium">Phone</th>
                    <th className="py-3 px-4 font-medium">Email</th>
                    <th className="py-3 px-4 font-medium">Department</th>
                    <th className="py-3 px-4 font-medium">Designation</th>
                    <th className="py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700 divide-y divide-gray-100">
                  {currentItems.map((emp) => (
                    <tr key={emp.employee_id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">{emp.employee_id}</td>
                      <td className="py-3 px-4 font-medium">{emp.employee_name}</td>
                      <td className="py-3 px-4">{emp.phone}</td>
                      <td className="py-3 px-4">{emp.email}</td>
                      <td className="py-3 px-4">
                        <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                          {emp.department}
                        </span>
                      </td>
                      <td className="py-3 px-4">{emp.designation}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setIsViewOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50"
                            title="View"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEmployee(emp);
                              setFormData(emp);
                              setIsEditOpen(true);
                            }}
                            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(emp.employee_id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Showing {currentPage * itemsPerPage - itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of{" "}
                  {filteredEmployees.length} entries
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 border rounded ${currentPage === pageNum ? "bg-indigo-600 text-white" : ""}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Employee Modal */}
      <Dialog open={isAddOpen} onClose={() => setIsAddOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-2xl font-bold text-indigo-800">
              Add New Employee
            </Dialog.Title>
            <form onSubmit={handleAddSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID*</label>
                    <input
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                    <input
                      name="employee_name"
                      value={formData.employee_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                    <input
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <DatePicker
                      selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                      onChange={(date) => handleDateChange(date, 'date_of_birth')}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select date"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Job Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Job Information</h3>
                <div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department*</label>
                    <input
                      name="department"
                      type="text"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      placeholder="Enter department name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation*</label>
                    <input
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                    <DatePicker
                      selected={formData.joining_date ? new Date(formData.joining_date) : null}
                      onChange={(date) => handleDateChange(date, 'joining_date')}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary*</label>
                    <input
                      name="basic_salary"
                      type="number"
                      value={formData.basic_salary}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Documents & Bank Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Documents & Bank Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                    <input
                      name="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      name="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Emergency Contact</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* View Employee Modal */}
      <Dialog open={isViewOpen} onClose={() => setIsViewOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg p-6 shadow-xl">
            {selectedEmployee && (
              <>
                <Dialog.Title className="text-2xl font-bold text-indigo-800 mb-4">
                  Employee Details
                </Dialog.Title>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
                    <div>
                      <p className="text-sm text-gray-500">Employee ID</p>
                      <p className="font-medium">{selectedEmployee.employee_id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Full Name</p>
                      <p className="font-medium">{selectedEmployee.employee_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Father's Name</p>
                      <p className="font-medium">{selectedEmployee.father_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">
                        {selectedEmployee.date_of_birth ?
                          new Date(selectedEmployee.date_of_birth).toLocaleDateString() : "-"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{selectedEmployee.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{selectedEmployee.address || "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Job Information</h3>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Designation</p>
                      <p className="font-medium">{selectedEmployee.designation}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Joining Date</p>
                      <p className="font-medium">
                        {selectedEmployee.joining_date ?
                          new Date(selectedEmployee.joining_date).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Basic Salary</p>
                      <p className="font-medium">{selectedEmployee.basic_salary || "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Documents & Bank</h3>
                    <div>
                      <p className="text-sm text-gray-500">Aadhaar Number</p>
                      <p className="font-medium">{selectedEmployee.aadhaar_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">PAN Number</p>
                      <p className="font-medium">{selectedEmployee.pan_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bank Name</p>
                      <p className="font-medium">{selectedEmployee.bank_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Account Number</p>
                      <p className="font-medium">{selectedEmployee.bank_account_number || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">IFSC Code</p>
                      <p className="font-medium">{selectedEmployee.ifsc_code || "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Emergency Contact</h3>
                    <div>
                      <p className="text-sm text-gray-500">Contact Name</p>
                      <p className="font-medium">{selectedEmployee.emergency_contact_name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Contact Phone</p>
                      <p className="font-medium">{selectedEmployee.emergency_contact_phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Relationship</p>
                      <p className="font-medium">{selectedEmployee.emergency_contact_relationship || "-"}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    onClick={() => setIsViewOpen(false)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
          <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg p-6 shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-2xl font-bold text-indigo-800">
              Edit Employee
            </Dialog.Title>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Personal Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID*</label>
                    <input
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name*</label>
                    <input
                      name="employee_name"
                      value={formData.employee_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                    <input
                      name="father_name"
                      value={formData.father_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <DatePicker
                      selected={formData.date_of_birth ? new Date(formData.date_of_birth) : null}
                      onChange={(date) => handleDateChange(date, 'date_of_birth')}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select date"
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                    <input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Job Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Job Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department*</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation*</label>
                    <input
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                    <DatePicker
                      selected={formData.joining_date ? new Date(formData.joining_date) : null}
                      onChange={(date) => handleDateChange(date, 'joining_date')}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      dateFormat="yyyy-MM-dd"
                      placeholderText="Select date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary*</label>
                    <input
                      name="basic_salary"
                      type="number"
                      value={formData.basic_salary}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                {/* Documents & Bank Details */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Documents & Bank Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                    <input
                      name="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                    <input
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                    <input
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      name="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                    <input
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Emergency Contact</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Update Employee
                </button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>
    </section>
  );
}