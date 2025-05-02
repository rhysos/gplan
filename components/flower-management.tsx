"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CloudinaryImage } from "@/components/cloudinary-image"
import { FlowerForm } from "@/components/flower-form"
import { createFlower, updateFlower, deleteFlower } from "@/lib/actions/flower-actions"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Flower {
  id: number
  name: string
  spacing: number
  image_url: string
}

interface FlowerManagementProps {
  initialFlowers: Flower[]
}

export default function FlowerManagement({ initialFlowers }: FlowerManagementProps) {
  const { toast } = useToast()
  const [flowers, setFlowers] = useState<Flower[]>(initialFlowers)
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

  const handleAddFlower = async (flowerData: { name: string; spacing: number; image_url: string }) => {
    setIsLoading(true)
    try {
      const newFlower = await createFlower(flowerData.name, flowerData.spacing, flowerData.image_url)
      setFlowers([...flowers, newFlower])
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

  const handleUpdateFlower = async (flowerData: { name: string; spacing: number; image_url: string }) => {
    if (!editingFlower) return

    setIsLoading(true)
    try {
      const updatedFlower = await updateFlower(
        editingFlower.id,
        flowerData.name,
        flowerData.spacing,
        flowerData.image_url,
      )

      setFlowers(flowers.map((f) => (f.id === editingFlower.id ? updatedFlower : f)))
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
        <Button onClick={() => setIsAddingFlower(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Flower
        </Button>

        <Button variant="outline" asChild>
          <Link href="/troubleshoot">Environment Troubleshooter</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {flowers.map((flower) => (
          <Card key={flower.id} className="overflow-hidden">
            <div className="aspect-square relative">
              <CloudinaryImage
                src={flower.image_url}
                alt={flower.name}
                width={300}
                height={300}
                className="w-full h-full"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg">{flower.name}</h3>
              <p className="text-sm text-muted-foreground">Spacing: {flower.spacing} cm</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setEditingFlower(flower)}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleDeleteFlower(flower.id)}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Add Flower Dialog */}
      <FlowerForm
        open={isAddingFlower}
        onOpenChange={setIsAddingFlower}
        onSubmit={handleAddFlower}
        isLoading={isLoading}
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
