"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUrlInput } from "@/components/image-url-input"
import { FileUpload } from "@/components/file-upload"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface FlowerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (flower: { name: string; spacing: number; image_url: string; quantity: number }) => Promise<void>
  isLoading?: boolean
  initialFlower?: { name: string; spacing: number; image_url: string; quantity: number } | null
  plants?: { id: number; name: string; spacing: number; image_url: string; quantity?: number; used_count?: number }[]
}

export function FlowerForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
  initialFlower = null,
  plants,
}: FlowerFormProps) {
  const [name, setName] = useState(initialFlower?.name || "")
  const [spacing, setSpacing] = useState(initialFlower?.spacing || 30)
  const [imageUrl, setImageUrl] = useState(initialFlower?.image_url || "")
  const [quantity, setQuantity] = useState(initialFlower?.quantity || 10)
  const [activeTab, setActiveTab] = useState<string>("url")

  // Reset form when initialFlower changes
  useEffect(() => {
    if (initialFlower) {
      setName(initialFlower.name || "")
      setSpacing(initialFlower.spacing || 30)
      setImageUrl(initialFlower.image_url || "")
      setQuantity(initialFlower.quantity || 10)
    }
  }, [initialFlower])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !imageUrl) return
    try {
      await onSubmit({ name, spacing, image_url: imageUrl, quantity })
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  const resetForm = () => {
    if (!initialFlower) {
      setName("")
      setSpacing(30)
      setImageUrl("")
      setQuantity(10)
      setActiveTab("url")
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleImageUpload = (url: string) => {
    console.log("Image URL received:", url)
    setImageUrl(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="flower-form-description">
        <DialogHeader>
          <DialogTitle>{initialFlower ? "Edit Flower" : "Add New Flower"}</DialogTitle>
          <p id="flower-form-description" className="text-sm text-muted-foreground">
            Enter the flower details below.
          </p>
        </DialogHeader>

        {/* Main content with native scrolling */}
        <div className="overflow-y-auto max-h-[60vh] pr-2 my-4 custom-scrollbar">
          <form id="flower-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="flower-name">Flower Name</Label>
              <Input
                id="flower-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Rose"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="flower-spacing">Spacing (cm)</Label>
                <span className="text-sm text-muted-foreground">{(spacing / 100).toFixed(2)} m</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  id="flower-spacing"
                  type="number"
                  min="10"
                  max="100"
                  value={spacing}
                  onChange={(e) => setSpacing(Number(e.target.value))}
                  onClick={(e) => e.currentTarget.select()}
                  className="flex-1"
                />
                <span className="text-sm">cm</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flower-quantity">Quantity Available</Label>
              <Input
                id="flower-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
                placeholder="e.g., 10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Flower Image</Label>
              <Tabs defaultValue="url" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Image URL</TabsTrigger>
                  <TabsTrigger value="upload">File Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="pt-4">
                  <ImageUrlInput onImageUrlChange={setImageUrl} initialUrl={imageUrl} />
                </TabsContent>
                <TabsContent value="upload" className="pt-4">
                  <FileUpload onUploadComplete={handleImageUpload} />
                </TabsContent>
              </Tabs>

              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Image preview:</p>
                  <CloudinaryImage
                    src={imageUrl}
                    alt="Flower preview"
                    width={100}
                    height={100}
                    className="rounded-md"
                  />
                  <p className="text-xs text-muted-foreground mt-1 break-all">{imageUrl}</p>
                </div>
              )}
            </div>
          </form>
        </div>

        <DialogFooter className="pt-4 border-t mt-2">
          <Button type="submit" form="flower-form" disabled={isLoading || !name || !imageUrl}>
            {isLoading ? (initialFlower ? "Updating..." : "Adding...") : initialFlower ? "Update Flower" : "Add Flower"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
