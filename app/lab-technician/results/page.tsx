'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flask, User, Upload } from 'lucide-react'

export default function LabResultsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [results, setResults] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    try {
      const { data, error } = await supabase
        .from('lab_orders')
        .select(`
          *,
          patient:patients(
            medical_record_number,
            user:users(first_name, last_name)
          ),
          doctor:staff!lab_orders_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function submitResults(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedOrder) return

    try {
      const { error } = await supabase
        .from('lab_orders')
        .update({ 
          status: 'completed',
          results: results,
          completed_at: new Date().toISOString()
        })
        .eq('id', selectedOrder.id)

      if (error) throw error
      
      alert('Results submitted successfully!')
      setSelectedOrder(null)
      setResults('')
      await loadOrders()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Submit Results</h1>
        <p className="text-gray-600 mt-1">Upload lab test results</p>
      </div>

      {selectedOrder ? (
        <Card>
          <CardHeader>
            <CardTitle>Submit Results for {selectedOrder.test_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submitResults} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Patient: {selectedOrder.patient?.user?.first_name} {selectedOrder.patient?.user?.last_name}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  MRN: {selectedOrder.patient?.medical_record_number}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Test Results</label>
                <textarea
                  required
                  value={results}
                  onChange={(e) => setResults(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={10}
                  placeholder="Enter detailed test results..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Results
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setSelectedOrder(null)
                  setResults('')
                }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                No tests in progress
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const patientName = `${order.patient?.user?.first_name || 'Unknown'} ${order.patient?.user?.last_name || 'Patient'}`

              return (
                <Card key={order.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Flask className="h-5 w-5 text-primary-600" />
                          <h3 className="font-semibold text-lg">{order.test_name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">
                          <User className="inline h-3 w-3 mr-1" />
                          {patientName} (MRN: {order.patient?.medical_record_number})
                        </p>
                      </div>
                      <Button onClick={() => setSelectedOrder(order)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit Results
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
