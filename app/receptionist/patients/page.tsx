'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, Search, Phone, Mail } from 'lucide-react'

export default function ReceptionistPatientsPage() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPatients()
  }, [])

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          user:users(first_name, last_name, email, phone_number, date_of_birth)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error loading patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(p =>
    searchTerm === '' ||
    p.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.medical_record_number?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
        <p className="text-gray-600 mt-1">View and search patient information</p>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md"
        />
      </div>

      <div className="grid gap-4">
        {filteredPatients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No patients found
            </CardContent>
          </Card>
        ) : (
          filteredPatients.map((patient) => {
            const name = `${patient.user?.first_name || 'Unknown'} ${patient.user?.last_name || 'Patient'}`
            
            return (
              <Card key={patient.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-lg">{name}</p>
                          <p className="text-sm text-gray-600">MRN: {patient.medical_record_number || 'N/A'}</p>
                          <p className="text-sm text-gray-600">Blood Type: {patient.blood_type || 'Unknown'}</p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          ACTIVE
                        </span>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {patient.user?.phone_number || 'No phone'}
                        </p>
                        <p className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {patient.user?.email || 'No email'}
                        </p>
                        {patient.user?.date_of_birth && (
                          <p className="text-xs text-gray-500">
                            DOB: {new Date(patient.user.date_of_birth).toLocaleDateString()}
                          </p>
                        )}
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
