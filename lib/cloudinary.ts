// Simple utility functions for Cloudinary without using the SDK

// Helper function to generate Cloudinary URLs
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

// Export a dummy cloudinary object to maintain compatibility
const cloudinary = {
  config: () => {},
  url: (publicId: string, options = {}) => getCloudinaryUrl(publicId, options),
  uploader: {
    upload: () => {
      throw new Error("Direct Cloudinary SDK upload not supported in this environment")
    },
    destroy: () => {
      throw new Error("Direct Cloudinary SDK destroy not supported in this environment")
    },
  },
}

export default cloudinary
