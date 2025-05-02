"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Edit, Save, Home, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { CloudinaryImage } from "@/components/cloudinary-image"
import {
  logoutUser,
  getUserGardens,
  createUserGarden,
  updateUserGarden,
  deleteUserGarden,
  getGardenRows,
  createGardenRow,
  updateGardenRow,
  deleteGardenRow,
  getPlants,
  getRowPlants,
  addPlantToRow as serverAddPlantToRow,
  removePlantFromRow,
} from "@/lib/actions"

// Types
interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string | null
}

interface PlantInstance {
  id: number
  plant_id: number
  position: number
  name: string
  spacing: number
  image_url: string | null
}

interface GardenRow {
  id: number
  name: string
  length: number
  plants?: PlantInstance[]
}

interface Garden {
  id: number
  name: string
}

export default function GardenPlanner({ userId }: { userId: number }) {
  const router = useRouter()
  const { toast } = useToast()
  const [gardens, setGardens] = useState<Garden[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentGardenId, setCurrentGardenId] = useState<number | null>(null)
  const [rows, setRows] = useState<GardenRow[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [addingPlantLoading, setAddingPlantLoading] = useState<number | null>(null)

  const [isAddingGarden, setIsAddingGarden] = useState(false)
  const [newGardenName, setNewGardenName] = useState("")
  const [editingGarden, setEditingGarden] = useState<Garden | null>(null)

  const [isAddingRow, setIsAddingRow] = useState(false)
  const [newRowName, setNewRowName] = useState("")
  const [newRowLength, setNewRowLength] = useState(240) // 2.4 meters default
  const [editingRow, setEditingRow] = useState<GardenRow | null>(null)

  const [selectedPlant, setSelectedPlant] = useState<number | null>(null)
  const [addingPlantToRowId, setAddingPlantToRowId] = useState<number | null>(null)
  const [isAddPlantDialogOpen, setIsAddPlantDialogOpen] = useState(false)

  // Load user's gardens
  useEffect(() => {
    const loadGardens = async () => {
      try {
        const userGardens = await getUserGardens(userId)
        setGardens(userGardens)

        if (userGardens.length > 0) {
          setCurrentGardenId(userGardens[0].id)
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load your gardens",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadGardens()
  }, [userId, toast])

  // Load plants - only once
  useEffect(() => {
    const loadPlants = async () => {
      try {
        const allPlants = await getPlants()
        setPlants(allPlants)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load plants",
          variant: "destructive",
        })
      }
    }

    loadPlants()
  }, [toast])

  // Load rows when garden changes
  const loadRows = useCallback(async () => {
    if (!currentGardenId) return

    try {
      const gardenRows = await getGardenRows(currentGardenId)

      // Load plants for each row
      const rowsWithPlants = await Promise.all(
        gardenRows.map(async (row) => {
          try {
            const plants = await getRowPlants(row.id)
            return { ...row, plants: plants || [] }
          } catch (error) {
            console.error(`Error loading plants for row ${row.id}:`, error)
            return { ...row, plants: [] }
          }
        }),
      )

      setRows(rowsWithPlants)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load garden rows",
        variant: "destructive",
      })
    }
  }, [currentGardenId, toast])

  useEffect(() => {
    loadRows()
  }, [currentGardenId, loadRows])

  // Garden Management
  const addGarden = async () => {
    if (newGardenName.trim() === "") return

    try {
      const newGarden = await createUserGarden(userId, newGardenName)
      setGardens([...gardens, newGarden])
      setCurrentGardenId(newGarden.id)
      setNewGardenName("")
      setIsAddingGarden(false)

      toast({
        title: "Garden created",
        description: `${newGarden.name} has been created successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create garden",
        variant: "destructive",
      })
    }
  }

  const deleteGarden = async (gardenId: number) => {
    if (gardens.length <= 1) {
      toast({
        title: "Cannot delete",
        description: "You must have at least one garden",
        variant: "destructive",
      })
      return
    }

    try {
      await deleteUserGarden(gardenId, userId)
      const newGardens = gardens.filter((g) => g.id !== gardenId)
      setGardens(newGardens)

      // If we deleted the current garden, switch to the first available
      if (gardenId === currentGardenId) {
        setCurrentGardenId(newGardens[0].id)
      }

      toast({
        title: "Garden deleted",
        description: "Garden has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete garden",
        variant: "destructive",
      })
    }
  }

  const startEditGarden = (garden: Garden) => {
    setEditingGarden({ ...garden })
  }

  const saveGardenEdit = async () => {
    if (!editingGarden) return

    try {
      const updatedGarden = await updateUserGarden(editingGarden.id, userId, editingGarden.name)
      setGardens(gardens.map((g) => (g.id === editingGarden.id ? updatedGarden : g)))
      setEditingGarden(null)

      toast({
        title: "Garden updated",
        description: `${updatedGarden.name} has been updated successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update garden",
        variant: "destructive",
      })
    }
  }

  // Row Management
  const addRow = async () => {
    if (newRowName.trim() === "" || !currentGardenId) return

    try {
      const newRow = await createGardenRow(currentGardenId, newRowName, newRowLength)
      setRows([...rows, { ...newRow, plants: [] }])
      setNewRowName("")
      setNewRowLength(240)
      setIsAddingRow(false)

      toast({
        title: "Row added",
        description: `${newRow.name} has been added successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add row",
        variant: "destructive",
      })
    }
  }

  const deleteRow = async (rowId: number) => {
    try {
      await deleteGardenRow(rowId)
      setRows(rows.filter((row) => row.id !== rowId))

      toast({
        title: "Row deleted",
        description: "Row has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete row",
        variant: "destructive",
      })
    }
  }

  const startEditRow = (row: GardenRow) => {
    setEditingRow({ ...row })
  }

  const saveRowEdit = async () => {
    if (!editingRow) return

    try {
      const updatedRow = await updateGardenRow(editingRow.id, editingRow.name, editingRow.length)
      setRows(rows.map((row) => (row.id === editingRow.id ? { ...updatedRow, plants: row.plants } : row)))
      setEditingRow(null)

      toast({
        title: "Row updated",
        description: `${updatedRow.name} has been updated successfully`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update row",
        variant: "destructive",
      })
    }
  }

  // Plant Management
  const addPlantToRow = async (rowId: number) => {
    if (!selectedPlant) return

    const row = rows.find((r) => r.id === rowId)
    if (!row) return

    const plant = plants.find((p) => p.id === selectedPlant)
    if (!plant) return

    // Find the next available position
    let position = 0
    const rowPlants = row.plants || []
    const sortedPlants = [...rowPlants].sort((a, b) => a.position - b.position)

    if (sortedPlants.length > 0) {
      const lastPlant = sortedPlants[sortedPlants.length - 1]
      position = lastPlant.position + (lastPlant.spacing || 0)
    }

    // Check if there's enough space at the end of the row
    if (position + plant.spacing > row.length) {
      toast({
        title: "Not enough space",
        description: "There's not enough space in this row for this plant",
        variant: "destructive",
      })
      return
    }

    try {
      setAddingPlantLoading(rowId)

      // Optimistically update the UI
      const optimisticPlantInstance: PlantInstance = {
        id: -1, // Temporary ID
        plant_id: selectedPlant,
        position: position,
        name: plant.name,
        spacing: plant.spacing,
        image_url: plant.image_url,
      }

      // Update the UI immediately
      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: [...(r.plants || []), optimisticPlantInstance],
            }
          }
          return r
        }),
      )

      // Close the dialog immediately
      setIsAddPlantDialogOpen(false)
      setSelectedPlant(null)

      // Make the actual server call
      const newPlantInstance = await serverAddPlantToRow(rowId, selectedPlant, position)

      // Update with the real data from the server
      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: [
                ...(r.plants || []).filter((p) => p.id !== -1), // Remove the optimistic entry
                newPlantInstance,
              ],
            }
          }
          return r
        }),
      )

      toast({
        title: "Plant added",
        description: `${plant.name} has been added to the row`,
      })
    } catch (error) {
      // Revert the optimistic update on error
      setRows(
        rows.map((r) => {
          if (r.id === rowId) {
            return {
              ...r,
              plants: (r.plants || []).filter((p) => p.id !== -1),
            }
          }
          return r
        }),
      )

      toast({
        title: "Error",
        description: "Failed to add plant",
        variant: "destructive",
      })
    } finally {
      setAddingPlantLoading(null)
    }
  }

  const removePlant = async (rowId: number, plantInstanceId: number) => {
    try {
      // Optimistically update UI
      const updatedRows = rows.map((row) => {
        if (row.id === rowId) {
          return {
            ...row,
            plants: (row.plants || []).filter((p) => p.id !== plantInstanceId),
          }
        }
        return row
      })
      setRows(updatedRows)

      // Make the server call
      await removePlantFromRow(plantInstanceId)

      toast({
        title: "Plant removed",
        description: "Plant has been removed successfully",
      })
    } catch (error) {
      // If there's an error, reload the rows to get the correct state
      loadRows()

      toast({
        title: "Error",
        description: "Failed to remove plant",
        variant: "destructive",
      })
    }
  }

  // Logout handler
  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/login")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  // Calculate used space in a row
  const calculateUsedSpace = useCallback((row: GardenRow): number => {
    if (!row.plants || !Array.isArray(row.plants)) {
      return 0
    }

    return row.plants.reduce((total, plant) => {
      // Check if plant and plant.spacing exist before using them
      if (plant && typeof plant.spacing === "number") {
        return total + plant.spacing
      }
      return total
    }, 0)
  }, [])

  // Memoize the current garden name
  const currentGardenName = useMemo(() => {
    return gardens.find((g) => g.id === currentGardenId)?.name || "Select Garden"
  }, [gardens, currentGardenId])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Loading your gardens...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with Garden Selector */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Garden Planner</h1>

        <div className="flex items-center gap-2">
          {gardens.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Home size={16} />
                  {currentGardenName}
                  <ChevronDown size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {gardens.map((garden) => (
                  <DropdownMenuItem
                    key={garden.id}
                    onClick={() => setCurrentGardenId(garden.id)}
                    className={garden.id === currentGardenId ? "bg-muted" : ""}
                  >
                    {garden.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onClick={() => setIsAddingGarden(true)}>
                  <Plus size={16} className="mr-2" />
                  Add New Garden
                </DropdownMenuItem>
                {gardens.length > 1 && currentGardenId && (
                  <DropdownMenuItem onClick={() => deleteGarden(currentGardenId)} className="text-destructive">
                    <Trash2 size={16} className="mr-2" />
                    Delete Current Garden
                  </DropdownMenuItem>
                )}
                {currentGardenId && (
                  <DropdownMenuItem onClick={() => startEditGarden(gardens.find((g) => g.id === currentGardenId)!)}>
                    <Edit size={16} className="mr-2" />
                    Rename Garden
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </Button>
        </div>
      </div>

      {/* Add Garden Dialog */}
      <Dialog open={isAddingGarden} onOpenChange={setIsAddingGarden}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Garden</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="garden-name">Garden Name</Label>
              <Input
                id="garden-name"
                value={newGardenName}
                onChange={(e) => setNewGardenName(e.target.value)}
                placeholder="e.g., Backyard Garden"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={addGarden}>Create Garden</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Garden Dialog */}
      {editingGarden && (
        <Dialog open={!!editingGarden} onOpenChange={(open) => !open && setEditingGarden(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Garden</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-garden-name">Garden Name</Label>
                <Input
                  id="edit-garden-name"
                  value={editingGarden.name}
                  onChange={(e) => setEditingGarden({ ...editingGarden, name: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveGardenEdit}>
                <Save size={16} className="mr-1" /> Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* No Gardens State */}
      {gardens.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-4">You don't have any gardens yet.</p>
          <Button onClick={() => setIsAddingGarden(true)}>
            <Plus size={16} className="mr-2" />
            Create Your First Garden
          </Button>
        </div>
      ) : (
        <>
          {/* Add Row Button */}
          <div className="mb-8">
            <Dialog open={isAddingRow} onOpenChange={setIsAddingRow}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus size={16} />
                  Add Garden Row
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Garden Row</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="row-name">Row Name</Label>
                    <Input
                      id="row-name"
                      value={newRowName}
                      onChange={(e) => setNewRowName(e.target.value)}
                      placeholder="e.g., Tomato Row"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="row-length">Row Length (cm)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        id="row-length"
                        value={[newRowLength]}
                        onValueChange={(value) => setNewRowLength(value[0])}
                        min={30}
                        max={600}
                        step={30}
                        className="flex-1"
                      />
                      <span className="w-16 text-right">
                        {newRowLength} cm ({(newRowLength / 100).toFixed(1)} m)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={addRow}>Add Row</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Garden Rows */}
          <div className="space-y-8">
            {rows.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  No garden rows yet in {currentGardenName}. Add your first row to get started!
                </p>
              </div>
            ) : (
              rows.map((row) => (
                <div key={row.id} className="border rounded-lg p-4">
                  {/* Row Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{row.name}</h2>
                      <p className="text-sm text-muted-foreground">
                        {row.length} cm ({(row.length / 100).toFixed(1)} m) • {calculateUsedSpace(row)} cm used •
                        {row.length - calculateUsedSpace(row)} cm available
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Dialog
                        open={isAddPlantDialogOpen && addingPlantToRowId === row.id}
                        onOpenChange={(open) => {
                          setIsAddPlantDialogOpen(open)
                          if (!open) setAddingPlantToRowId(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAddingPlantToRowId(row.id)
                              setIsAddPlantDialogOpen(true)
                            }}
                            disabled={addingPlantLoading === row.id}
                          >
                            {addingPlantLoading === row.id ? (
                              <>
                                <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Adding...
                              </>
                            ) : (
                              <>
                                <Plus size={16} className="mr-1" /> Add Plant
                              </>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Plant to {row.name}</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="plant-select">Select Plant</Label>
                              <Select
                                value={selectedPlant?.toString() || ""}
                                onValueChange={(value) => setSelectedPlant(Number.parseInt(value))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a plant" />
                                </SelectTrigger>
                                <SelectContent>
                                  {plants.map((plant) => (
                                    <SelectItem key={plant.id} value={plant.id.toString()}>
                                      {plant.name} (spacing: {plant.spacing} cm)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button onClick={() => addPlantToRow(row.id)}>Add Plant</Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button variant="outline" size="sm" onClick={() => startEditRow(row)}>
                        <Edit size={16} className="mr-1" /> Edit
                      </Button>

                      <Button variant="destructive" size="sm" onClick={() => deleteRow(row.id)}>
                        <Trash2 size={16} className="mr-1" /> Delete
                      </Button>
                    </div>
                  </div>

                  {/* Row Visualization */}
                  <div className="relative h-32 bg-muted rounded-lg overflow-x-auto">
                    <div
                      className="absolute top-0 left-0 h-full flex items-center"
                      style={{ width: `${row.length * 3}px`, minWidth: "100%" }}
                    >
                      {/* Ruler markings */}
                      {Array.from({ length: Math.ceil(row.length / 100) + 1 }).map((_, i) => (
                        <div key={i} className="absolute h-full" style={{ left: `${i * 300}px` }}>
                          <div className="absolute bottom-0 h-4 border-l border-muted-foreground"></div>
                          <div className="absolute bottom-0 text-xs text-muted-foreground" style={{ left: "4px" }}>
                            {i}m
                          </div>
                        </div>
                      ))}

                      {/* Plants */}
                      {(row.plants || [])
                        .filter((plantInstance) => plantInstance && typeof plantInstance === "object")
                        .sort((a, b) => a.position - b.position)
                        .map((plantInstance, index, sortedPlants) => {
                          // Calculate the actual visual position based on previous plants
                          let visualPosition = plantInstance.position

                          // If we're using stacked positioning, calculate based on previous plants
                          if (index > 0) {
                            const prevPlant = sortedPlants[index - 1]
                            visualPosition = prevPlant.position + (prevPlant.spacing || 0)
                          }

                          return (
                            <div
                              key={plantInstance.id}
                              className="absolute top-2 bottom-6"
                              style={{
                                left: `${visualPosition * 3}px`,
                                width: `${(plantInstance.spacing || 0) * 3}px`,
                              }}
                            >
                              <Card className="h-full flex flex-col">
                                <CardHeader className="p-2">
                                  <CardTitle className="text-xs truncate">
                                    {plantInstance.name || "Unknown Plant"}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-2 flex-1 flex items-center justify-center">
                                  <CloudinaryImage
                                    src={plantInstance.image_url || "/placeholder.svg?height=80&width=80"}
                                    alt={plantInstance.name || "Flower"}
                                    width={40}
                                    height={40}
                                    objectFit="contain"
                                    className="max-h-full"
                                  />
                                </CardContent>
                                <CardFooter className="p-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => removePlant(row.id, plantInstance.id)}
                                  >
                                    <Trash2 size={12} />
                                    <span className="sr-only">Remove plant</span>
                                  </Button>
                                </CardFooter>
                              </Card>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Edit Row Dialog */}
      {editingRow && (
        <Dialog open={!!editingRow} onOpenChange={(open) => !open && setEditingRow(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Row</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-row-name">Row Name</Label>
                <Input
                  id="edit-row-name"
                  value={editingRow.name}
                  onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-row-length">Row Length (cm)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    id="edit-row-length"
                    value={[editingRow.length]}
                    onValueChange={(value) => setEditingRow({ ...editingRow, length: value[0] })}
                    min={30}
                    max={600}
                    step={30}
                    className="flex-1"
                  />
                  <span className="w-16 text-right">
                    {editingRow.length} cm ({(editingRow.length / 100).toFixed(1)} m)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveRowEdit}>
                <Save size={16} className="mr-1" /> Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
