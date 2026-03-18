'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'

const appointmentSchema = z.object({
  doctor_id: z.string().uuid('Please select a doctor'),
  appointment_date: z.string().min(1, 'Date is required'),
  appointment_time: z.string().min(1, 'Time is required'),
  reason_for_visit: z.string().min(10, 'Please provide a reason (min 10 characters)'),
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface Doctor {
  id: string
  user: {
    first_name: string
    last_name: string
  }
  specialization: string
}

interface TimeSlot {
  time: string
  available: boolean
}

export function AppointmentBookingForm({ patientId }: { patientId: string }) {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
  })

  const selectedDoctorId = watch('doctor_id')
  const selectedDate = watch('appointment_date')

  // Fetch doctors on component mount
  useState(() => {
    fetchDoctors()
  })

  async function fetchDoctors() {
    const { data, error } = await supabase
      .from('staff')
      .select('id, user:users(first_name, last_name), specialization')
      .eq('user.role', 'doctor')
      .eq('user.is_active', true)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load doctors',
        variant: 'destructive',
      })
      return
    }

    setDoctors(data as unknown as Doctor[])
  }

  // Fetch available slots when doctor and date are selected
  async function fetchAvailableSlots() {
    if (!selectedDoctorId || !selectedDate) return

    setLoading(true)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-available-slots?doctor_id=${selectedDoctorId}&date=${selectedDate}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
        }
      )

      const slots = await response.json()
      setAvailableSlots(slots)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load available slots',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Trigger slot fetch when doctor or date changes
  useState(() => {
    if (selectedDoctorId && selectedDate) {
      fetchAvailableSlots()
    }
  })

  async function onSubmit(data: AppointmentFormData) {
    setLoading(true)
    try {
      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        doctor_id: data.doctor_id,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        reason_for_visit: data.reason_for_visit,
        status: 'scheduled',
      })

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Appointment booked successfully!',
      })

      // Reset form or redirect
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to book appointment',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="doctor_id">Select Doctor</Label>
        <Select onValueChange={(value) => setValue('doctor_id', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.id} value={doctor.id}>
                Dr. {doctor.user.first_name} {doctor.user.last_name} - {doctor.specialization}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.doctor_id && (
          <p className="text-sm text-red-500">{errors.doctor_id.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="appointment_date">Appointment Date</Label>
        <Input
          type="date"
          {...register('appointment_date')}
          min={new Date().toISOString().split('T')[0]}
        />
        {errors.appointment_date && (
          <p className="text-sm text-red-500">{errors.appointment_date.message}</p>
        )}
      </div>

      {availableSlots.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="appointment_time">Available Time Slots</Label>
          <Select onValueChange={(value) => setValue('appointment_time', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a time" />
            </SelectTrigger>
            <SelectContent>
              {availableSlots
                .filter((slot) => slot.available)
                .map((slot) => (
                  <SelectItem key={slot.time} value={slot.time}>
                    {slot.time}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.appointment_time && (
            <p className="text-sm text-red-500">{errors.appointment_time.message}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="reason_for_visit">Reason for Visit</Label>
        <textarea
          {...register('reason_for_visit')}
          className="w-full min-h-[100px] px-3 py-2 border rounded-md"
          placeholder="Describe your symptoms or reason for visit..."
        />
        {errors.reason_for_visit && (
          <p className="text-sm text-red-500">{errors.reason_for_visit.message}</p>
        )}
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Booking...' : 'Book Appointment'}
      </Button>
    </form>
  )
}
