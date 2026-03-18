'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'
import Link from 'next/link'

export default function BookAppointmentPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [nextAvailableSlot, setNextAvailableSlot] = useState<any>(null)

  useEffect(() => {
    loadDepartments()
  }, [])

  useEffect(() => {
    if (selectedDepartment) {
      findNextAvailableSlot()
    }
  }, [selectedDepartment])

  async function loadDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, description')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setDepartments(data || [])
    } catch (error) {
      console.error('Error loading departments:', error)
    }
  }

  async function findNextAvailableSlot() {
    setSearching(true)
    setNextAvailableSlot(null)
    setError('')

    try {
      // Get all staff in this department
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select(`
          id,
          user_id
        `)
        .eq('department_id', selectedDepartment)

      if (staffError) throw staffError

      if (!staffData || staffData.length === 0) {
        setError('No staff available in this department. Please contact admin.')
        setSearching(false)
        return
      }

      // Get user details for staff
      const userIds = staffData.map(s => s.user_id)
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .in('id', userIds)

      // Combine staff with user data
      const staffWithUsers = staffData.map(staff => {
        const user = usersData?.find(u => u.id === staff.user_id)
        return {
          ...staff,
          user: user || { first_name: 'Unknown', last_name: 'Staff', role: 'staff' }
        }
      })

      // Start searching from today
      const today = new Date()
      const maxDaysToSearch = 30 // Search up to 30 days ahead
      
      for (let dayOffset = 0; dayOffset < maxDaysToSearch; dayOffset++) {
        const searchDate = new Date(today)
        searchDate.setDate(today.getDate() + dayOffset)
        const dateStr = searchDate.toISOString().split('T')[0]

        // Get all appointments for this date
        const staffIds = staffWithUsers.map(s => s.id)
        const { data: appointments } = await supabase
          .from('appointments')
          .select('doctor_id, appointment_time')
          .in('doctor_id', staffIds)
          .eq('appointment_date', dateStr)
          .in('status', ['scheduled', 'confirmed', 'checked_in'])

        // Working hours: 8 AM to 5 PM (each appointment is 1 hour)
        // Last appointment starts at 4 PM (ends at 5 PM)
        for (let hour = 8; hour < 17; hour++) {
          const timeStr = `${hour.toString().padStart(2, '0')}:00:00`
          
          // Find available staff for this time slot
          for (const staff of staffWithUsers) {
            const isBooked = appointments?.some(
              apt => apt.doctor_id === staff.id && apt.appointment_time === timeStr
            )

            if (!isBooked) {
              // Found available slot!
              setNextAvailableSlot({
                date: dateStr,
                time: timeStr,
                staffId: staff.id,
                staffName: `${staff.user.first_name} ${staff.user.last_name}`,
                staffRole: staff.user.role,
                displayDate: searchDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }),
                displayTime: `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`
              })
              setSearching(false)
              return
            }
          }
        }
      }

      // If we get here, no slots found in 30 days
      setError('No available appointments in the next 30 days. Please contact the hospital.')
      setSearching(false)

    } catch (error: any) {
      console.error('Error finding slot:', error)
      setError('Failed to find available appointment. Please try again.')
      setSearching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) throw new Error('Patient profile not found')

      if (!nextAvailableSlot) throw new Error('No appointment slot available')

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientData.id,
          doctor_id: nextAvailableSlot.staffId,
          appointment_date: nextAvailableSlot.date,
          appointment_time: nextAvailableSlot.time,
          reason_for_visit: reason,
          status: 'scheduled',
        })

      if (insertError) throw insertError

      setSuccess('Appointment booked successfully!')
      setTimeout(() => {
        router.push('/patient/appointments')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to book appointment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/patient/appointments" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Appointments
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Book New Appointment</h1>
        <p className="text-gray-600 mt-1">Select service type and we'll assign an available staff member</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Service Type / Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value)
                  setNextAvailableSlot(null)
                }}
                className="w-full h-10 px-3 border border-gray-300 rounded-md"
                required
                disabled={loading || searching}
              >
                <option value="">Select Service Type</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                System will automatically find the next available appointment
              </p>
            </div>

            {searching && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-blue-800">
                    Searching for next available appointment...
                  </p>
                </div>
              </div>
            )}

            {nextAvailableSlot && !searching && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-md space-y-3">
                <p className="text-sm font-semibold text-green-900">
                  ✓ Next Available Appointment Found!
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-green-700 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Date</p>
                      <p className="text-sm text-green-700">{nextAvailableSlot.displayDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-green-700 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Time</p>
                      <p className="text-sm text-green-700">{nextAvailableSlot.displayTime}</p>
                      <p className="text-xs text-green-600">Duration: 1 hour</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-green-700 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Assigned Staff</p>
                      <p className="text-sm text-green-700">
                        {nextAvailableSlot.staffName} ({nextAvailableSlot.staffRole})
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Visit
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Describe your symptoms or reason for visit..."
                required
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || searching || !nextAvailableSlot}
            >
              {loading ? 'Booking...' : searching ? 'Finding Slot...' : 'Confirm Appointment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
