'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText, CreditCard, Activity } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { formatDate, formatTime } from '@/lib/utils'

export default function PatientDashboard() {
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    totalRecords: 0,
    pendingBills: 0,
  })
  const [nextAppointment, setNextAppointment] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get patient ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      // If no patient record exists, user is not a patient (likely staff viewing)
      if (patientError || !patientData) {
        console.log('No patient record found for user')
        setLoading(false)
        return
      }

      // Get upcoming appointments count
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientData.id)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed'])

      // Get next appointment
      const { data: nextAppt } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:staff!appointments_doctor_id_fkey(
            user:users(first_name, last_name),
            specialization
          ),
          department:departments(name)
        `)
        .eq('patient_id', patientData.id)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed'])
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(1)
        .single()

      // Get medical records count
      const { count: recordsCount } = await supabase
        .from('medical_records')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientData.id)

      // Get pending bills count
      const { count: billsCount } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('patient_id', patientData.id)
        .eq('payment_status', 'pending')

      setStats({
        upcomingAppointments: appointmentsCount || 0,
        totalRecords: recordsCount || 0,
        pendingBills: billsCount || 0,
      })

      setNextAppointment(nextAppt)
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
        <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your health overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Calendar className="h-8 w-8 text-primary-600" />}
          title="Upcoming Appointments"
          value={stats.upcomingAppointments}
          link="/patient/appointments"
        />
        <StatCard
          icon={<FileText className="h-8 w-8 text-blue-600" />}
          title="Medical Records"
          value={stats.totalRecords}
          link="/patient/records"
        />
        <StatCard
          icon={<CreditCard className="h-8 w-8 text-orange-600" />}
          title="Pending Bills"
          value={stats.pendingBills}
          link="/patient/billing"
        />
      </div>

      {/* Next Appointment */}
      {nextAppointment && nextAppointment.doctor && nextAppointment.doctor.user && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Next Appointment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-lg">
                    Dr. {nextAppointment.doctor.user.first_name} {nextAppointment.doctor.user.last_name}
                  </p>
                  {nextAppointment.doctor.specialization && (
                    <p className="text-gray-600">{nextAppointment.doctor.specialization}</p>
                  )}
                  {nextAppointment.department?.name && (
                    <p className="text-sm text-gray-500 mt-1">{nextAppointment.department.name}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary-600">
                    {formatDate(nextAppointment.appointment_date)}
                  </p>
                  <p className="text-gray-600">{formatTime(nextAppointment.appointment_time)}</p>
                </div>
              </div>
              {nextAppointment.reason_for_visit && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Reason:</span> {nextAppointment.reason_for_visit}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/patient/appointments/book">
              <Button className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Book New Appointment
              </Button>
            </Link>
            <Link href="/patient/records">
              <Button variant="outline" className="w-full">
                <FileText className="h-4 w-4 mr-2" />
                View Medical Records
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, title, value, link }: any) {
  return (
    <Link href={link}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
    </Link>
  )
}
