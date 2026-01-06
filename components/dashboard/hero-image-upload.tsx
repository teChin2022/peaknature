'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageIcon, AlertCircle, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface HeroImageUploadProps {
  tenantId: string
  images: string[]
  onImagesChange: (images: string[]) => void
  primaryColor: string
}

// Supported image types
const SUPPORTED_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif'
]

// Max file size: 10MB (increased for high-quality images)
const MAX_FILE_SIZE = 10 * 1024 * 1024

export function HeroImageUpload({ tenantId, images, onImagesChange, primaryColor }: HeroImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Reset status after success
  useEffect(() => {
    if (uploadStatus === 'success') {
      const timer = setTimeout(() => {
        setUploadStatus('idle')
        setUploadProgress('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [uploadStatus])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    console.log('[HeroUpload] Starting upload for', files.length, 'files')
    
    setIsUploading(true)
    setUploadStatus('uploading')
    setUploadError(null)
    setTotalFiles(files.length)
    setCurrentFileIndex(0)

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setCurrentFileIndex(i + 1)
        const progressText = `${file.name} (${formatFileSize(file.size)})`
        setUploadProgress(progressText)
        console.log(`[HeroUpload] Processing file ${i + 1}/${files.length}:`, progressText)

        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not an image file`)
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`${file.name} is too large (${formatFileSize(file.size)}). Maximum size is 10MB`)
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `${tenantId}/hero/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        console.log('[HeroUpload] Uploading to path:', fileName)
        const uploadStart = Date.now()

        // Upload to Supabase Storage
        const { error: storageError } = await supabase.storage
          .from('tenants')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })

        const uploadTime = Date.now() - uploadStart
        console.log(`[HeroUpload] Upload completed in ${uploadTime}ms`)

        if (storageError) {
          console.error('[HeroUpload] Storage error:', storageError)
          // Check for common errors
          if (storageError.message?.includes('Bucket not found')) {
            throw new Error('Storage bucket "tenants" not found. Please contact administrator.')
          }
          if (storageError.message?.includes('not authorized')) {
            throw new Error('Not authorized to upload. Please log in again.')
          }
          throw storageError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('tenants')
          .getPublicUrl(fileName)

        console.log('[HeroUpload] Public URL:', publicUrl)
        uploadedUrls.push(publicUrl)
      }

      console.log('[HeroUpload] All uploads complete:', uploadedUrls.length, 'files')
      setUploadStatus('success')
      setUploadProgress('Upload complete!')
      
      // Add new images to existing ones
      onImagesChange([...images, ...uploadedUrls])
    } catch (error) {
      console.error('[HeroUpload] Upload error:', error)
      setUploadStatus('error')
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = async (imageUrl: string, index: number) => {
    // Try to delete from storage if it's a Supabase storage URL
    if (imageUrl.includes('supabase') && imageUrl.includes('/tenants/')) {
      try {
        // Extract file path from URL
        const urlParts = imageUrl.split('/tenants/')
        if (urlParts.length > 1) {
          const filePath = urlParts[1]
          await supabase.storage.from('tenants').remove([filePath])
        }
      } catch (error) {
        console.error('Error deleting file from storage:', error)
      }
    }

    // Remove from images array
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div 
        className="border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-stone-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="py-4">
            <Loader2 className="h-10 w-10 mx-auto mb-3 animate-spin" style={{ color: primaryColor }} />
            <p className="text-sm font-medium text-stone-700">
              Uploading {currentFileIndex} of {totalFiles}...
            </p>
            {uploadProgress && (
              <p className="text-xs text-stone-500 mt-2 truncate max-w-xs mx-auto">{uploadProgress}</p>
            )}
            {/* Progress bar */}
            <div className="mt-3 w-48 mx-auto bg-stone-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${(currentFileIndex / totalFiles) * 100}%`,
                  backgroundColor: primaryColor 
                }}
              />
            </div>
          </div>
        ) : uploadStatus === 'success' ? (
          <div className="py-4">
            <CheckCircle className="h-10 w-10 mx-auto mb-3 text-green-500" />
            <p className="text-sm font-medium text-green-600">Upload complete!</p>
          </div>
        ) : (
          <>
            <Upload className="h-10 w-10 mx-auto mb-3 text-stone-400" />
            <p className="text-sm font-medium text-stone-700">
              Click to upload images
            </p>
            <p className="text-xs text-stone-500 mt-1">
              JPG, PNG, WebP, AVIF, GIF up to 10MB each (4 images recommended)
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {uploadError}
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-stone-100 border">
              <Image
                src={imageUrl}
                alt={`Hero image ${index + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
              {index === 0 && (
                <div 
                  className="absolute top-2 left-2 px-2 py-0.5 text-white text-xs rounded font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Main
                </div>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveImage(imageUrl, index)
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isUploading && (
        <div className="text-center py-8 bg-stone-50 rounded-lg border-2 border-dashed">
          <ImageIcon className="h-10 w-10 mx-auto text-stone-300 mb-2" />
          <p className="text-sm text-stone-500">No images uploaded yet</p>
          <p className="text-xs text-stone-400">Upload images to showcase your property</p>
        </div>
      )}
    </div>
  )
}

