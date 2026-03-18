'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Download } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) return

      const { data } = await supabase
        .from('invoices')
        .select(`
          *,
          items:invoice_items(*),
          payments(*)
        `)
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      setInvoices(data || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const pendingInvoices = invoices.filter((inv) => inv.payment_status === 'pending')
  const paidInvoices = invoices.filter((inv) => inv.payment_status === 'paid')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
        <p className="text-gray-600 mt-1">Manage your medical bills and payments</p>
      </div>

      {/* Pending Bills */}
      {pendingInvoices.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Bills</h2>
          <div className="space-y-4">
            {pendingInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}

      {/* Paid Bills */}
      {paidInvoices.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          <div className="space-y-4">
            {paidInvoices.map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} isPaid />
            ))}
          </div>
        </div>
      )}

      {invoices.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            No invoices yet
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InvoiceCard({ invoice, isPaid = false }: any) {
  const statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    partially_paid: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Invoice #{invoice.invoice_number}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Date: {formatDate(invoice.created_at)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[invoice.payment_status]}`}>
            {invoice.payment_status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Items</p>
          <div className="space-y-2">
            {invoice.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.description} x {item.quantity}
                </span>
                <span className="font-medium">${item.total_price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total Amount</span>
            <span className="text-2xl font-bold text-primary-600">
              ${invoice.net_amount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Actions */}
        {!isPaid && (
          <div className="flex gap-2">
            <Button className="flex-1">
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        )}

        {isPaid && invoice.payments && invoice.payments.length > 0 && (
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-sm text-green-800">
              Paid on {formatDate(invoice.payments[0].payment_date)} via {invoice.payments[0].payment_method}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
