'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, User, CheckCircle } from 'lucide-react'

export default function PharmacistDispensePage() {
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

  async function dispense(prescriptionId: string) {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: 'dispensed' })
        .eq('id', prescriptionId)

      if (error) throw error
      await loadPrescriptions()
    } catch (error) {
      console.error('Error dispensing:', error)
      alert('Failed to dispense medication')
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dispense Medications</h1>
        <p className="text-gray-600 mt-1">Dispense prescribed medications to patients</p>
      </div>

      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No prescriptions to dispense
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((rx) => {
            const patientName = `${rx.patient?.user?.first_name || 'Unknown'} ${rx.patient?.user?.last_name || 'Patient'}`
            const doctorName = `Dr. ${rx.doctor?.user?.first_name || ''} ${rx.doctor?.user?.last_name || 'Unknown'}`

            return (
              <Card key={rx.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Pill className="h-5 w-5 text-primary-600" />
                          <h3 className="font-semibold text-lg">{rx.medication_name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          <User className="inline h-3 w-3 mr-1" />
                          {patientName} (MRN: {rx.patient?.medical_record_number})
                        </p>
                        <p className="text-sm text-gray-600">Prescribed by: {doctorName}</p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                        READY TO DISPENSE
                      </span>
                    </div>

                    <div className="bg-blue-50 p-3 rounded space-y-1 text-sm">
                      <p><span className="font-medium">Dosage:</span> {rx.dosage}</p>
                      <p><span className="font-medium">Frequency:</span> {rx.frequency}</p>
                      <p><span className="font-medium">Duration:</span> {rx.duration}</p>
                      {rx.instructions && (
                        <p><span className="font-medium">Instructions:</span> {rx.instructions}</p>
                      )}
                    </div>

                    <Button
                      onClick={() => dispense(rx.id)}
                      className="w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Dispense Medication
                    </Button>
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
