'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecords()
  }, [])

  async function loadRecords() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!staffData) return

      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(
            user:users(first_name, last_name)
          )
        `)
        .eq('doctor_id', staffData.id)
        .order('visit_date', { ascending: false })

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Error loading records:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading medical records...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-600 mt-1">View and manage patient medical records</p>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <Card key={record.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {record.patient?.user?.first_name} {record.patient?.user?.last_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {new Date(record.visit_date).toLocaleDateString()}
                  </p>
                </div>
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {record.chief_complaint && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Chief Complaint</p>
                    <p className="text-sm text-gray-600">{record.chief_complaint}</p>
                  </div>
                )}
                {record.diagnosis && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Diagnosis</p>
                    <p className="text-sm text-gray-600">{record.diagnosis}</p>
                  </div>
                )}
                {record.treatment_plan && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Treatment Plan</p>
                    <p className="text-sm text-gray-600">{record.treatment_plan}</p>
                  </div>
                )}
                {record.notes && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Notes</p>
                    <p className="text-sm text-gray-600">{record.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
