"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function TroubleshootPage() {
  const [status, setStatus] = useState({
    supabase: "checking",
    database: "checking",
    productsTable: "checking",
    envVars: "checking",
  });
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  useEffect(() => {
    runAllChecks();
  }, []);

  const runAllChecks = async () => {
    addLog("Starting system diagnostics...");

    // Check environment variables
    setStatus((prev) => ({ ...prev, envVars: "checking" }));
    addLog("Checking environment variables...");
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setStatus((prev) => ({ ...prev, envVars: "failed" }));
      addLog("ERROR: NEXT_PUBLIC_SUPABASE_URL is not set!");
    } else if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setStatus((prev) => ({ ...prev, envVars: "failed" }));
      addLog("ERROR: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set!");
    } else {
      setStatus((prev) => ({ ...prev, envVars: "passed" }));
      addLog("Environment variables OK");
    }

    // Test database connection
    setStatus((prev) => ({ ...prev, database: "checking" }));
    addLog("Testing database connection...");
    
    try {
      const response = await fetch("/api/test-db");
      const data = await response.json();
      
      if (response.ok && data.status === "ok") {
        setStatus((prev) => ({ ...prev, database: "passed" }));
        addLog("Database connection OK");
      } else {
        setStatus((prev) => ({ ...prev, database: "failed" }));
        addLog(`Database error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setStatus((prev) => ({ ...prev, database: "failed" }));
      addLog(`Database connection failed: ${error}`);
    }

    // Check products table
    setStatus((prev) => ({ ...prev, productsTable: "checking" }));
    addLog("Checking products table...");
    
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        setStatus((prev) => ({ ...prev, productsTable: "passed" }));
        addLog("Products table exists and accessible");
      } else {
        setStatus((prev) => ({ ...prev, productsTable: "failed" }));
        addLog("Products table not accessible or doesn't exist");
      }
    } catch (error) {
      setStatus((prev) => ({ ...prev, productsTable: "failed" }));
      addLog(`Error checking products: ${error}`);
    }

    addLog("System diagnostics complete");
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "checking":
        return <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "passed": return "OK";
      case "failed": return "Failed";
      case "checking": return "Checking...";
      default: return "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">BSCampus Troubleshoot</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          Diagnosting system untuk masalah posting produk
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {renderStatusIcon(status.envVars)}
              Environment Variables
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Status: {getStatusText(status.envVars)}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? "text-green-500" : "text-red-500"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Set" : "✗ Not Set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_KEY:</span>
                <span className={process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "text-green-500" : "text-red-500"}>
                  {process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "✓ Set" : "✗ Not Set"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {renderStatusIcon(status.database)}
              Database Connection
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Status: {getStatusText(status.database)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              {renderStatusIcon(status.productsTable)}
              Products Table
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Status: {getStatusText(status.productsTable)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold mb-4">Quick Solutions</h2>
            <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                <span><strong>Step 1:</strong> Tambah environment variables di Vercel</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                <span><strong>Step 2:</strong> Jalankan SQL schema di Supabase SQL Editor</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                <span><strong>Step 3:</strong> Redeploy di Vercel setelah update</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                <span><strong>Step 4:</strong> Cek browser console untuk error detail</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 mb-8">
          <h2 className="text-xl font-semibold mb-4">Diagnostic Log</h2>
          <div className="h-64 overflow-y-auto bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
            {log.length === 0 ? (
              <p className="text-slate-500 dark:text-slate-400 italic">Logs will appear here...</p>
            ) : (
              log.map((entry, index) => (
                <div key={index} className="font-mono text-sm mb-2">
                  {entry}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">Need Help?</h2>
          <p className="mb-4 opacity-90">
            Jika semua status OK tapi masih error, cek:
          </p>
          <ol className="list-decimal list-inside space-y-2 opacity-90">
            <li>Browser console (F12 → Console tab)</li>
            <li>Vercel deployment logs</li>
            <li>Supabase Table Editor untuk table structure</li>
            <li>Network tab untuk melihat response dari API</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
