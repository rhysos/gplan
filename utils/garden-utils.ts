import type { GardenRow, Plant } from "@/types"

/**
 * Calculate used space in a row
 */
export const calculateUsedSpace = (row: GardenRow, newPlant?: Plant): number => {
  let totalSpace = 2 * (row.row_ends || 0)

  if (!row.plants || !Array.isArray(row.plants) || row.plants.length === 0) {
    return totalSpace
  }

  const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)

  if (newPlant) {
    let position = row.row_ends || 0
    if (sortedPlants.length > 0) {
      const lastPlant = sortedPlants[sortedPlants.length - 1]
      position = lastPlant.position + lastPlant.spacing
    }

    sortedPlants.push({
      id: -1,
      plant_id: -1,
      position,
      name: newPlant.name,
      spacing: newPlant.spacing,
      image_url: newPlant.image_url,
    })
  }

  if (sortedPlants.length === 1) {
    totalSpace += sortedPlants[0].spacing
  } else if (sortedPlants.length > 1) {
    const firstPlant = sortedPlants[0]
    const lastPlant = sortedPlants[sortedPlants.length - 1]

    const plantsSpace = lastPlant.position + lastPlant.spacing - firstPlant.position
    totalSpace += plantsSpace
  }

  return totalSpace
}

/**
 * Calculate the percentage of used space in a row
 */
export const calculateUsedPercentage = (row: GardenRow): number => {
  const usedSpace = calculateUsedSpace(row)
  return Math.min(100, Math.round((usedSpace / row.length) * 100))
}

/**
 * Check if a plant would fit in a row
 */
export const wouldPlantFit = (row: GardenRow, plant: Plant): boolean => {
  const usedSpace = calculateUsedSpace(row, plant)
  return usedSpace <= row.length
}
