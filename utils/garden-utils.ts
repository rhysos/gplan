interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
}

interface Row {
  id: number
  garden_id: number
  name: string
  length: number
  position: number
  row_ends?: number
  plants?: any[]
}

/**
 * Calculate the total space used in a row
 */
export function calculateUsedSpace(row: Row, newPlant?: Plant): number {
  // Start with the space reserved for row ends
  let totalSpace = 2 * (row.row_ends || 0)

  // If there are no plants, just return the row ends space
  if (!row.plants || !Array.isArray(row.plants) || row.plants.length === 0) {
    // If we're checking if a new plant would fit, add its spacing
    if (newPlant) {
      totalSpace += newPlant.spacing
    }
    return totalSpace
  }

  // Sort plants by position
  const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)

  // If we're checking if a new plant would fit, add it to the end
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

  // If there's only one plant, just add its spacing
  if (sortedPlants.length === 1) {
    totalSpace += sortedPlants[0].spacing
  }
  // If there are multiple plants, calculate the total space they occupy
  else if (sortedPlants.length > 1) {
    const firstPlant = sortedPlants[0]
    const lastPlant = sortedPlants[sortedPlants.length - 1]

    // The total space is the distance from the first plant to the end of the last plant
    const plantsSpace = lastPlant.position + lastPlant.spacing - firstPlant.position
    totalSpace += plantsSpace
  }

  return totalSpace
}

/**
 * Calculate the percentage of row space used
 */
export function calculateUsedPercentage(row: Row, newPlant?: Plant): number {
  const usedSpace = calculateUsedSpace(row, newPlant)
  return Math.round((usedSpace / row.length) * 100)
}

/**
 * Check if a plant would fit in a row
 */
export function wouldPlantFit(row: Row, plant: Plant): boolean {
  const usedSpace = calculateUsedSpace(row, plant)
  return usedSpace <= row.length
}

/**
 * Calculate the optimal position for a new plant in a row
 */
export function calculateOptimalPosition(row: Row, plant: Plant): number {
  // If there are no plants, start at the row end
  if (!row.plants || row.plants.length === 0) {
    return row.row_ends || 0
  }

  // Sort plants by position
  const sortedPlants = [...row.plants].sort((a, b) => a.position - b.position)

  // Add the new plant at the end
  const lastPlant = sortedPlants[sortedPlants.length - 1]
  return lastPlant.position + lastPlant.spacing
}
