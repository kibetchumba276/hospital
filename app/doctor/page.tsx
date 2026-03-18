'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, FileText, Clock } from 'lucide-react'
import { formatDate, formatTime } from '@/lib/utils'
import Link from 'next/link'

export default function DoctorDashboard() {
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    pendingRecords: 0,
  })
  const [todayQueue, setTodayQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!staffData) return

      const today = new Date().toISOString().split('T')[0]

      // Get today's appointments
      const { data: appointments, count } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            user:users(first_name, last_name),
            blood_group,
            allergies
          )
        `, { count: 'exact' })
        .eq('doctor_id', staffData.id)
        .eq('appointment_date', today)
        .in('status', ['scheduled', 'confirmed', 'checked_in'])
        .order('appointment_time', { ascending: true })

      setTodayQueue(appointments || [])
      setStats((prev) => ({ ...prev, todayAppointments: count || 0 }))

      // Get total unique patients
      const { count: patientsCount } = await supabase
        .from('appointments')
        .select('patient_id', { count: 'exact', head: true })
        .eq('doctor_id', staffData.id)

      setStats((prev) => ({ ...prev, totalPatients: patientsCount || 0 }))
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
        <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your schedule for today.</p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Calendar className="h-8 w-8 text-primary-600" />}
          title="Today's Appointments"
          value={stats.todayAppointments}
        />
        <StatCard
          icon={<Users className="h-8 w-8 text-blue-600" />}
          title="Total Patients"
          value={stats.totalPatients}
        />
        <StatCard
          icon={<FileText className="h-8 w-8 text-orange-600" />}
          title="Pending Records"
          value={stats.pendingRecords}
        />
      </div>

      {/* Today's Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            Today's Patient Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todayQueue.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No appointments scheduled for today</p>
          ) : (
            <div className="space-y-4">
              {todayQueue.map((appointment) => (
                <Link key={appointment.id} href={`/doctor/patients/${appointment.patient.user.id}`}>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary-100 text-primary-700 font-semibold px-3 py-2 rounded-md">
                        {formatTime(appointment.appointment_time)}
                      </div>
                      <div>
                        <p className="font-semibold">
                          {appointment.patient.user.first_name} {appointment.patient.user.last_name}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.reason_for_visit}</p>
                        {appointment.patient.allergies && appointment.patient.allergies.length > 0 && (
                          <p className="text-xs text-red-600 mt-1">
                            ⚠️ Allergies: {appointment.patient.allergies.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'checked_in'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {appointment.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
