'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Search, User, CheckCircle } from 'lucide-react'

export default function ReceptionistBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          patient:patients(
            medical_record_number,
            user:users(first_name, last_name, phone_number)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  async function markAsPaid(invoiceId: string) {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          payment_status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', invoiceId)

      if (error) throw error
      await loadInvoices()
    } catch (error) {
      console.error('Error updating invoice:', error)
      alert('Failed to update invoice')
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = searchTerm === '' ||
      inv.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'pending') {
      return matchesSearch && inv.payment_status === 'pending'
    } else if (filter === 'paid') {
      return matchesSearch && inv.payment_status === 'paid'
    }
    return matchesSearch
  })

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
        <p className="text-gray-600 mt-1">Manage patient invoices and payments</p>
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
                Pending ({invoices.filter(i => i.payment_status === 'pending').length})
              </Button>
              <Button
                variant={filter === 'paid' ? 'default' : 'outline'}
                onClick={() => setFilter('paid')}
                size="sm"
              >
                Paid ({invoices.filter(i => i.payment_status === 'paid').length})
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
        {filteredInvoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No invoices found
            </CardContent>
          </Card>
        ) : (
          filteredInvoices.map((invoice) => {
            const patientName = `${invoice.patient?.user?.first_name || 'Unknown'} ${invoice.patient?.user?.last_name || 'Patient'}`

            return (
              <Card key={invoice.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary-600" />
                        <div>
                          <p className="font-semibold text-lg">{patientName}</p>
                          <p className="text-sm text-gray-600">MRN: {invoice.patient?.medical_record_number}</p>
                        </div>
                      </div>
                      <div className="ml-7 text-sm text-gray-600">
                        <p>Invoice Date: {new Date(invoice.created_at).toLocaleDateString()}</p>
                        {invoice.payment_date && (
                          <p>Payment Date: {new Date(invoice.payment_date).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-2xl font-bold text-primary-600">
                        ${parseFloat(invoice.total_amount).toFixed(2)}
                      </p>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${
                        invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {invoice.payment_status.toUpperCase()}
                      </span>
                      {invoice.payment_status === 'pending' && (
                        <div>
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(invoice.id)}
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        </div>
                      )}
                    </div>
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
