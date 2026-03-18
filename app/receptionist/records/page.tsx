'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Search } from 'lucide-react'

export default function ReceptionistRecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadRecords()
  }, [])

  async function loadRecords() {
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          patient:patients(
            medical_record_number,
            user:users(first_name, last_name)
          ),
          doctor:staff!medical_records_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Error loading records:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = records.filter(r =>
    searchTerm === '' ||
    r.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.patient?.medical_record_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        <p className="text-gray-600 mt-1">View patient medical records</p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search records..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md"
        />
      </div>

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No records found
            </CardContent>
          </Card>
        ) : (
          filteredRecords.map((record) => {
            const patientName = `${record.patient?.user?.first_name || 'Unknown'} ${record.patient?.user?.last_name || 'Patient'}`
            const doctorName = `Dr. ${record.doctor?.user?.first_name || ''} ${record.doctor?.user?.last_name || 'Unknown'}`

            return (
              <Card key={record.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary-600 mt-1" />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{patientName}</p>
                          <p className="text-sm text-gray-600">MRN: {record.patient?.medical_record_number}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(record.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                        <p><span className="font-medium">Diagnosis:</span> {record.diagnosis}</p>
                        <p><span className="font-medium">Treatment:</span> {record.treatment}</p>
                        <p><span className="font-medium">Doctor:</span> {doctorName}</p>
                      </div>
                    </div>
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
