"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

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
  const [imageSrc, setImageSrc] = useState<string>(src)

  // Effect to handle image source changes
  useEffect(() => {
    setImageSrc(src)
    setIsLoading(true)
    setError(false)
  }, [src])

  // Use default image if src is not provided or if there was an error
  if (!imageSrc || error) {
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

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Show loading spinner while image is loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20 z-10">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      <Image
          src={imageSrc.includes("cloudinary.com") 
            ? `${imageSrc.replace("/upload/", "/upload/c_scale,q_auto:good,f_auto,w_")}${width}`
            : imageSrc || "/placeholder.svg"}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} object-${objectFit} object-center w-full h-full rounded-md`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            console.error(`Failed to load image: ${imageSrc}`)
            setError(true)
            setIsLoading(false)
          }}
          unoptimized={imageSrc.includes("cloudinary.com")} // Skip Next.js optimization for Cloudinary images
        />
    </div>
  )
}