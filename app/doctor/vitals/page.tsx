'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

export default function VitalsPage() {
  const [vitals, setVitals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVitals()
  }, [])

  async function loadVitals() {
    try {
      const { data, error } = await supabase
        .from('vitals')
        .select(`
          *,
          patient:patients(
            user:users(first_name, last_name)
          )
        `)
        .order('recorded_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setVitals(data || [])
    } catch (error) {
      console.error('Error loading vitals:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading vitals...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vitals Monitoring</h1>
        <p className="text-gray-600 mt-1">Monitor patient vital signs</p>
      </div>

      <div className="grid gap-4">
        {vitals.map((vital) => (
          <Card key={vital.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">
                  {vital.patient?.user?.first_name} {vital.patient?.user?.last_name}
                </CardTitle>
                <span className="text-sm text-gray-600">
                  {new Date(vital.recorded_at).toLocaleString()}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {vital.temperature && (
                  <div className="p-3 bg-red-50 rounded">
                    <p className="text-xs text-gray-600">Temperature</p>
                    <p className="text-xl font-bold text-red-700">{vital.temperature}°F</p>
                  </div>
                )}
                {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                  <div className="p-3 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Blood Pressure</p>
                    <p className="text-xl font-bold text-blue-700">
                      {vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic}
                    </p>
                  </div>
                )}
                {vital.heart_rate && (
                  <div className="p-3 bg-pink-50 rounded">
                    <p className="text-xs text-gray-600">Heart Rate</p>
                    <p className="text-xl font-bold text-pink-700">{vital.heart_rate} bpm</p>
                  </div>
                )}
                {vital.oxygen_saturation && (
                  <div className="p-3 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">O2 Saturation</p>
                    <p className="text-xl font-bold text-green-700">{vital.oxygen_saturation}%</p>
                  </div>
                )}
                {vital.respiratory_rate && (
                  <div className="p-3 bg-purple-50 rounded">
                    <p className="text-xs text-gray-600">Respiratory Rate</p>
                    <p className="text-xl font-bold text-purple-700">{vital.respiratory_rate}/min</p>
                  </div>
                )}
                {vital.weight && (
                  <div className="p-3 bg-yellow-50 rounded">
                    <p className="text-xs text-gray-600">Weight</p>
                    <p className="text-xl font-bold text-yellow-700">{vital.weight} kg</p>
                  </div>
                )}
                {vital.height && (
                  <div className="p-3 bg-indigo-50 rounded">
                    <p className="text-xs text-gray-600">Height</p>
                    <p className="text-xl font-bold text-indigo-700">{vital.height} cm</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
