"use client";

import React, { useState } from 'react';
import { useSupabase } from '@/lib/supabase-provider';
import { toast } from 'sonner';
import Tesseract from 'tesseract.js';

interface ExtractedAttendance {
    employeeId: string;
    inTime?: string;
    outTime?: string;
}

interface ScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDate: string; // 'YYYY-MM-DD'
}

export default function AttendanceScanner({ isOpen, onClose, onSuccess, selectedDate }: ScannerProps) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [extractedData, setExtractedData] = useState<ExtractedAttendance[]>([]);
    const { supabase } = useSupabase();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
            setExtractedData([]);
        }
    };

    const handleScan = async () => {
        if (!file) {
            toast.error('Please select an image.');
            return;
        }

        setIsProcessing(true);
        try {
            // Perform OCR
            const result = await Tesseract.recognize(file, 'eng', {
                logger: (m) => console.log(m),
            });

            const text = result.data.text;
            console.log('Extracted Text:', text);

            // Parse text – expect lines with Employee ID and times
            const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            // Skip header if present (optional)
            const dataLines = lines.slice(1); // assume first line is header

            const parsed: ExtractedAttendance[] = [];

            for (const line of dataLines) {
                // Try to match Employee ID (e.g., EMP001, SR01, etc.)
                const idMatch = line.match(/\b([A-Za-z]{2,5}\d{1,4})\b/);
                if (!idMatch) continue;

                const employeeId = idMatch[1].toUpperCase();
                // Find times (HH:MM)
                const times = line.match(/\b(\d{1,2}:\d{2})\b/g);
                let inTime: string | undefined;
                let outTime: string | undefined;

                if (times && times.length >= 1) {
                    inTime = times[0];
                    if (times.length >= 2) outTime = times[1];
                }

                parsed.push({ employeeId, inTime, outTime });
            }

            setExtractedData(parsed);

            if (parsed.length === 0) {
                toast.warning('No employee data found. Please check the image quality.');
            } else {
                toast.success(`✅ Extracted ${parsed.length} records.`);
            }
        } catch (error) {
            console.error('OCR Error:', error);
            toast.error('OCR failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (extractedData.length === 0) {
            toast.warning('No data to save. Please scan first.');
            return;
        }

        let successCount = 0;
        let failCount = 0;

        for (const record of extractedData) {
            // Verify employee exists
            const { data: emp, error: empError } = await supabase
                .from('employees')
                .select('employee_id')
                .eq('employee_id', record.employeeId)
                .maybeSingle();

            if (empError || !emp) {
                console.warn(`Employee ${record.employeeId} not found`);
                failCount++;
                continue;
            }

            const status = record.inTime ? 'Present' : 'Absent';

            // Upsert attendance
            const { error } = await supabase
                .from('attendance')
                .upsert({
                    employee_id: record.employeeId,
                    date: selectedDate,
                    status,
                    check_in: record.inTime || null,
                    check_out: record.outTime || null,
                    note: 'Scanned from manual sheet',
                    ot_hours: 0,
                }, { onConflict: 'employee_id, date' });

            if (error) {
                console.error('Error saving attendance:', error);
                failCount++;
            } else {
                successCount++;
            }
        }

        toast.success(`✅ ${successCount} records saved, ${failCount} failed.`);
        onSuccess(); // Refresh attendance data
        onClose();
        // Reset
        setFile(null);
        setPreview(null);
        setExtractedData([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                <h2 className="text-xl font-bold mb-4 text-indigo-800">📸 Scan Attendance Sheet</h2>

                <div className="space-y-4">
                    {/* File Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        {preview ? (
                            <img src={preview} alt="Attendance Sheet" className="max-h-64 mx-auto rounded" />
                        ) : (
                            <p className="text-gray-500">Upload a clear photo of the attendance sheet</p>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={handleScan}
                            disabled={!file || isProcessing}
                            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {isProcessing ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span> Scanning...
                                </>
                            ) : (
                                '🔍 Scan & Extract'
                            )}
                        </button>

                        {extractedData.length > 0 && (
                            <button
                                onClick={handleSave}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                💾 Save Attendance
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>

                    {/* Extracted Data Preview */}
                    {extractedData.length > 0 && (
                        <div className="mt-4">
                            <h3 className="font-semibold text-gray-700 mb-2">
                                📋 Extracted Data ({extractedData.length} records)
                            </h3>
                            <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-left">Employee ID</th>
                                            <th className="p-2 text-left">In-Time</th>
                                            <th className="p-2 text-left">Out-Time</th>
                                            <th className="p-2 text-left">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {extractedData.map((d, i) => (
                                            <tr key={i} className="border-t">
                                                <td className="p-2">{d.employeeId}</td>
                                                <td className="p-2">{d.inTime || '-'}</td>
                                                <td className="p-2">{d.outTime || '-'}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${d.inTime ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {d.inTime ? 'Present' : 'Absent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                ✅ Please verify the data before saving. Incorrect entries can be edited later.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}