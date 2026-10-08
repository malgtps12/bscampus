'use client'

import { useState, useEffect } from 'react'

export default function CheckDatabasePage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    try {
      const response = await fetch('/api/check-database')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error checking database:', error)
      setResult({ error: 'Failed to check database' })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (sql: string) => {
    navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking database...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Database Status</h1>

          {result?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{result.error}</p>
            </div>
          )}

          {result?.summary && (
            <div className="mb-8">
              <div className={`rounded-lg p-6 ${result.summary.all_tables_exist ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                <h2 className="text-lg font-semibold mb-2">
                  {result.summary.all_tables_exist ? '✓ Database Ready' : '⚠ Database Needs Setup'}
                </h2>
                <p className={result.summary.all_tables_exist ? 'text-green-700' : 'text-yellow-700'}>
                  {result.summary.migrations_count === 0 
                    ? 'All tables exist and are properly configured.' 
                    : `${result.summary.migrations_count} migration(s) needed`}
                </p>
              </div>
            </div>
          )}

          {result?.tables && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Tables Status</h2>
              <div className="space-y-3">
                {Object.entries(result.tables).map(([tableName, status]: [string, any]) => (
                  <div key={tableName} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`text-lg ${status.exists ? '✓' : '✗'}`}>
                      {status.exists ? '✓' : '✗'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{tableName}</p>
                      {status.error && <p className="text-sm text-red-600">{status.error}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result?.migrations_needed && result.migrations_needed.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Required Migrations</h2>
              <div className="space-y-4">
                {result.migrations_needed.map((migration: any, idx: number) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">{migration.name}</h3>
                    
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto mb-3">
                      <pre>{migration.sql.trim()}</pre>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => copyToClipboard(migration.sql.trim())}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        {copied ? 'Copied!' : 'Copy SQL'}
                      </button>
                      <a
                        href="https://supabase.com/dashboard"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
                      >
                        Open Supabase →
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {result.instructions && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Setup Instructions:</h3>
                  <ol className="space-y-2 text-blue-800">
                    {result.instructions.map((instruction: string, idx: number) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          <div className="pt-6 border-t">
            <button
              onClick={() => {
                setLoading(true)
                checkDatabase()
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
