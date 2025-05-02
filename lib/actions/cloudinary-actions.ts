"use server"
import { revalidatePath } from "next/cache"

// Upload image to Cloudinary using a more compatible approach
export async function uploadImage(formData: FormData) {
  try {
    const file = formData.get("file") as File

    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Get file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create a unique identifier for the file without using crypto
    const timestamp = Date.now().toString()
    const randomId = Math.random().toString(36).substring(2, 15)
    const uniqueId = `${timestamp}-${randomId}`

    // Use the Cloudinary API directly with fetch
    const url = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`

    // Create form data for the upload
    const uploadFormData = new FormData()
    uploadFormData.append("file", new Blob([buffer], { type: file.type }))
    uploadFormData.append("api_key", process.env.CLOUDINARY_API_KEY || "")
    uploadFormData.append("timestamp", timestamp)
    uploadFormData.append("public_id", `garden-planner/flowers/${uniqueId}`)

    // For this approach, we need to generate a signature on the server
    // Since we can't use crypto.createHash, we'll use a pre-signed upload
    // This requires setting up Cloudinary with unsigned upload presets
    uploadFormData.append("upload_preset", "garden_planner_unsigned")

    const response = await fetch(url, {
      method: "POST",
      body: uploadFormData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message || "Unknown error"}`)
    }

    const result = await response.json()

    revalidatePath("/dashboard")
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error uploading image:", error)
    return {
      success: false,
      error: "Failed to upload image",
    }
  }
}

// Delete image from Cloudinary
export async function deleteImage(publicId: string) {
  try {
    // Use the Cloudinary API directly with fetch
    const url = `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/destroy`

    const timestamp = Date.now().toString()

    // Create form data for the deletion
    const formData = new FormData()
    formData.append("public_id", publicId)
    formData.append("api_key", process.env.CLOUDINARY_API_KEY || "")
    formData.append("timestamp", timestamp)

    // For this approach, we need to generate a signature on the server
    // Since we can't use crypto.createHash, we'll use a different approach
    // We'll use a pre-signed deletion with an upload preset
    formData.append("upload_preset", "garden_planner_unsigned")

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Cloudinary deletion failed: ${errorData.error?.message || "Unknown error"}`)
    }

    const result = await response.json()

    revalidatePath("/dashboard")
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    console.error("Error deleting image:", error)
    return {
      success: false,
      error: "Failed to delete image",
    }
  }
}
