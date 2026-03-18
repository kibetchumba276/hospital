'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, User, Clock, CheckCircle } from 'lucide-react'

export default function NurseMedicationsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPrescriptions()
  }, [])

  async function loadPrescriptions() {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select(`
          *,
          patient:patients(
            medical_record_number,
            user:users(first_name, last_name)
          ),
          doctor:staff!prescriptions_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error loading prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Active Medications</h1>
        <p className="text-gray-600 mt-1">Monitor patient medications</p>
      </div>

      <div className="grid gap-4">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No active prescriptions
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((rx) => {
            const patientName = `${rx.patient?.user?.first_name || 'Unknown'} ${rx.patient?.user?.last_name || 'Patient'}`
            const doctorName = `Dr. ${rx.doctor?.user?.first_name || ''} ${rx.doctor?.user?.last_name || 'Unknown'}`

            return (
              <Card key={rx.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="h-5 w-5 text-primary-600" />
                        {rx.medication_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        <User className="inline h-3 w-3 mr-1" />
                        {patientName} (MRN: {rx.patient?.medical_record_number})
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      ACTIVE
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Dosage:</span> {rx.dosage}</p>
                    <p><span className="font-medium">Frequency:</span> {rx.frequency}</p>
                    <p><span className="font-medium">Duration:</span> {rx.duration}</p>
                    <p><span className="font-medium">Prescribed by:</span> {doctorName}</p>
                    {rx.instructions && (
                      <p className="text-gray-600 bg-gray-50 p-2 rounded">
                        <span className="font-medium">Instructions:</span> {rx.instructions}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
