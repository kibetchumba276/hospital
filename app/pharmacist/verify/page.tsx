'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { QrCode, CheckCircle, XCircle, Pill, User, Calendar } from 'lucide-react'
import { verifyQRCode } from '@/lib/qrcode'

export default function PharmacyVerifyPage() {
  const [qrCode, setQrCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [error, setError] = useState('')

  async function handleVerify() {
    if (!qrCode) {
      setError('Please enter QR code')
      return
    }

    setVerifying(true)
    setError('')
    setVerificationResult(null)
    setPrescriptions([])

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

      // Get prescriptions for this patient
      const { data: prescriptionsData, error: prescError } = await supabase
        .from('prescriptions')
        .select(`
          *,
          prescription_items(*),
          doctor:staff!prescriptions_doctor_id_fkey(
            user:users(first_name, last_name)
          )
        `)
        .eq('patient_id', qrData.patient_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (prescError) throw prescError

      // Filter prescriptions that have medications in the QR code
      const medicationItems = qrData.items.filter(item => item.type === 'medication')
      const relevantPrescriptions = prescriptionsData?.filter(p => 
        p.prescription_items?.some((item: any) => 
          medicationItems.some(m => m.name === item.medication_name)
        )
      ) || []

      setVerificationResult({
        valid: true,
        invoice: invoiceData,
        patient: patientData,
        qrData
      })

      setPrescriptions(relevantPrescriptions)

    } catch (error: any) {
      console.error('Verification error:', error)
      setError(error.message || 'Failed to verify QR code')
    } finally {
      setVerifying(false)
    }
  }

  async function dispensePrescription(prescriptionId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update prescription status
      const { error: updateError } = await supabase
        .from('prescriptions')
        .update({
          status: 'dispensed',
          payment_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          dispensed_by: user.id,
          dispensed_at: new Date().toISOString()
        })
        .eq('id', prescriptionId)

      if (updateError) throw updateError

      // Update prescription items
      const { error: itemsError } = await supabase
        .from('prescription_items')
        .update({ dispensed: true })
        .eq('prescription_id', prescriptionId)

      if (itemsError) throw itemsError

      // Remove from list
      setPrescriptions(prescriptions.filter(p => p.id !== prescriptionId))

      alert('Prescription dispensed successfully!')

    } catch (error: any) {
      console.error('Dispense error:', error)
      alert(error.message || 'Failed to dispense prescription')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Verify Payment & Dispense</h1>
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

      {prescriptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prescriptions to Dispense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div key={prescription.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">
                        Prescription #{prescription.id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Prescribed by: Dr. {prescription.doctor.user.first_name} {prescription.doctor.user.last_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: {new Date(prescription.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button onClick={() => dispensePrescription(prescription.id)}>
                      <Pill className="h-4 w-4 mr-2" />
                      Dispense
                    </Button>
                  </div>

                  {prescription.prescription_items && prescription.prescription_items.length > 0 && (
                    <div className="mt-3 border-t pt-3">
                      <p className="text-sm font-medium mb-2">Medications:</p>
                      <div className="space-y-2">
                        {prescription.prescription_items.map((item: any) => (
                          <div key={item.id} className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-medium">{item.medication_name}</p>
                            <p className="text-gray-600">Dosage: {item.dosage}</p>
                            <p className="text-gray-600">Quantity: {item.quantity} {item.unit}</p>
                            {item.instructions && (
                              <p className="text-gray-600 mt-1">Instructions: {item.instructions}</p>
                            )}
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
