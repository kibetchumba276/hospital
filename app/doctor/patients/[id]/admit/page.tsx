'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Bed } from 'lucide-react'

interface BedInfo {
  id: string
  bed_number: string
  bed_type: string
  daily_rate: number
  status: string
  ward: {
    name: string
    floor_number: number
  }
}

export default function AdmitPatientPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [patient, setPatient] = useState<any>(null)
  const [beds, setBeds] = useState<BedInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBed, setSelectedBed] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchData()
  }, [patientId])

  async function fetchData() {
    try {
      // Fetch patient
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select(`
          id,
          user_id,
          users!inner (
            email,
            first_name,
            last_name,
            phone
          )
        `)
        .eq('id', patientId)
        .single()

      if (patientError) throw patientError
      setPatient(patientData)

      // Fetch available beds
      const { data: bedsData, error: bedsError } = await supabase
        .from('beds')
        .select(`
          id,
          bed_number,
          bed_type,
          daily_rate,
          status,
          wards!inner (
            name,
            floor_number
          )
        `)
        .eq('status', 'available')
        .order('bed_number')

      if (bedsError) throw bedsError
      
      const formattedBeds = bedsData?.map((bed: any) => ({
        id: bed.id,
        bed_number: bed.bed_number,
        bed_type: bed.bed_type,
        daily_rate: bed.daily_rate,
        status: bed.status,
        ward: bed.wards
      })) || []

      setBeds(formattedBeds)
    } catch (error: any) {
      console.error('Error fetching data:', error)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create bed assignment
      const { error: assignmentError } = await supabase
        .from('bed_assignments')
        .insert({
          bed_id: selectedBed,
          patient_id: patientId,
          admitted_by: user.id,
          notes: notes || null,
        })

      if (assignmentError) throw assignmentError

      // Update bed status to occupied
      const { error: bedError } = await supabase
        .from('beds')
        .update({ status: 'occupied' })
        .eq('id', selectedBed)

      if (bedError) throw bedError

      setSuccess(true)
      setTimeout(() => {
        router.push('/doctor/patients')
      }, 2000)

    } catch (error: any) {
      console.error('Error admitting patient:', error)
      setError(error.message || 'Failed to admit patient')
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
        <h1 className="text-3xl font-bold text-gray-900">Admit Patient</h1>
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
            Patient admitted successfully! Redirecting...
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Available Beds</CardTitle>
          </CardHeader>
          <CardContent>
            {beds.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No beds available at the moment
              </p>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {beds.map((bed) => (
                  <div
                    key={bed.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedBed === bed.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                    onClick={() => setSelectedBed(bed.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <Bed className="h-5 w-5 text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          Bed {bed.bed_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {bed.ward.name} - Floor {bed.ward.floor_number}
                        </p>
                        <p className="text-sm text-gray-600">
                          Type: {bed.bed_type || 'Standard'}
                        </p>
                        {bed.daily_rate > 0 && (
                          <p className="text-sm font-medium text-primary-600 mt-1">
                            ${bed.daily_rate}/day
                          </p>
                        )}
                      </div>
                      {selectedBed === bed.id && (
                        <div className="h-6 w-6 rounded-full bg-primary-600 flex items-center justify-center">
                          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedBed && (
          <Card>
            <CardHeader>
              <CardTitle>Admission Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full border rounded-md p-2 min-h-[100px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter admission notes, reason for admission, special instructions, etc."
              />
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={!selectedBed || submitting || success}>
            {submitting ? 'Admitting...' : success ? 'Admitted!' : 'Admit Patient'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
