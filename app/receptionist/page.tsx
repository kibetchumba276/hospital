'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, UserPlus, CreditCard } from 'lucide-react'

export default function ReceptionistDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    checkedIn: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get today's appointments
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today)

      // Get checked in count
      const { count: checkedInCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today)
        .eq('status', 'checked_in')

      setStats({
        todayAppointments: appointmentsCount || 0,
        checkedIn: checkedInCount || 0,
        pendingPayments: 0,
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
        <h1 className="text-3xl font-bold text-gray-900">Receptionist Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Manage appointments and patient check-ins.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Calendar className="h-8 w-8 text-primary-600" />}
          title="Today's Appointments"
          value={stats.todayAppointments}
        />
        <StatCard
          icon={<Users className="h-8 w-8 text-green-600" />}
          title="Checked In"
          value={stats.checkedIn}
        />
        <StatCard
          icon={<CreditCard className="h-8 w-8 text-orange-600" />}
          title="Pending Payments"
          value={stats.pendingPayments}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="/receptionist/appointments" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Calendar className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-semibold">Manage Appointments</h3>
              <p className="text-sm text-gray-600">Schedule and check-in patients</p>
            </a>
            <a href="/receptionist/register" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <UserPlus className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold">Register New Patient</h3>
              <p className="text-sm text-gray-600">Add new patient to system</p>
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
