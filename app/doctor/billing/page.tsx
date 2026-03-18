'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Receipt, Plus } from 'lucide-react'
import Link from 'next/link'

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
            user:users(first_name, last_name, email)
          ),
          invoice_items(*)
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setInvoices(data || [])
    } catch (error) {
      console.error('Error loading invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading billing information...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-gray-600 mt-1">Manage patient billing and invoices</p>
        </div>
        <Link href="/doctor/billing/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {invoices.map((invoice) => (
          <Card key={invoice.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">
                    Invoice #{invoice.invoice_number}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {invoice.patient?.user?.first_name} {invoice.patient?.user?.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">
                    ${invoice.net_amount?.toFixed(2)}
                  </p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    invoice.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.payment_status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                    invoice.payment_status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {invoice.payment_status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoice.invoice_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-semibold">{item.description}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity} × ${item.unit_price}</p>
                    </div>
                    <p className="font-semibold">${item.total_price?.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${invoice.total_amount?.toFixed(2)}</span>
                </div>
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount:</span>
                    <span>-${invoice.discount_amount?.toFixed(2)}</span>
                  </div>
                )}
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>${invoice.tax_amount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total:</span>
                  <span>${invoice.net_amount?.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
