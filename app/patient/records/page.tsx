'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Activity, Pill } from 'lucide-react'

interface MedicalRecord {
  id: string
  visit_date: string
  chief_complaint: string
  diagnosis: string
  treatment_plan: string
  notes: string
  doctor: {
    first_name: string
    last_name: string
    specialization: string
  }
  vitals: Array<{
    temperature: number
    blood_pressure_systolic: number
    blood_pressure_diastolic: number
    heart_rate: number
    weight: number
  }>
}

export default function PatientRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  async function fetchRecords() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) return

      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          id,
          visit_date,
          chief_complaint,
          diagnosis,
          treatment_plan,
          notes,
          staff!inner (
            users!inner (
              first_name,
              last_name
            ),
            specialization
          ),
          vitals (
            temperature,
            blood_pressure_systolic,
            blood_pressure_diastolic,
            heart_rate,
            weight
          )
        `)
        .eq('patient_id', patientData.id)
        .order('visit_date', { ascending: false })

      if (error) throw error

      const formattedRecords = data?.map((record: any) => ({
        id: record.id,
        visit_date: record.visit_date,
        chief_complaint: record.chief_complaint,
        diagnosis: record.diagnosis,
        treatment_plan: record.treatment_plan,
        notes: record.notes,
        doctor: {
          first_name: record.staff.users.first_name,
          last_name: record.staff.users.last_name,
          specialization: record.staff.specialization,
        },
        vitals: record.vitals || [],
      })) || []

      setRecords(formattedRecords)
    } catch (error: any) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Medical Records</h1>
        <p className="text-gray-600 mt-1">View your medical history and diagnoses</p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No medical records yet</p>
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
                      Visit on {new Date(record.visit_date).toLocaleDateString()}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Dr. {record.doctor.first_name} {record.doctor.last_name} - {record.doctor.specialization}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {record.vitals.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="h-5 w-5 text-primary-600" />
                      <h4 className="font-medium text-gray-900">Vitals</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {record.vitals[0].temperature && (
                        <div>
                          <span className="text-gray-600">Temperature:</span>
                          <p className="font-medium">{record.vitals[0].temperature}°F</p>
                        </div>
                      )}
                      {record.vitals[0].blood_pressure_systolic && (
                        <div>
                          <span className="text-gray-600">Blood Pressure:</span>
                          <p className="font-medium">
                            {record.vitals[0].blood_pressure_systolic}/{record.vitals[0].blood_pressure_diastolic}
                          </p>
                        </div>
                      )}
                      {record.vitals[0].heart_rate && (
                        <div>
                          <span className="text-gray-600">Heart Rate:</span>
                          <p className="font-medium">{record.vitals[0].heart_rate} bpm</p>
                        </div>
                      )}
                      {record.vitals[0].weight && (
                        <div>
                          <span className="text-gray-600">Weight:</span>
                          <p className="font-medium">{record.vitals[0].weight} kg</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Chief Complaint:</h4>
                  <p className="text-gray-700">{record.chief_complaint}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Diagnosis:</h4>
                  <p className="text-gray-700">{record.diagnosis}</p>
                </div>

                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="h-5 w-5 text-primary-600" />
                    <h4 className="font-medium text-gray-900">Treatment Plan:</h4>
                  </div>
                  <p className="text-gray-700">{record.treatment_plan}</p>
                </div>

                {record.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Additional Notes:</h4>
                    <p className="text-gray-600 text-sm">{record.notes}</p>
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
