"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CloudinaryImage } from "@/components/cloudinary-image"

interface ImageUrlInputProps {
  onImageUrlChange: (url: string) => void
  initialUrl?: string
  className?: string
}

export function ImageUrlInput({ onImageUrlChange, initialUrl = "", className = "" }: ImageUrlInputProps) {
  const [url, setUrl] = useState(initialUrl)
  const [previewUrl, setPreviewUrl] = useState(initialUrl)
  const [isValidating, setIsValidating] = useState(false)

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  const validateAndSetImage = async () => {
    if (!url) return

    setIsValidating(true)

    try {
      // Simple validation - check if the image loads
      const img = new Image()
      img.onload = () => {
        setPreviewUrl(url)
        onImageUrlChange(url)
        setIsValidating(false)
      }
      img.onerror = () => {
        setIsValidating(false)
        alert("Invalid image URL. Please enter a valid image URL.")
      }
      img.src = url
    } catch (error) {
      setIsValidating(false)
      alert("Error validating image URL.")
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-2">
        <Input type="url" placeholder="Enter image URL" value={url} onChange={handleUrlChange} className="flex-1" />
        <Button onClick={validateAndSetImage} disabled={isValidating || !url}>
          {isValidating ? "Checking..." : "Use Image"}
        </Button>
      </div>

      {previewUrl && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground mb-1">Preview:</p>
          <CloudinaryImage src={previewUrl} alt="Image preview" width={100} height={100} className="rounded-md" />
        </div>
      )}
    </div>
  )
}
