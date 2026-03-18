'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, X, CheckCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (data: string) => void
  onClose: () => void
  title?: string
}

export default function QRScanner({ onScan, onClose, title = "Scan QR Code" }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState('')
  const [codeReader, setCodeReader] = useState<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    setCodeReader(reader)
    startScanning(reader)

    return () => {
      stopScanning(reader)
    }
  }, [])

  async function startScanning(reader: BrowserMultiFormatReader) {
    try {
      setIsScanning(true)
      setError('')

      const videoInputDevices = await reader.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera found')
      }

      // Use the first available camera (usually back camera on mobile)
      const selectedDeviceId = videoInputDevices[0].deviceId

      reader.decodeFromVideoDevice(selectedDeviceId, videoRef.current!, (result, error) => {
        if (result) {
          const scannedText = result.getText()
          console.log('QR Code scanned:', scannedText)
          onScan(scannedText)
          stopScanning(reader)
        }
        if (error && error.name !== 'NotFoundException') {
          console.error('Scanning error:', error)
        }
      })
    } catch (err: any) {
      console.error('Camera error:', err)
      setError(err.message || 'Failed to access camera')
      setIsScanning(false)
    }
  }

  function stopScanning(reader: BrowserMultiFormatReader) {
    try {
      reader.reset()
      setIsScanning(false)
    } catch (err) {
      console.error('Error stopping scanner:', err)
    }
  }

  function handleClose() {
    if (codeReader) {
      stopScanning(codeReader)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error ? (
              <div className="text-center space-y-4">
                <div className="bg-red-50 text-red-600 p-4 rounded-md">
                  <p className="font-medium">Camera Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
                <Button onClick={() => codeReader && startScanning(codeReader)}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    className="w-full h-64 bg-black rounded-lg object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-primary-500 w-48 h-48 rounded-lg animate-pulse">
                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary-500"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary-500"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary-500"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary-500"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-600">
                    Position the QR code within the frame
                  </p>
                  {isScanning && (
                    <div className="flex items-center justify-center gap-2 text-primary-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      <span className="text-sm">Scanning...</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// QR Scanner Result Display Component
interface QRResultProps {
  data: any
  onClose: () => void
  title?: string
}

export function QRResult({ data, onClose, title = "QR Code Result" }: QRResultProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              {title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm font-medium text-green-900 mb-2">Scanned Successfully!</p>
              <div className="space-y-2 text-sm">
                {data.invoice_id && (
                  <p><span className="font-medium">Invoice ID:</span> {data.invoice_id}</p>
                )}
                {data.patient_id && (
                  <p><span className="font-medium">Patient ID:</span> {data.patient_id}</p>
                )}
                {data.amount && (
                  <p><span className="font-medium">Amount:</span> ${data.amount}</p>
                )}
                {data.status && (
                  <p><span className="font-medium">Status:</span> 
                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                      data.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {data.status.toUpperCase()}
                    </span>
                  </p>
                )}
                {data.date && (
                  <p><span className="font-medium">Date:</span> {new Date(data.date).toLocaleDateString()}</p>
                )}
              </div>
            </div>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}