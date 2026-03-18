'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TestTube, FileText, Clock, CheckCircle } from 'lucide-react'

export default function LabTechnicianDashboard() {
  const [stats, setStats] = useState({
    pendingTests: 0,
    completedToday: 0,
    inProgress: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get pending lab orders
      const { count: pendingCount } = await supabase
        .from('lab_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      // Get in progress
      const { count: inProgressCount } = await supabase
        .from('lab_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress')

      setStats({
        pendingTests: pendingCount || 0,
        completedToday: 0,
        inProgress: inProgressCount || 0,
      })
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lab Technician Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Manage lab tests and results.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Clock className="h-8 w-8 text-orange-600" />}
          title="Pending Tests"
          value={stats.pendingTests}
        />
        <StatCard
          icon={<TestTube className="h-8 w-8 text-blue-600" />}
          title="In Progress"
          value={stats.inProgress}
        />
        <StatCard
          icon={<CheckCircle className="h-8 w-8 text-green-600" />}
          title="Completed Today"
          value={stats.completedToday}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="/lab-technician/orders" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <TestTube className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-semibold">View Lab Orders</h3>
              <p className="text-sm text-gray-600">Process pending lab tests</p>
            </a>
            <a href="/lab-technician/results" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold">Enter Results</h3>
              <p className="text-sm text-gray-600">Submit test results</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, title, value }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
