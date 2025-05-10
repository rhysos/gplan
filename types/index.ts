// Garden Planner Types
export interface Plant {
  id: number
  name: string
  spacing: number
  image_url: string
  quantity?: number
  used_count?: number
}

export interface PlantInstance {
  id: number
  plant_id: number
  position: number
  name: string
  spacing: number
  image_url: string | null
  animationState?: "entering" | "exiting" | "moving-left" | "moving-right" | null
}

export interface GardenRow {
  id: number
  name: string
  length: number
  row_ends: number
  plants?: PlantInstance[]
  isActive?: boolean
}

export interface Garden {
  id: number
  name: string
}
