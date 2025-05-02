// Export the Cloudinary cloud name for use in components
export const cloudName = process.env.CLOUDINARY_CLOUD_NAME || ""

// Helper function to check if Cloudinary is properly configured
export function isCloudinaryConfigured(): boolean {
  return !!process.env.CLOUDINARY_CLOUD_NAME && !!process.env.CLOUDINARY_API_KEY
}

// Helper function to get a Cloudinary URL with transformations
export function getCloudinaryUrl(publicId: string, options = {}) {
  const defaultOptions = {
    width: 300,
    height: 300,
    crop: "fill",
    quality: "auto",
    format: "auto",
  }

  const mergedOptions = { ...defaultOptions, ...options }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "demo"

  // Build the transformation string
  const transformations = Object.entries(mergedOptions)
    .map(([key, value]) => `${key}_${value}`)
    .join(",")

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${publicId}`
}

// Helper function to extract public ID from Cloudinary URL
export function getPublicIdFromUrl(url: string): string | null {
  if (!url) return null

  // Extract the public ID from a Cloudinary URL
  const regex = /\/v\d+\/([^/]+)\.\w+$/
  const match = url.match(regex)

  return match ? match[1] : null
}
