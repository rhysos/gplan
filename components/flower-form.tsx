"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageUrlInput } from "@/components/image-url-input"
import { ImageUpload } from "@/components/image-upload"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface FlowerFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (flower: { name: string; spacing: number; image_url: string; quantity: number }) => Promise<void>
  isLoading?: boolean
  initialFlower?: { name: string; spacing: number; image_url: string; quantity: number } | null
}

export function FlowerForm({ open, onOpenChange, onSubmit, isLoading = false, initialFlower = null }: FlowerFormProps) {
  const [name, setName] = useState(initialFlower?.name || "")
  const [spacing, setSpacing] = useState(initialFlower?.spacing || 30)
  const [imageUrl, setImageUrl] = useState(initialFlower?.image_url || "")
  const [quantity, setQuantity] = useState(initialFlower?.quantity || 10)
  const [activeTab, setActiveTab] = useState<string>("url")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ name, spacing, image_url: imageUrl, quantity })
    resetForm()
  }

  const resetForm = () => {
    if (!initialFlower) {
      setName("")
      setSpacing(30)
      setImageUrl("")
      setQuantity(10)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm()
    onOpenChange(open)
  }

  const handleImageUpload = (url: string) => {
    setImageUrl(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{initialFlower ? "Edit Flower" : "Add New Flower"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4 max-h-[60vh]">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label htmlFor="flower-spacing">Spacing (cm)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  id="flower-spacing"
                  value={[spacing]}
                  onValueChange={(value) => setSpacing(value[0])}
                  min={10}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="w-12 text-right">{spacing} cm</span>
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
                onClick={(e) => (e.target as HTMLInputElement).select()}
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
                  <ImageUpload onUploadComplete={handleImageUpload} />
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
                </div>
              )}
            </div>
          </form>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t mt-4 flex-shrink-0">
          <Button type="button" onClick={handleSubmit} disabled={isLoading || !name || !imageUrl}>
            {isLoading ? (initialFlower ? "Updating..." : "Adding...") : initialFlower ? "Update Flower" : "Add Flower"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
