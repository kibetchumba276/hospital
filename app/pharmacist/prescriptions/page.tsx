'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pill, User, CheckCircle, XCircle, Search } from 'lucide-react'

export default function PharmacistPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')

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
            user:users(first_name, last_name, phone_number)
          ),
          doctor:staff!prescriptions_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPrescriptions(data || [])
    } catch (error) {
      console.error('Error loading prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(prescriptionId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({ status: newStatus })
        .eq('id', prescriptionId)

      if (error) throw error
      await loadPrescriptions()
    } catch (error) {
      console.error('Error updating prescription:', error)
      alert('Failed to update prescription')
    }
  }

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = searchTerm === '' ||
      rx.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rx.medication_name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'pending') {
      return matchesSearch && rx.status === 'active'
    } else if (filter === 'dispensed') {
      return matchesSearch && rx.status === 'dispensed'
    }
    return matchesSearch
  })

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
        <p className="text-gray-600 mt-1">Review and dispense medications</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                size="sm"
              >
                Pending ({prescriptions.filter(r => r.status === 'active').length})
              </Button>
              <Button
                variant={filter === 'dispensed' ? 'default' : 'outline'}
                onClick={() => setFilter('dispensed')}
                size="sm"
              >
                Dispensed ({prescriptions.filter(r => r.status === 'dispensed').length})
              </Button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {filteredPrescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No prescriptions found
            </CardContent>
          </Card>
        ) : (
          filteredPrescriptions.map((rx) => {
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
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        rx.status === 'active' ? 'bg-yellow-100 text-yellow-800' :
                        rx.status === 'dispensed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {rx.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
                      <p><span className="font-medium">Dosage:</span> {rx.dosage}</p>
                      <p><span className="font-medium">Frequency:</span> {rx.frequency}</p>
                      <p><span className="font-medium">Duration:</span> {rx.duration}</p>
                      {rx.instructions && (
                        <p><span className="font-medium">Instructions:</span> {rx.instructions}</p>
                      )}
                    </div>

                    {rx.status === 'active' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(rx.id, 'dispensed')}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Dispensed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(rx.id, 'cancelled')}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Cancel
                        </Button>
                      </div>
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
