'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList } from 'lucide-react'
import Link from 'next/link'

export default function DiagnosePage() {
  const [recentPatients, setRecentPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentPatients()
  }, [])

  async function loadRecentPatients() {
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

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            user:users(id, first_name, last_name),
            blood_group,
            allergies,
            chronic_conditions
          )
        `)
        .eq('doctor_id', staffData.id)
        .eq('appointment_date', today)
        .in('status', ['checked_in', 'in_progress'])
        .order('appointment_time', { ascending: true })

      if (error) throw error
      setRecentPatients(data || [])
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading patients...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diagnose Patients</h1>
        <p className="text-gray-600 mt-1">Examine and diagnose patients</p>
      </div>

      {recentPatients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No patients waiting for diagnosis</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recentPatients.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      {appointment.patient?.user?.first_name} {appointment.patient?.user?.last_name}
                    </CardTitle>
                    <p className="text-sm text-gray-600">{appointment.reason_for_visit}</p>
                  </div>
                  <Link href={`/doctor/patients/${appointment.patient?.id}/diagnose`}>
                    <Button>Start Diagnosis</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Blood Group</p>
                    <p className="font-semibold">{appointment.patient?.blood_group || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Allergies</p>
                    <p className="font-semibold text-red-600">
                      {appointment.patient?.allergies?.length > 0 
                        ? appointment.patient.allergies.join(', ') 
                        : 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Chronic Conditions</p>
                    <p className="font-semibold">
                      {appointment.patient?.chronic_conditions?.length > 0 
                        ? appointment.patient.chronic_conditions.join(', ') 
                        : 'None'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
