// QR Code generation and verification utilities

export interface QRCodeData {
  invoice_id: string
  patient_id: string
  patient_name: string
  payment_status: string
  amount_paid: number
  timestamp: string
  items: {
    type: 'medication' | 'lab_test' | 'service'
    id: string
    name: string
    quantity?: number
  }[]
}

export function generateQRCodeData(data: QRCodeData): string {
  // Encode data as base64 JSON
  const jsonString = JSON.stringify(data)
  return btoa(jsonString)
}

export function decodeQRCodeData(qrCode: string): QRCodeData | null {
  try {
    const jsonString = atob(qrCode)
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Failed to decode QR code:', error)
    return null
  }
}

export function verifyQRCode(qrCode: string): {
  valid: boolean
  data: QRCodeData | null
  error?: string
} {
  const data = decodeQRCodeData(qrCode)
  
  if (!data) {
    return { valid: false, data: null, error: 'Invalid QR code format' }
  }

  if (data.payment_status !== 'paid') {
    return { valid: false, data, error: 'Payment not confirmed' }
  }

  // Check if QR code is not too old (e.g., 24 hours)
  const timestamp = new Date(data.timestamp)
  const now = new Date()
  const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
  
  if (hoursDiff > 24) {
    return { valid: false, data, error: 'QR code expired (older than 24 hours)' }
  }

  return { valid: true, data }
}
