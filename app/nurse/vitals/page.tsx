'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Heart, Thermometer, Wind } from 'lucide-react'

export default function NurseVitalsPage() {
  const searchParams = useSearchParams()
  const patientId = searchParams.get('patient')
  
  const [vitals, setVitals] = useState({
    temperature: '',
    blood_pressure: '',
    heart_rate: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    weight: '',
    height: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [recentVitals, setRecentVitals] = useState<any[]>([])

  useEffect(() => {
    if (patientId) {
      loadRecentVitals()
    }
  }, [patientId])

  async function loadRecentVitals() {
    try {
      const { data, error } = await supabase
        .from('vitals')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false })
        .limit(5)

      if (error) throw error
      setRecentVitals(data || [])
    } catch (error) {
      console.error('Error loading vitals:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patientId) {
      alert('No patient selected')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const { error } = await supabase
        .from('vitals')
        .insert({
          patient_id: patientId,
          recorded_by: staffData?.id,
          ...vitals,
          recorded_at: new Date().toISOString()
        })

      if (error) throw error

      alert('Vitals recorded successfully!')
      setVitals({
        temperature: '',
        blood_pressure: '',
        heart_rate: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        weight: '',
        height: '',
        notes: ''
      })
      loadRecentVitals()
    } catch (error: any) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Record Vitals</h1>
        <p className="text-gray-600 mt-1">Record patient vital signs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Vital Signs</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.temperature}
                  onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="36.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={vitals.blood_pressure}
                  onChange={(e) => setVitals({...vitals, blood_pressure: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="120/80"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={vitals.heart_rate}
                  onChange={(e) => setVitals({...vitals, heart_rate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="72"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Respiratory Rate</label>
                <input
                  type="number"
                  value={vitals.respiratory_rate}
                  onChange={(e) => setVitals({...vitals, respiratory_rate: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="16"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  value={vitals.oxygen_saturation}
                  onChange={(e) => setVitals({...vitals, oxygen_saturation: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="98"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.weight}
                  onChange={(e) => setVitals({...vitals, weight: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="70"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={vitals.notes}
                onChange={(e) => setVitals({...vitals, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                rows={3}
                placeholder="Additional observations..."
              />
            </div>
            <Button type="submit" disabled={loading || !patientId}>
              {loading ? 'Recording...' : 'Record Vitals'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {recentVitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Vitals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentVitals.map((vital) => (
                <div key={vital.id} className="border-b pb-3 last:border-0">
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(vital.recorded_at).toLocaleString()}
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <p>Temp: {vital.temperature}°C</p>
                    <p>BP: {vital.blood_pressure}</p>
                    <p>HR: {vital.heart_rate} bpm</p>
                    <p>RR: {vital.respiratory_rate}</p>
                    <p>O2: {vital.oxygen_saturation}%</p>
                    <p>Weight: {vital.weight} kg</p>
                  </div>
                  {vital.notes && (
                    <p className="text-sm text-gray-600 mt-2">{vital.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
