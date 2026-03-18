'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QrCode, CheckCircle, XCircle, TestTube } from 'lucide-react'
import { verifyQRCode } from '@/lib/qrcode'

export default function LabVerifyPage() {
  const [qrCode, setQrCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [labOrders, setLabOrders] = useState<any[]>([])
  const [error, setError] = useState('')

  async function handleVerify() {
    if (!qrCode) {
      setError('Please enter QR code')
      return
    }

    setVerifying(true)
    setError('')
    setVerificationResult(null)
    setLabOrders([])

    try {
      // Verify QR code format and payment
      const verification = verifyQRCode(qrCode)
      
      if (!verification.valid) {
        setError(verification.error || 'Invalid QR code')
        return
      }

      const qrData = verification.data!

      // Get invoice details
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', qrData.invoice_id)
        .single()

      if (invoiceError || !invoiceData) {
        setError('Invoice not found')
        return
      }

      if (invoiceData.payment_status !== 'paid') {
        setError('Invoice not paid. Patient must pay first.')
        return
      }

      // Get patient details
      const { data: patientData } = await supabase
        .from('patients')
        .select(`
          *,
          user:users(first_name, last_name, email, phone)
        `)
        .eq('id', qrData.patient_id)
        .single()

      // Get lab orders for this patient
      const { data: labOrdersData, error: labError } = await supabase
        .from('lab_orders')
        .select(`
          *,
          lab_test_items(*),
          doctor:staff!lab_orders_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .eq('patient_id', qrData.patient_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (labError) throw labError

      // Filter lab orders that have tests in the QR code
      const testItems = qrData.items.filter(item => item.type === 'lab_test')
      const relevantOrders = labOrdersData?.filter(order => 
        order.lab_test_items?.some((item: any) => 
          testItems.some(t => t.name === item.test_name)
        )
      ) || []

      setVerificationResult({
        valid: true,
        invoice: invoiceData,
        patient: patientData,
        qrData
      })

      setLabOrders(relevantOrders)

    } catch (error: any) {
      console.error('Verification error:', error)
      setError(error.message || 'Failed to verify QR code')
    } finally {
      setVerifying(false)
    }
  }

  async function collectSample(orderId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update lab order status
      const { error: updateError } = await supabase
        .from('lab_orders')
        .update({
          status: 'sample_collected',
          payment_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          sample_collected_by: user.id,
          sample_collected_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (updateError) throw updateError

      // Update lab test items
      const { error: itemsError } = await supabase
        .from('lab_test_items')
        .update({ status: 'sample_collected' })
        .eq('lab_order_id', orderId)

      if (itemsError) throw itemsError

      // Remove from list
      setLabOrders(labOrders.filter(o => o.id !== orderId))

      alert('Sample collected successfully! You can now process the tests.')

    } catch (error: any) {
      console.error('Collection error:', error)
      alert(error.message || 'Failed to collect sample')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verify Payment & Collect Sample</h1>
        <p className="text-gray-600 mt-1">Scan patient receipt QR code to verify payment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter QR Code Data
              </label>
              <div className="flex gap-3">
                <Input
                  placeholder="Paste QR code data or scan with device"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                />
                <Button onClick={handleVerify} disabled={verifying}>
                  {verifying ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start gap-3">
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Verification Failed</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {verificationResult && (
              <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md flex items-start gap-3">
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Payment Verified ✓</p>
                  <div className="text-sm mt-2 space-y-1">
                    <p><span className="font-medium">Patient:</span> {verificationResult.patient?.user.first_name} {verificationResult.patient?.user.last_name}</p>
                    <p><span className="font-medium">Invoice:</span> #{verificationResult.invoice.id.slice(0, 8)}</p>
                    <p><span className="font-medium">Amount Paid:</span> KES {verificationResult.invoice.total_amount}</p>
                    <p><span className="font-medium">Payment Date:</span> {new Date(verificationResult.invoice.payment_date).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {labOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lab Orders to Process</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {labOrders.map((order) => (
                <div key={order.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">
                        Lab Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Ordered by: Dr. {order.doctor.user.first_name} {order.doctor.user.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button onClick={() => collectSample(order.id)}>
                      <TestTube className="h-4 w-4 mr-2" />
                      Collect Sample
                    </Button>
                  </div>

                  {order.lab_test_items && order.lab_test_items.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-sm font-medium mb-2">Tests Ordered:</p>
                      <div className="space-y-2">
                        {order.lab_test_items.map((item: any) => (
                          <div key={item.id} className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-medium">{item.test_name}</p>
                            {item.test_code && (
                              <p className="text-gray-600">Code: {item.test_code}</p>
                            )}
                            <p className="text-gray-600">Status: {item.status}</p>
                          </div>
                        ))}
                      </div>
                    </div>
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
