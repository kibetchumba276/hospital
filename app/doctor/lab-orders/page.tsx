'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TestTube, Plus } from 'lucide-react'

export default function LabOrdersPage() {
  const [labTests, setLabTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLabTests()
  }, [])

  async function loadLabTests() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!staffData) return

      const { data, error } = await supabase
        .from('lab_tests')
        .select(`
          *,
          patient:patients(
            user:users(first_name, last_name)
          )
        `)
        .eq('doctor_id', staffData.id)
        .order('requested_at', { ascending: false })

      if (error) throw error
      setLabTests(data || [])
    } catch (error) {
      console.error('Error loading lab tests:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading lab orders...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Orders</h1>
          <p className="text-gray-600 mt-1">Manage laboratory test orders</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Lab Order
        </Button>
      </div>

      <div className="grid gap-4">
        {labTests.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    {test.patient?.user?.first_name} {test.patient?.user?.last_name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{test.test_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  test.status === 'completed' ? 'bg-green-100 text-green-800' :
                  test.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  test.status === 'sample_collected' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {test.status.replace('_', ' ')}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Test Type</p>
                  <p className="font-semibold">{test.test_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested</p>
                  <p className="font-semibold">{new Date(test.requested_at).toLocaleDateString()}</p>
                </div>
              </div>
              {test.results && (
                <div className="mt-4 p-3 bg-green-50 rounded">
                  <p className="text-sm font-semibold text-green-800 mb-2">Results:</p>
                  <p className="text-sm text-gray-700">{test.results}</p>
                </div>
              )}
              {test.notes && (
                <div className="mt-2 p-3 bg-blue-50 rounded">
                  <p className="text-sm text-gray-700">{test.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
