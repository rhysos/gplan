"use client"

import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface RowProgressProps {
  usedPercentage: number
  isNearlyFull: boolean
}

export function RowProgress({ usedPercentage, isNearlyFull }: RowProgressProps) {
  return (
    <div className="mb-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium">Space Usage</span>
        <Badge variant={isNearlyFull ? "destructive" : "outline"} className="text-xs">
          {usedPercentage}%
        </Badge>
      </div>
      <Progress
        value={usedPercentage}
        className="h-2"
        indicatorClassName={isNearlyFull ? "bg-destructive" : "bg-primary"}
      />
    </div>
  )
}
