"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { FlowerForm } from "@/components/flower-form-fixed"
import { createFlower, updateFlower, deleteFlower } from "@/lib/actions/flower-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Flower {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
  used_count?: number
}

interface FlowerManagementProps {
  initialFlowers: Flower[]
  usageCounts: Record<number, number>
  userId: number
}

export default function FlowerManagement({ initialFlowers, usageCounts, userId }: FlowerManagementProps) {
  const { toast } = useToast()
  const [flowers, setFlowers] = useState<Flower[]>(
    initialFlowers.map((flower) => ({
      ...flower,
      quantity: flower.quantity || 10, // Default quantity if not provided
      used_count: usageCounts[flower.id] || 0,
    })),
  )
  const [isAddingFlower, setIsAddingFlower] = useState(false)
  const [editingFlower, setEditingFlower] = useState<Flower | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [envVarsSet, setEnvVarsSet] = useState<boolean | null>(null)

  // Check environment variables on component mount
  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/env-check")
        const data = await response.json()

        setEnvVarsSet(data.data.CLOUDINARY_CLOUD_NAME && data.data.CLOUDINARY_API_KEY)
      } catch (error) {
        console.error("Error checking environment variables:", error)
        setEnvVarsSet(false)
      }
    }

    checkEnvVars()
  }, [])

  const handleAddFlower = async (flowerData: {
    name: string
    spacing: number
    image_url: string
    quantity: number
  }) => {
    setIsLoading(true)
    try {
      if (!userId) {
        throw new Error("User ID is required")
      }
      const newFlower = await createFlower(
        flowerData.name,
        flowerData.spacing,
        flowerData.image_url,
        flowerData.quantity,
        userId,
      )

      if (!newFlower) {
        throw new Error("Failed to create flower")
      }

      setFlowers([...flowers, { ...newFlower, used_count: 0 }])
      setIsAddingFlower(false)

      toast({
        title: "Flower added",
        description: `${flowerData.name} has been added successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add flower",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateFlower = async (flowerData: {
    name: string
    spacing: number
    image_url: string
    quantity: number
  }) => {
    if (!editingFlower) return

    setIsLoading(true)
    try {
      const updatedFlower = await updateFlower(
        editingFlower.id,
        flowerData.name,
        flowerData.spacing,
        flowerData.image_url,
        flowerData.quantity,
      )

      setFlowers(flowers.map((f) => (f.id === editingFlower.id ? { ...updatedFlower, used_count: f.used_count } : f)))
      setEditingFlower(null)

      toast({
        title: "Flower updated",
        description: `${flowerData.name} has been updated successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update flower",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteFlower = async (id: number) => {
    if (!confirm("Are you sure you want to delete this flower?")) return

    try {
      await deleteFlower(id)
      setFlowers(flowers.filter((f) => f.id !== id))

      toast({
        title: "Flower deleted",
        description: "Flower has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete flower",
        variant: "destructive",
      })
    }
  }

  const availablePlants = flowers.map((flower) => ({
    ...flower,
    used_count: usageCounts[flower.id] || 0,
  }))

  return (
    <div>
      {envVarsSet === false && (
        <Alert variant="warning" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Environment Variables Missing</AlertTitle>
          <AlertDescription>
            Some required environment variables are not set. Image functionality may be limited.{" "}
            <Link href="/troubleshoot" className="font-medium underline">
              Troubleshoot
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 flex justify-between items-center">
        <Button size="sm" onClick={() => setIsAddingFlower(true)}>
          <Plus className="mr-1 h-3 w-3" /> Add Flower
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {flowers.map((flower) => {
          const quantity = flower.quantity || 10 // Default to 10 if not set
          const available = quantity - (flower.used_count || 0)
          return (
            <Card key={flower.id} className="overflow-hidden flex flex-col">
              <div className="p-3 flex justify-center items-center">
                <div className="w-24 h-24 relative">
                  <CloudinaryImage
                    src={flower.image_url}
                    alt={flower.name}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover rounded-md"
                  />
                </div>
              </div>
              <CardContent className="p-3 pt-0">
                <h3 className="font-semibold text-sm truncate text-center">{flower.name}</h3>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">Spacing: {flower.spacing} cm</p>
                  <Badge variant={available > 0 ? "outline" : "destructive"} className="text-xs px-1 py-0 h-4">
                    {available}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="p-3 pt-0 flex justify-between mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => setEditingFlower(flower)}
                >
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => handleDeleteFlower(flower.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* Add Flower Dialog */}
      <FlowerForm
        open={isAddingFlower}
        onOpenChange={setIsAddingFlower}
        onSubmit={handleAddFlower}
        isLoading={isLoading}
        plants={availablePlants}
      />

      {/* Edit Flower Dialog */}
      {editingFlower && (
        <FlowerForm
          open={!!editingFlower}
          onOpenChange={(open) => !open && setEditingFlower(null)}
          onSubmit={handleUpdateFlower}
          isLoading={isLoading}
          initialFlower={editingFlower}
        />
      )}
    </div>
  )
}
