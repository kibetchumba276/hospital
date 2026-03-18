'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default function BookAppointmentPage() {
  const router = useRouter()
  const [departments, setDepartments] = useState<any[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadDepartments()
  }, [])

  useEffect(() => {
    if (selectedDepartment && selectedDate) {
      findAvailableSlots()
    }
  }, [selectedDepartment, selectedDate])

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

  async function findAvailableSlots() {
    try {
      setAvailableSlots([])
      setSelectedSlot(null)

      // Get all staff in this department
      const { data: staffData } = await supabase
        .from('staff')
        .select(`
          id,
          user_id,
          users!staff_user_id_fkey(first_name, last_name, role)
        `)
        .eq('department_id', selectedDepartment)

      if (!staffData || staffData.length === 0) {
        setError('No staff available in this department')
        return
      }

      // Get all appointments for this date and department
      const staffIds = staffData.map(s => s.id)
      const { data: appointments } = await supabase
        .from('appointments')
        .select('doctor_id, appointment_time')
        .in('doctor_id', staffIds)
        .eq('appointment_date', selectedDate)
        .in('status', ['scheduled', 'confirmed', 'checked_in'])

      // Generate time slots from 9 AM to 5 PM
      const slots = []
      for (let hour = 9; hour < 17; hour++) {
        for (let minute of [0, 30]) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
          
          // Find available staff for this time slot
          const availableStaff = staffData.filter(staff => {
            const isBooked = appointments?.some(
              apt => apt.doctor_id === staff.id && apt.appointment_time === timeStr
            )
            return !isBooked
          })

          if (availableStaff.length > 0) {
            // Pick the first available staff member
            const assignedStaff = availableStaff[0]
            slots.push({
              time: timeStr,
              staffId: assignedStaff.id,
              staffName: `${assignedStaff.users.first_name} ${assignedStaff.users.last_name}`,
              staffRole: assignedStaff.users.role
            })
          }
        }
      }

      setAvailableSlots(slots)
      setError('')
    } catch (error) {
      console.error('Error finding slots:', error)
      setError('Failed to load available slots')
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

      if (!selectedSlot) throw new Error('Please select a time slot')

      const { error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientData.id,
          doctor_id: selectedSlot.staffId,
          appointment_date: selectedDate,
          appointment_time: selectedSlot.time,
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
          <CardTitle>Appointment Details</CardTitle>
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
                  setAvailableSlots([])
                  setSelectedSlot(null)
                }}
                className="w-full h-10 px-3 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Service Type</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                System will automatically assign an available staff member
              </p>
            </div>

            {selectedDepartment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Appointment Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value)
                    setSelectedSlot(null)
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            )}

            {availableSlots.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Available Time Slots
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-md border text-sm ${
                        selectedSlot?.time === slot.time
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
                      }`}
                    >
                      <div className="font-semibold">{slot.time.substring(0, 5)}</div>
                      <div className="text-xs mt-1 opacity-90">
                        {slot.staffName}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedDate && selectedDepartment && availableSlots.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                No available slots for this date. Please try another date.
              </p>
            )}

            {selectedSlot && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
                <p className="text-sm font-medium text-blue-900">Selected Appointment:</p>
                <p className="text-sm text-blue-700 mt-1">
                  Date: {new Date(selectedDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-blue-700">
                  Time: {selectedSlot.time.substring(0, 5)}
                </p>
                <p className="text-sm text-blue-700">
                  Assigned Staff: {selectedSlot.staffName} ({selectedSlot.staffRole})
                </p>
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
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !selectedSlot}
            >
              {loading ? 'Booking...' : 'Book Appointment'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
