'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Activity } from 'lucide-react'
import { formatDate } from '@/lib/utils'

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

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) return

      const { data } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctor:staff!medical_records_doctor_id_fkey(
            user:users(first_name, last_name),
            specialization
          ),
          vitals(*)
        `)
        .eq('patient_id', patientData.id)
        .order('visit_date', { ascending: false })

      setRecords(data || [])
    } catch (error) {
      console.error('Error loading records:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-600 mt-1">Your complete medical history</p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            No medical records yet
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Visit on {formatDate(record.visit_date)}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Dr. {record.doctor.user.first_name} {record.doctor.user.last_name} - {record.doctor.specialization}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {record.chief_complaint && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Chief Complaint</p>
                    <p className="text-gray-600">{record.chief_complaint}</p>
                  </div>
                )}

                {record.diagnosis && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Diagnosis</p>
                    <p className="text-gray-600">{record.diagnosis}</p>
                  </div>
                )}

                {record.treatment_plan && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Treatment Plan</p>
                    <p className="text-gray-600">{record.treatment_plan}</p>
                  </div>
                )}

                {record.vitals && record.vitals.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Vitals
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-md">
                      {record.vitals[0].temperature && (
                        <VitalStat label="Temperature" value={`${record.vitals[0].temperature}°F`} />
                      )}
                      {record.vitals[0].blood_pressure_systolic && (
                        <VitalStat
                          label="Blood Pressure"
                          value={`${record.vitals[0].blood_pressure_systolic}/${record.vitals[0].blood_pressure_diastolic}`}
                        />
                      )}
                      {record.vitals[0].heart_rate && (
                        <VitalStat label="Heart Rate" value={`${record.vitals[0].heart_rate} bpm`} />
                      )}
                      {record.vitals[0].oxygen_saturation && (
                        <VitalStat label="O2 Saturation" value={`${record.vitals[0].oxygen_saturation}%`} />
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function VitalStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}
