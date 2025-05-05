"use client"

import { useState } from "react"
import { CldUploadWidget } from "next-cloudinary"
import { Upload, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface ImageUploadProps {
  onUploadComplete: (imageUrl: string) => void
  className?: string
}

export function ImageUpload({ onUploadComplete, className = "" }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleUploadSuccess = (result: any) => {
    setIsUploading(false)
    setError(null)

    // Get the secure URL from the upload result
    const secureUrl = result.info?.secure_url

    if (secureUrl) {
      setPreview(secureUrl)
      onUploadComplete(secureUrl)
    } else {
      setError("Upload failed: No secure URL returned")
    }
  }

  const clearPreview = () => {
    setPreview(null)
    setError(null)
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {preview ? (
        <div className="relative w-32 h-32">
          <Image src={preview || "/placeholder.svg"} alt="Image preview" fill className="object-cover rounded-md" />
          {!isUploading && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={clearPreview}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full">
          <CldUploadWidget
            uploadPreset="garden_planner_unsigned"
            onSuccess={handleUploadSuccess}
            options={{
              maxFiles: 1,
              resourceType: "image",
              folder: "garden-planner/flowers",
              clientAllowedFormats: ["jpg", "jpeg", "png", "gif"],
              sources: ["local", "url", "camera"],
            }}
            onOpen={() => setIsUploading(true)}
            onClose={() => setIsUploading(false)}
            onError={(error) => {
              setError(error.message || "Upload failed")
              setIsUploading(false)
            }}
          >
            {({ open }) => (
              <div
                className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => open()}
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click to upload image</p>
              </div>
            )}
          </CldUploadWidget>
        </div>
      )}

      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  )
}
