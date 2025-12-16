import React from 'react'

export default function AdminDashboard({ summary }: { summary: any }) {
  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{summary.username} — Admin</h1>
        <div className="bg-white p-6 rounded shadow">Admin dashboard and analytics will go here.</div>
      </div>
    </div>
  )
}
