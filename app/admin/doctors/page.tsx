'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Mail, Phone, Edit, Trash2 } from 'lucide-react'

interface Doctor {
  id: string
  user_id: string
  staff_number: string
  specialization: string
  license_number: string
  consultation_fee: number
  email: string
  first_name: string
  last_name: string
  phone: string
  is_active: boolean
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    licenseNumber: '',
    consultationFee: '',
    qualification: '',
    experienceYears: '',
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    fetchDoctors()
  }, [])

  async function fetchDoctors() {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          id,
          user_id,
          staff_number,
          specialization,
          license_number,
          consultation_fee,
          users!inner (
            email,
            first_name,
            last_name,
            phone,
            is_active,
            role
          )
        `)
        .eq('users.role', 'doctor')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedDoctors = data?.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        staff_number: item.staff_number,
        specialization: item.specialization,
        license_number: item.license_number,
        consultation_fee: item.consultation_fee,
        email: item.users.email,
        first_name: item.users.first_name,
        last_name: item.users.last_name,
        phone: item.users.phone,
        is_active: item.users.is_active,
      })) || []

      setDoctors(formattedDoctors)
    } catch (error: any) {
      console.error('Error fetching doctors:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateDoctor(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')
    setFormSuccess('')

    try {
      // Generate staff number
      const staffNumber = 'DOC' + Date.now().toString().slice(-6)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      // Wait for auth to settle
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          role: 'doctor',
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
        })

      if (profileError) throw profileError

      // Create staff record
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          user_id: authData.user.id,
          staff_number: staffNumber,
          specialization: formData.specialization,
          license_number: formData.licenseNumber,
          consultation_fee: parseFloat(formData.consultationFee) || 0,
          qualification: formData.qualification || null,
          experience_years: parseInt(formData.experienceYears) || 0,
        })

      if (staffError) throw staffError

      setFormSuccess(`Doctor created successfully! Staff Number: ${staffNumber}`)
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        specialization: '',
        licenseNumber: '',
        consultationFee: '',
        qualification: '',
        experienceYears: '',
      })

      // Refresh list
      setTimeout(() => {
        fetchDoctors()
        setShowForm(false)
        setFormSuccess('')
      }, 2000)

    } catch (error: any) {
      console.error('Error creating doctor:', error)
      setFormError(error.message || 'Failed to create doctor')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleToggleStatus(doctorId: string, userId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      fetchDoctors()
    } catch (error: any) {
      console.error('Error updating status:', error)
    }
  }

  const filteredDoctors = doctors.filter(doctor =>
    doctor.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.staff_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctors Management</h1>
          <p className="text-gray-600 mt-1">Create and manage doctor accounts</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Doctor
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Doctor Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateDoctor} className="space-y-4">
              {formError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {formError}
                </div>
              )}

              {formSuccess && (
                <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                  {formSuccess}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization *
                  </label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Dentist, Cardiologist"
                    required
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    required
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultation Fee ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualification
                  </label>
                  <Input
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="e.g., MBBS, MD"
                    disabled={formLoading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Experience (Years)
                  </label>
                  <Input
                    type="number"
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    disabled={formLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Creating...' : 'Create Doctor Account'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search doctors by name, email, staff number, or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDoctors.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No doctors found</p>
            ) : (
              filteredDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </h3>
                        <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                          {doctor.staff_number}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          doctor.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {doctor.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-primary-600 font-medium mt-1">{doctor.specialization}</p>
                      <div className="flex gap-4 mt-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {doctor.email}
                        </span>
                        {doctor.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {doctor.phone}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span>License: {doctor.license_number}</span>
                        {doctor.consultation_fee > 0 && (
                          <span className="ml-4">Fee: ${doctor.consultation_fee}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(doctor.id, doctor.user_id, doctor.is_active)}
                      >
                        {doctor.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
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
