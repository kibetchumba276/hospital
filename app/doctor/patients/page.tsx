'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, User, Mail, Phone, FileText, DollarSign, Bed } from 'lucide-react'
import Link from 'next/link'

interface Patient {
  id: string
  user_id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  blood_group: string
  date_of_birth: string
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    fetchPatients()
  }, [])

  async function fetchPatients() {
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
            phone,
            date_of_birth
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedPatients = data?.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        blood_group: item.blood_group,
        email: item.users.email,
        first_name: item.users.first_name,
        last_name: item.users.last_name,
        phone: item.users.phone,
        date_of_birth: item.users.date_of_birth,
      })) || []

      setPatients(formattedPatients)
    } catch (error: any) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
        <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
        <p className="text-gray-600 mt-1">Search and manage patient records</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPatients.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
              </p>
            ) : (
              filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.first_name} {patient.last_name}
                          </h3>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {patient.email}
                            </span>
                            {patient.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {patient.phone}
                              </span>
                            )}
                          </div>
                          {patient.blood_group && (
                            <span className="text-sm text-gray-600 mt-1 inline-block">
                              Blood Group: {patient.blood_group}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/doctor/patients/${patient.id}/diagnose`}>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Diagnose
                        </Button>
                      </Link>
                      <Link href={`/doctor/patients/${patient.id}/bill`}>
                        <Button size="sm" variant="outline">
                          <DollarSign className="h-4 w-4 mr-1" />
                          Bill
                        </Button>
                      </Link>
                      <Link href={`/doctor/patients/${patient.id}/admit`}>
                        <Button size="sm" variant="outline">
                          <Bed className="h-4 w-4 mr-1" />
                          Admit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
