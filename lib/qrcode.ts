import QRCode from 'qrcode'

export interface InvoiceQRData {
  invoice_id: string
  patient_id: string
  amount: string
  status: string
  date: string
}

export async function generateInvoiceQR(data: InvoiceQRData): Promise<string> {
  try {
    const qrData = JSON.stringify(data)
    return await QRCode.toDataURL(qrData, { 
      width: 200,
      margin: 2,
      color: {
        dark: '#2563eb',
        light: '#ffffff'
      }
    })
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

export function parseInvoiceQR(qrData: string): InvoiceQRData | null {
  try {
    return JSON.parse(qrData) as InvoiceQRData
  } catch (error) {
    console.error('Error parsing QR data:', error)
    return null
  }
}

export function verifyQRCode(qrData: string): { valid: boolean; data?: any; error?: string } {
  try {
    if (!qrData || qrData.trim() === '') {
      return { valid: false, error: 'QR code data is empty' }
    }

    // Try to parse as JSON
    const parsed = JSON.parse(qrData)
    
    // Check if it has required invoice fields
    if (!parsed.invoice_id || !parsed.patient_id || !parsed.amount || !parsed.status) {
      return { valid: false, error: 'Invalid QR code format - missing required fields' }
    }

    // Add items array if not present (for backward compatibility)
    if (!parsed.items) {
      parsed.items = []
    }

    return { valid: true, data: parsed }
  } catch (error) {
    console.error('Error verifying QR data:', error)
    return { valid: false, error: 'Invalid QR code format - not valid JSON' }
  }
}

export function generateReceiptHTML(invoice: any, qrCodeDataURL: string): string {
  const patientName = `${invoice.patient?.user?.first_name || 'Unknown'} ${invoice.patient?.user?.last_name || 'Patient'}`
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          padding: 40px; 
          max-width: 800px; 
          margin: 0 auto;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .header h1 { 
          color: #2563eb; 
          margin: 0; 
          font-size: 32px;
        }
        .header p {
          color: #666;
          font-size: 18px;
          margin: 10px 0 0 0;
        }
        .receipt-box { 
          border: 2px solid #2563eb; 
          padding: 30px; 
          border-radius: 12px; 
          background: #f8fafc;
        }
        .row { 
          display: flex; 
          justify-content: space-between; 
          margin: 15px 0; 
          padding: 8px 0;
          border-bottom: 1px dotted #ccc;
        }
        .row:last-child {
          border-bottom: none;
        }
        .label { 
          font-weight: bold; 
          color: #374151;
        }
        .value {
          color: #1f2937;
        }
        .qr-section { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 30px; 
          border-top: 3px dashed #2563eb; 
        }
        .qr-section h3 {
          color: #2563eb;
          margin-bottom: 20px;
        }
        .total { 
          font-size: 28px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-top: 20px; 
          background: white;
          padding: 15px;
          border-radius: 8px;
          border: 2px solid #2563eb;
        }
        .paid-stamp { 
          color: #10b981; 
          font-size: 36px; 
          font-weight: bold; 
          text-align: center; 
          margin: 20px 0; 
          background: #ecfdf5;
          padding: 20px;
          border-radius: 12px;
          border: 3px solid #10b981;
        }
        .footer {
          text-align: center; 
          margin-top: 40px; 
          font-size: 14px; 
          color: #666;
          border-top: 2px solid #e5e7eb;
          padding-top: 20px;
        }
        .footer h4 {
          color: #2563eb;
          margin-bottom: 10px;
        }
        @media print {
          body { padding: 20px; }
          .header h1 { font-size: 24px; }
          .paid-stamp { font-size: 24px; }
          .total { font-size: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🏥 MediCare Hospital</h1>
        <p>Official Payment Receipt</p>
      </div>
      
      <div class="receipt-box">
        ${invoice.payment_status === 'paid' ? '<div class="paid-stamp">✓ PAYMENT CONFIRMED</div>' : ''}
        
        <div class="row">
          <span class="label">Receipt Number:</span>
          <span class="value">#${invoice.id.substring(0, 8).toUpperCase()}</span>
        </div>
        
        <div class="row">
          <span class="label">Patient Name:</span>
          <span class="value">${patientName}</span>
        </div>
        
        <div class="row">
          <span class="label">Medical Record Number:</span>
          <span class="value">${invoice.patient?.medical_record_number || 'N/A'}</span>
        </div>
        
        <div class="row">
          <span class="label">Invoice Date:</span>
          <span class="value">${new Date(invoice.created_at).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        
        ${invoice.payment_date ? `
        <div class="row">
          <span class="label">Payment Date:</span>
          <span class="value">${new Date(invoice.payment_date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        ` : ''}
        
        <div class="row total">
          <span class="label">Total Amount Paid:</span>
          <span class="value">$${parseFloat(invoice.total_amount).toFixed(2)}</span>
        </div>
        
        <div class="qr-section">
          <h3>Payment Verification</h3>
          <img src="${qrCodeDataURL}" alt="Payment Verification QR Code" style="border: 2px solid #2563eb; border-radius: 8px;" />
          <p style="font-size: 12px; color: #666; margin-top: 15px; font-style: italic;">
            Scan this QR code to verify payment authenticity
          </p>
        </div>
      </div>
      
      <div class="footer">
        <h4>Thank you for choosing MediCare Hospital</h4>
        <p>📧 Email: info@medicare.com | 📞 Phone: (555) 123-4567</p>
        <p>🏥 Address: 123 Healthcare Ave, Medical City, MC 12345</p>
        <p style="margin-top: 15px; font-size: 12px;">
          This is an official receipt. Please retain for your records.
        </p>
      </div>
    </body>
    </html>
  `
}