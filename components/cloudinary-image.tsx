"use client"

import { useState } from "react"
import { CldImage } from "next-cloudinary"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface CloudinaryImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  objectFit?: "contain" | "cover" | "fill"
}

export function CloudinaryImage({
  src,
  alt,
  width = 100,
  height = 100,
  className = "",
  objectFit = "cover",
}: CloudinaryImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  // Use default image if src is not provided
  if (!src || error) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Image
          src="/placeholder.svg"
          alt={alt}
          width={width}
          height={height}
          className={`object-${objectFit} w-full h-full rounded-md`}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    )
  }

  // Check if it's a Cloudinary URL
  const isCloudinaryUrl = src.includes("cloudinary.com")

  if (!isCloudinaryUrl) {
    // Handle non-Cloudinary URLs
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} object-${objectFit} w-full h-full rounded-md`}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      </div>
    )
  }

  // Extract public ID from Cloudinary URL
  // Format: https://res.cloudinary.com/cloud-name/image/upload/v1234567890/folder/image.jpg
  const matches = src.match(/\/upload\/(?:v\d+\/)?(.+)$/)
  const publicId = matches ? matches[1] : ""

  if (!publicId) {
    // If we couldn't extract the public ID, fall back to regular image
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <Image
          src={src || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} object-${objectFit} w-full h-full rounded-md`}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      </div>
    )
  }

  // Use CldImage for Cloudinary URLs
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <CldImage
        src={publicId}
        alt={alt}
        width={width}
        height={height}
        crop="fill"
        className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} object-${objectFit} rounded-md`}
        onLoad={() => setIsLoading(false)}
        onError={() => setError(true)}
      />
    </div>
  )
}
