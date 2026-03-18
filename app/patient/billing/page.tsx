'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Download, FileText } from 'lucide-react'

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  tax_amount: number
  net_amount: number
  payment_status: string
  created_at: string
  invoice_items: Array<{
    description: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export default function PatientBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoices()
  }, [])

  async function fetchInvoices() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: patientData } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!patientData) return

      const { data, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          total_amount,
          tax_amount,
          net_amount,
          payment_status,
          created_at,
          invoice_items (
            description,
            quantity,
            unit_price,
            total_price
          )
        `)
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvoices(data || [])
    } catch (error: any) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handlePayNow(invoiceId: string, amount: number) {
    setPaying(invoiceId)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoiceId,
          amount: amount,
          payment_method: 'online',
          transaction_id: 'TXN' + Date.now(),
          processed_by: user.id,
        })

      if (paymentError) throw paymentError

      // Update invoice status
      const { error: updateError } = await supabase
        .from('invoices')
        .update({ payment_status: 'paid' })
        .eq('id', invoiceId)

      if (updateError) throw updateError

      // Refresh invoices
      fetchInvoices()
    } catch (error: any) {
      console.error('Error processing payment:', error)
      alert('Payment failed: ' + error.message)
    } finally {
      setPaying(null)
    }
  }

  function downloadReceipt(invoice: Invoice) {
    const receipt = `
RECEIPT
=======

Invoice Number: ${invoice.invoice_number}
Date: ${new Date(invoice.created_at).toLocaleDateString()}
Status: ${invoice.payment_status.toUpperCase()}

ITEMS:
${invoice.invoice_items.map(item => 
  `${item.description} x${item.quantity} @ $${item.unit_price} = $${item.total_price}`
).join('\n')}

Subtotal: $${invoice.total_amount.toFixed(2)}
Tax: $${invoice.tax_amount.toFixed(2)}
TOTAL: $${invoice.net_amount.toFixed(2)}

Thank you for your payment!
    `.trim()

    const blob = new Blob([receipt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${invoice.invoice_number}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      paid: 'bg-green-100 text-green-700',
      partially_paid: 'bg-blue-100 text-blue-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Bills</h1>
        <p className="text-gray-600 mt-1">View and pay your medical bills</p>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bills yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Invoice #{invoice.invoice_number}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.payment_status)}`}>
                    {invoice.payment_status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Items:</h4>
                  <div className="space-y-2">
                    {invoice.invoice_items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          {item.description} x{item.quantity}
                        </span>
                        <span className="font-medium">${item.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>${invoice.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span>${invoice.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${invoice.net_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  {invoice.payment_status === 'pending' ? (
                    <Button
                      onClick={() => handlePayNow(invoice.id, invoice.net_amount)}
                      disabled={paying === invoice.id}
                      className="flex-1"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      {paying === invoice.id ? 'Processing...' : 'Pay Now'}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => downloadReceipt(invoice)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
