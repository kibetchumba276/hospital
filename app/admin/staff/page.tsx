'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Search, Eye, Phone, Mail, Building2 } from 'lucide-react'

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          user:users(
            id,
            email,
            first_name,
            last_name,
            phone_number,
            role,
            created_at
          ),
          department:departments(
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaff(data || [])
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStaff = staff.filter(member => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = (
      member.user?.first_name?.toLowerCase().includes(searchLower) ||
      member.user?.last_name?.toLowerCase().includes(searchLower) ||
      member.user?.email?.toLowerCase().includes(searchLower) ||
      member.user?.phone_number?.includes(searchTerm) ||
      member.staff_number?.toLowerCase().includes(searchLower)
    )
    
    const matchesRole = roleFilter === 'all' || member.user?.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const roleStats = {
    doctor: staff.filter(s => s.user?.role === 'doctor').length,
    nurse: staff.filter(s => s.user?.role === 'nurse').length,
    pharmacist: staff.filter(s => s.user?.role === 'pharmacist').length,
    lab_technician: staff.filter(s => s.user?.role === 'lab_technician').length,
    receptionist: staff.filter(s => s.user?.role === 'receptionist').length,
  }

  if (loading) {
    return <div>Loading staff...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Profiles</h1>
          <p className="text-gray-600 mt-1">View and manage all staff members</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Doctors</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{roleStats.doctor}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Nurses</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{roleStats.nurse}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pharmacists</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{roleStats.pharmacist}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Lab Techs</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{roleStats.lab_technician}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Receptionists</p>
              <p className="text-2xl font-bold text-pink-600 mt-1">{roleStats.receptionist}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Staff ({filteredStaff.length})
            </CardTitle>
            <div className="flex gap-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Roles</option>
                <option value="doctor">Doctors</option>
                <option value="nurse">Nurses</option>
                <option value="pharmacist">Pharmacists</option>
                <option value="lab_technician">Lab Technicians</option>
                <option value="receptionist">Receptionists</option>
              </select>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Staff #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Contact</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Specialization</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-500">
                      {searchTerm || roleFilter !== 'all' ? 'No staff found matching your filters' : 'No staff members yet'}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-gray-600">
                          {member.staff_number || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.user?.first_name} {member.user?.last_name}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.user?.email}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.user?.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                          member.user?.role === 'nurse' ? 'bg-green-100 text-green-800' :
                          member.user?.role === 'pharmacist' ? 'bg-purple-100 text-purple-800' :
                          member.user?.role === 'lab_technician' ? 'bg-orange-100 text-orange-800' :
                          'bg-pink-100 text-pink-800'
                        }`}>
                          {member.user?.role?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="h-3 w-3" />
                          {member.department?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="h-3 w-3" />
                          {member.user?.phone_number || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {member.specialization || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            alert(`View details for ${member.user?.first_name} ${member.user?.last_name}`)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
