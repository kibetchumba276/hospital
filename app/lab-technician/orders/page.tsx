'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flask, User, CheckCircle, Clock, Search } from 'lucide-react'

export default function LabOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect() {
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
            user:users(first_name, last_name, phone_number)
          ),
          doctor:staff!lab_orders_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error loading lab orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('lab_orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      await loadOrders()
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order')
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' ||
      order.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.test_name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'pending') {
      return matchesSearch && order.status === 'pending'
    } else if (filter === 'completed') {
      return matchesSearch && order.status === 'completed'
    }
    return matchesSearch
  })

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Lab Orders</h1>
        <p className="text-gray-600 mt-1">Process laboratory test orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={filter === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilter('pending')}
                size="sm"
              >
                Pending ({orders.filter(o => o.status === 'pending').length})
              </Button>
              <Button
                variant={filter === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilter('completed')}
                size="sm"
              >
                Completed ({orders.filter(o => o.status === 'completed').length})
              </Button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No lab orders found
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const patientName = `${order.patient?.user?.first_name || 'Unknown'} ${order.patient?.user?.last_name || 'Patient'}`
            const doctorName = `Dr. ${order.doctor?.user?.first_name || ''} ${order.doctor?.user?.last_name || 'Unknown'}`

            return (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
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
                        <p className="text-sm text-gray-600">Ordered by: {doctorName}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {order.notes && (
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <p className="font-medium">Notes:</p>
                        <p className="text-gray-600">{order.notes}</p>
                      </div>
                    )}

                    {order.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'in_progress')}
                        >
                          Start Processing
                        </Button>
                      </div>
                    )}

                    {order.status === 'in_progress' && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={() => updateStatus(order.id, 'completed')}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark Complete
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
