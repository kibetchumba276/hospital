'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Department = {
  id: string
  name: string
}

const DEFAULT_PASSWORD = '123456'

export default function CreateStaffPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    departmentId: '',
    specialization: '',
    licenseNumber: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [])

  async function loadDepartments() {
    const { data } = await supabase
      .from('departments')
      .select('id, name')
      .eq('is_active', true)
      .order('name')
    
    setDepartments(data || [])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Create auth user with default password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: DEFAULT_PASSWORD,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create user profile with must_change_password flag
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          role: formData.role,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phone || null,
          must_change_password: true,
        })

      if (profileError) throw profileError

      // If doctor or nurse, create staff record
      if (['doctor', 'nurse'].includes(formData.role)) {
        const staffNumber = `${formData.role.toUpperCase().substring(0, 3)}${Date.now().toString().slice(-6)}`
        
        const { error: staffError } = await supabase
          .from('staff')
          .insert({
            user_id: authData.user.id,
            staff_number: staffNumber,
            department_id: formData.departmentId || null,
            specialization: formData.specialization || null,
            license_number: formData.licenseNumber || null,
          })

        if (staffError) throw staffError
      }

      setSuccess(`${formData.role} account created! Default password: ${DEFAULT_PASSWORD}`)
      
      setTimeout(() => {
        router.push('/admin/users')
      }, 3000)

    } catch (error: any) {
      console.error('Error:', error)
      setError(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create Staff Account</h1>
        <p className="text-gray-600 mt-1">Add new staff member to the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                {success}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  disabled={loading}
                >
                  <option value="">Select Role</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="lab_technician">Lab Technician</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {['doctor', 'nurse'].includes(formData.role) && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specialization
                  </label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g., Cardiologist, Pediatrician"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number
                  </label>
                  <Input
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Default Password:</strong> {DEFAULT_PASSWORD}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                User will be required to change password on first login
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
