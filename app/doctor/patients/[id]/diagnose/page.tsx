'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function DiagnosePatientPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    diagnosis: '',
    treatmentPlan: '',
    notes: '',
    temperature: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    weight: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchPatient()
  }, [patientId])

  async function fetchPatient() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          user_id,
          blood_group,
          users!inner (
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('id', patientId)
        .single()

      if (error) throw error
      setPatient(data)
    } catch (error: any) {
      console.error('Error fetching patient:', error)
      setError('Failed to load patient information')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      // Get current doctor's staff ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!staffData) throw new Error('Staff record not found')

      // Create medical record
      const { data: medicalRecord, error: recordError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          doctor_id: staffData.id,
          chief_complaint: formData.chiefComplaint,
          diagnosis: formData.diagnosis,
          treatment_plan: formData.treatmentPlan,
          notes: formData.notes,
        })
        .select()
        .single()

      if (recordError) throw recordError

      // Create vitals if provided
      if (formData.temperature || formData.bloodPressureSystolic || formData.heartRate) {
        const { error: vitalsError } = await supabase
          .from('vitals')
          .insert({
            medical_record_id: medicalRecord.id,
            patient_id: patientId,
            temperature: formData.temperature ? parseFloat(formData.temperature) : null,
            blood_pressure_systolic: formData.bloodPressureSystolic ? parseInt(formData.bloodPressureSystolic) : null,
            blood_pressure_diastolic: formData.bloodPressureDiastolic ? parseInt(formData.bloodPressureDiastolic) : null,
            heart_rate: formData.heartRate ? parseInt(formData.heartRate) : null,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            recorded_by: user.id,
          })

        if (vitalsError) throw vitalsError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/doctor/patients')
      }, 2000)

    } catch (error: any) {
      console.error('Error creating medical record:', error)
      setError(error.message || 'Failed to save medical record')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Patient not found</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Patients
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Diagnose Patient</h1>
        <p className="text-gray-600 mt-1">
          {patient.users.first_name} {patient.users.last_name} - {patient.users.email}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            Medical record saved successfully! Redirecting...
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Vitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temperature (°F)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="98.6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BP Systolic
                </label>
                <Input
                  type="number"
                  value={formData.bloodPressureSystolic}
                  onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: e.target.value })}
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  BP Diastolic
                </label>
                <Input
                  type="number"
                  value={formData.bloodPressureDiastolic}
                  onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: e.target.value })}
                  placeholder="80"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Heart Rate (bpm)
                </label>
                <Input
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                  placeholder="72"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="70"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Medical Assessment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chief Complaint *
              </label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[80px]"
                value={formData.chiefComplaint}
                onChange={(e) => setFormData({ ...formData, chiefComplaint: e.target.value })}
                placeholder="Patient's main concern or reason for visit"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Diagnosis *
              </label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[100px]"
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Medical diagnosis"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Plan *
              </label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[100px]"
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                placeholder="Recommended treatment and medications"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[80px]"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional observations or instructions"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={submitting || success}>
            {submitting ? 'Saving...' : success ? 'Saved!' : 'Save Medical Record'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
