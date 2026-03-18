'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bed, Plus } from 'lucide-react'

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdmissions()
  }, [])

  async function loadAdmissions() {
    try {
      const { data, error } = await supabase
        .from('bed_assignments')
        .select(`
          *,
          bed:beds(
            bed_number,
            bed_type,
            ward:wards(name, floor_number)
          ),
          patient:patients(
            user:users(first_name, last_name, phone)
          )
        `)
        .order('admitted_at', { ascending: false })

      if (error) throw error
      setAdmissions(data || [])
    } catch (error) {
      console.error('Error loading admissions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading admissions...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Admissions</h1>
          <p className="text-gray-600 mt-1">Manage hospital admissions and bed assignments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Admit Patient
        </Button>
      </div>

      <div className="grid gap-4">
        {admissions.map((admission) => (
          <Card key={admission.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {admission.patient?.user?.first_name} {admission.patient?.user?.last_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{admission.patient?.user?.phone}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  admission.discharged_at ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                }`}>
                  {admission.discharged_at ? 'Discharged' : 'Active'}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Ward</p>
                  <p className="font-semibold">{admission.bed?.ward?.name}</p>
                  <p className="text-xs text-gray-500">Floor {admission.bed?.ward?.floor_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bed</p>
                  <p className="font-semibold">{admission.bed?.bed_number}</p>
                  <p className="text-xs text-gray-500">{admission.bed?.bed_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Admitted</p>
                  <p className="font-semibold">{new Date(admission.admitted_at).toLocaleDateString()}</p>
                  {admission.discharged_at && (
                    <p className="text-xs text-gray-500">
                      Discharged: {new Date(admission.discharged_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              {admission.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-700">{admission.notes}</p>
                </div>
              )}
              {!admission.discharged_at && (
                <div className="mt-4">
                  <Button variant="outline" size="sm">
                    Discharge Patient
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
