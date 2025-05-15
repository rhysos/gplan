"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, X, Loader2, AlertCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadImage } from "@/lib/actions/cloudinary-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CloudinaryImage } from "@/components/common/cloudinary-image"

interface FileUploadProps {
  onUploadComplete: (imageUrl: string) => void
  className?: string
}

export function FileUpload({ onUploadComplete, className = "" }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset success message after 3 seconds
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (uploadSuccess) {
      timer = setTimeout(() => {
        setUploadSuccess(false)
      }, 3000)
    }
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [uploadSuccess])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, WEBP)")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB")
      return
    }

    setFileName(file.name)
    setError(null)
    setIsUploading(true)
    setUploadSuccess(false)

    try {
      // Create a local preview
      const localPreview = URL.createObjectURL(file)
      setPreview(localPreview)

      // Create form data for upload
      const formData = new FormData()
      formData.append("file", file)

      // Upload to Cloudinary via server action
      const result = await uploadImage(formData)

      if (result.success && result.data?.secure_url) {
        // Set the uploaded image URL
        setUploadedImage(result.data.secure_url)
        // Call the callback with the uploaded image URL
        onUploadComplete(result.data.secure_url)
        setUploadSuccess(true)
        console.log("Image uploaded successfully:", result.data.secure_url)
      } else {
        throw new Error(result.error || "Upload failed")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError(err instanceof Error ? err.message : "Failed to upload image")
      // Keep the preview even if upload fails
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = () => {
    if (preview) {
      URL.revokeObjectURL(preview)
    }
    setPreview(null)
    setUploadedImage(null)
    setFileName(null)
    setError(null)
    setUploadSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {preview || uploadedImage ? (
        <div className="w-full">
          <div className="relative w-full aspect-square max-w-[200px] mx-auto mb-2">
            {/* Use CloudinaryImage for both preview and uploaded image */}
            <CloudinaryImage
              src={uploadedImage || preview || ""}
              alt="Image preview"
              width={200}
              height={200}
              className="rounded-md"
            />
            {!isUploading && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={clearFile}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-center text-muted-foreground truncate max-w-full">{fileName}</p>

          {uploadedImage && <p className="text-xs text-center text-muted-foreground mt-1 break-all">{uploadedImage}</p>}
        </div>
      ) : (
        <div className="w-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            disabled={isUploading}
          />
          <div
            onClick={triggerFileInput}
            className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 text-center">
              Click to upload image
              <br />
              <span className="text-xs">JPEG, PNG, GIF, WEBP (max 5MB)</span>
            </p>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {uploadSuccess && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>Image uploaded successfully!</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
