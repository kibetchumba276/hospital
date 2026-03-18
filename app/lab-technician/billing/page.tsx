'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Search, Download, CheckCircle, Plus } from 'lucide-react'
import QRCode from 'qrcode'

export default function LabTechnicianBillingPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newInvoice, setNewInvoice] = useState({
    patient_id: '',
    amount: ''
  })
  const [patients, setPatients] = useState<any[]>([])

  useEffect(() => {
    loadInvoices()
    loadPatients()
  }, [])

  async function loadPatients() {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          id,
          medical_record_number,
          user:users(first_name, last_name)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPatients(data || [])
    } catch (error) {
      console.error('Error loading patients:', error)
    }
  }

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

  async function createInvoice(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('invoices')
        .insert({
          patient_id: newInvoice.patient_id,
          total_amount: newInvoice.amount,
          payment_status: 'pending',
          invoice_date: new Date().toISOString()
        })

      if (error) throw error
      
      setNewInvoice({ patient_id: '', amount: '' })
      setShowCreateForm(false)
      await loadInvoices()
    } catch (error: any) {
      alert('Error: ' + error.message)
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
      alert('Failed to update invoice')
    }
  }

  async function generatePDFReceipt(invoice: any) {
    try {
      const patientName = `${invoice.patient?.user?.first_name || 'Unknown'} ${invoice.patient?.user?.last_name || 'Patient'}`
      
      const qrData = JSON.stringify({
        invoice_id: invoice.id,
        patient_id: invoice.patient_id,
        amount: invoice.total_amount,
        status: invoice.payment_status,
        date: invoice.payment_date || invoice.created_at
      })
      
      const qrCodeDataURL = await QRCode.toDataURL(qrData, { width: 200 })

      const pdfContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #2563eb; margin: 0; }
            .receipt-box { border: 2px solid #2563eb; padding: 20px; border-radius: 8px; }
            .row { display: flex; justify-between; margin: 10px 0; }
            .label { font-weight: bold; }
            .qr-section { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #ccc; }
            .total { font-size: 24px; font-weight: bold; color: #2563eb; margin-top: 20px; }
            .paid-stamp { color: #10b981; font-size: 32px; font-weight: bold; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏥 MediCare Hospital</h1>
            <p>Payment Receipt</p>
          </div>
          
          <div class="receipt-box">
            ${invoice.payment_status === 'paid' ? '<div class="paid-stamp">✓ PAID</div>' : ''}
            
            <div class="row">
              <span class="label">Receipt #:</span>
              <span>${invoice.id.substring(0, 8).toUpperCase()}</span>
            </div>
            
            <div class="row">
              <span class="label">Patient Name:</span>
              <span>${patientName}</span>
            </div>
            
            <div class="row">
              <span class="label">MRN:</span>
              <span>${invoice.patient?.medical_record_number || 'N/A'}</span>
            </div>
            
            <div class="row">
              <span class="label">Invoice Date:</span>
              <span>${new Date(invoice.created_at).toLocaleDateString()}</span>
            </div>
            
            ${invoice.payment_date ? `
            <div class="row">
              <span class="label">Payment Date:</span>
              <span>${new Date(invoice.payment_date).toLocaleDateString()}</span>
            </div>
            ` : ''}
            
            <div class="row total">
              <span class="label">Total Amount:</span>
              <span>$${parseFloat(invoice.total_amount).toFixed(2)}</span>
            </div>
            
            <div class="qr-section">
              <p><strong>Payment Verification QR Code</strong></p>
              <img src="${qrCodeDataURL}" alt="QR Code" />
              <p style="font-size: 12px; color: #666; margin-top: 10px;">
                Scan this code to verify payment
              </p>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
            <p>Thank you for choosing MediCare Hospital</p>
            <p>For inquiries, please contact: info@medicare.com</p>
          </div>
        </body>
        </html>
      `

      const printWindow = window.open('', '', 'height=600,width=800')
      if (printWindow) {
        printWindow.document.write(pdfContent)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate receipt')
    }
  }

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = searchTerm === '' ||
      inv.patient?.user?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient?.user?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === 'pending') return matchesSearch && inv.payment_status === 'pending'
    if (filter === 'paid') return matchesSearch && inv.payment_status === 'paid'
    return matchesSearch
  })

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">Manage patient invoices and payments</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={createInvoice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient</label>
                <select
                  required
                  value={newInvoice.patient_id}
                  onChange={(e) => setNewInvoice({...newInvoice, patient_id: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">Select Patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.user?.first_name} {p.user?.last_name} - {p.medical_record_number}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({...newInvoice, amount: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Invoice</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                size="sm"
              >
                All ({invoices.length})
              </Button>
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
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.payment_status.toUpperCase()}
                      </span>
                      <div className="flex gap-2">
                        {invoice.payment_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => markAsPaid(invoice.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                        {invoice.payment_status === 'paid' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => generatePDFReceipt(invoice)}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        )}
                      </div>
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