'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, Plus } from 'lucide-react'

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPrescriptions()
  }, [])

  async function loadPrescriptions() {
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
        .from('prescriptions')
        .select(`
          *,
          patient:patients(
            user:users(first_name, last_name)
          ),
          prescription_items(*)
        `)
        .eq('doctor_id', staffData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error loading prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading prescriptions...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
          <p className="text-gray-600 mt-1">Manage patient prescriptions</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>

      <div className="grid gap-4">
        {prescriptions.map((prescription) => (
          <Card key={prescription.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {prescription.patient?.user?.first_name} {prescription.patient?.user?.last_name}
                </CardTitle>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  prescription.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                  prescription.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {prescription.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {prescription.prescription_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                    <Pill className="h-5 w-5 text-primary-600" />
                    <div className="flex-1">
                      <p className="font-semibold">{item.medicine_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.dosage} - {item.frequency} for {item.duration}
                      </p>
                      {item.instructions && (
                        <p className="text-xs text-gray-500 mt-1">{item.instructions}</p>
                      )}
                    </div>
                    <span className="text-sm font-semibold">Qty: {item.quantity}</span>
                  </div>
                ))}
              </div>
              {prescription.notes && (
                <div className="mt-4 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-700">{prescription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
