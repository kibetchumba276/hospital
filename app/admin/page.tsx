'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Building2, Bed } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    todayAppointments: 0,
    departments: 0,
    availableBeds: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const today = new Date().toISOString().split('T')[0]

      const [users, doctors, patients, appointments, departments, beds] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('appointment_date', today),
        supabase.from('departments').select('*', { count: 'exact', head: true }),
        supabase.from('beds').select('*', { count: 'exact', head: true }).eq('status', 'available'),
      ])

      setStats({
        totalUsers: users.count || 0,
        totalDoctors: doctors.count || 0,
        totalPatients: patients.count || 0,
        todayAppointments: appointments.count || 0,
        departments: departments.count || 0,
        availableBeds: beds.count || 0,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and management</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Users className="h-8 w-8 text-primary-600" />}
          title="Total Users"
          value={stats.totalUsers}
          link="/admin/users"
        />
        <StatCard
          icon={<Users className="h-8 w-8 text-blue-600" />}
          title="Doctors"
          value={stats.totalDoctors}
          link="/admin/users?role=doctor"
        />
        <StatCard
          icon={<Users className="h-8 w-8 text-green-600" />}
          title="Patients"
          value={stats.totalPatients}
          link="/admin/users?role=patient"
        />
        <StatCard
          icon={<Calendar className="h-8 w-8 text-orange-600" />}
          title="Today's Appointments"
          value={stats.todayAppointments}
          link="/admin/appointments"
        />
        <StatCard
          icon={<Building2 className="h-8 w-8 text-purple-600" />}
          title="Departments"
          value={stats.departments}
          link="/admin/departments"
        />
        <StatCard
          icon={<Bed className="h-8 w-8 text-red-600" />}
          title="Available Beds"
          value={stats.availableBeds}
          link="/admin/beds"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/admin/users/create" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold">Create User Account</p>
              <p className="text-sm text-gray-600">Add doctors, nurses, or staff</p>
            </Link>
            <Link href="/admin/departments/create" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <p className="font-semibold">Add Department</p>
              <p className="text-sm text-gray-600">Create new hospital department</p>
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
