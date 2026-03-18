'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Activity, FileText } from 'lucide-react'

export default function NurseDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    patientsAssigned: 0,
    vitalsRecorded: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]

      // Get today's appointments count
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'checked_in'])

      setStats((prev) => ({ ...prev, todayAppointments: appointmentsCount || 0 }))
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
        <h1 className="text-3xl font-bold text-gray-900">Nurse Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your overview for today.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Calendar className="h-8 w-8 text-primary-600" />}
          title="Today's Appointments"
          value={stats.todayAppointments}
        />
        <StatCard
          icon={<Users className="h-8 w-8 text-blue-600" />}
          title="Patients Assigned"
          value={stats.patientsAssigned}
        />
        <StatCard
          icon={<Activity className="h-8 w-8 text-green-600" />}
          title="Vitals Recorded"
          value={stats.vitalsRecorded}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="/nurse/vitals" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Activity className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-semibold">Record Vitals</h3>
              <p className="text-sm text-gray-600">Record patient vital signs</p>
            </a>
            <a href="/nurse/medications" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <FileText className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold">Administer Medication</h3>
              <p className="text-sm text-gray-600">Log medication administration</p>
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
