'use client'

import { useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import { Upload, CheckCircle2, XCircle, Loader2, Camera, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function MobileUploadPage() {
  const params = useParams()
  const token = params.token as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB')
      return
    }

    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('token', token)
      formData.append('file', file)

      const response = await fetch('/api/upload/mobile', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error || 'Upload failed')
        setPreview(null)
        return
      }

      setIsSuccess(true)

    } catch (err) {
      console.error('Upload error:', err)
      setError('An error occurred. Please try again.')
      setPreview(null)
    } finally {
      setIsUploading(false)
    }
  }, [token])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }, [handleFile])

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-green-200">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Upload Successful!
            </h1>
            <p className="text-green-600 mb-6">
              Your payment slip has been uploaded. You can now close this page and return to your computer.
            </p>
            <div className="bg-green-50 rounded-lg p-4 text-sm text-green-700">
              <p className="font-medium">What happens next?</p>
              <p className="mt-1">The booking page on your computer will automatically detect the upload and continue with verification.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state with invalid/expired token
  if (error && !preview) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-6 text-center">
            <div className="h-20 w-20 mx-auto rounded-full bg-red-100 flex items-center justify-center mb-6">
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-2">
              {error}
            </h1>
            <p className="text-stone-600 mb-6">
              Please go back to your computer and generate a new QR code.
            </p>
            <Button
              onClick={() => {
                setError(null)
                setPreview(null)
              }}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardContent className="pt-8 pb-6">
          <div className="text-center mb-6">
            <div className="h-16 w-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-stone-800 mb-1">
              Upload Payment Slip
            </h1>
            <p className="text-sm text-stone-500">
              Select your payment screenshot from gallery or take a photo
            </p>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-4 rounded-lg overflow-hidden border-2 border-blue-200 bg-white">
              <div className="relative aspect-[3/4]">
                <Image
                  src={preview}
                  alt="Payment slip preview"
                  fill
                  className="object-contain"
                />
              </div>
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Uploading...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Upload buttons */}
          {!preview && (
            <div className="space-y-3">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-14 text-base gap-3 bg-blue-600 hover:bg-blue-700"
              >
                <ImageIcon className="h-5 w-5" />
                Choose from Gallery
              </Button>

              <Button
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment')
                    fileInputRef.current.click()
                    fileInputRef.current.removeAttribute('capture')
                  }
                }}
                variant="outline"
                className="w-full h-14 text-base gap-3"
              >
                <Camera className="h-5 w-5" />
                Take Photo
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Instructions */}
          <div className="mt-6 p-4 bg-stone-50 rounded-lg">
            <p className="text-xs text-stone-500 text-center">
              Make sure the slip clearly shows the transaction amount and reference number.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

