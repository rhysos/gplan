"use client" // This directive tells Next.js this is a Client Component that runs in the browser

// Import necessary React hooks and components
import { useState } from "react"
import { CldImage } from "next-cloudinary" // Cloudinary's React component for optimized images
import { Loader2 } from "lucide-react" // Loading spinner icon
import Image from "next/image" // Next.js optimized image component

// TypeScript interface to define the props for this component
interface CloudinaryImageProps {
  src: string // Source URL of the image
  alt: string // Alt text for accessibility
  width?: number // Optional width in pixels
  height?: number // Optional height in pixels
  className?: string // Optional CSS classes
  objectFit?: "contain" | "cover" | "fill" // How the image should fit in its container
}

// The CloudinaryImage component handles both Cloudinary and regular images
export function CloudinaryImage({
  src,
  alt,
  width = 100, // Default width if not provided
  height = 100, // Default height if not provided
  className = "", // Default empty string for className
  objectFit = "cover", // Default object-fit is "cover"
}: CloudinaryImageProps) {
  // State to track loading status
  const [isLoading, setIsLoading] = useState(true)
  // State to track if there was an error loading the image
  const [error, setError] = useState(false)

  // Use default image if src is not provided or if there was an error
  if (!src || error) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Image
          src="/placeholder.svg" // Placeholder image
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
    // Handle non-Cloudinary URLs with Next.js Image component
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        {/* Show loading spinner while image is loading */}
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
          className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} object-${objectFit} object-center w-full h-full rounded-md`}
          onLoad={() => setIsLoading(false)} // Set loading to false when image loads
          onError={() => setError(true)} // Set error to true if image fails to load
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

  // Use CldImage for Cloudinary URLs - this provides optimized delivery and transformations
  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {/* Show loading spinner while image is loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
      <CldImage
        src={publicId} // Use the extracted public ID
        alt={alt}
        width={width}
        height={height}
        crop="fill" // Cloudinary-specific crop mode
        className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} object-${objectFit} object-center rounded-md`}
        onLoad={() => setIsLoading(false)} // Set loading to false when image loads
        onError={() => setError(true)} // Set error to true if image fails to load
      />
    </div>
  )
}
