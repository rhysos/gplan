"use client"

import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface RowProgressProps {
  usedPercentage: number
  className?: string
}

export function RowProgress({ usedPercentage, className }: RowProgressProps) {
  const isNearlyFull = usedPercentage > 90
  const isOverCapacity = usedPercentage > 100

  return (
    <div className={cn("space-y-1", className)}>
      <Progress
        value={Math.min(100, usedPercentage)}
        className="h-2"
        indicatorClassName={isOverCapacity ? "bg-destructive" : isNearlyFull ? "bg-warning" : "bg-primary"}
      />
      {isOverCapacity && (
        <p className="text-xs text-destructive">This row is over capacity by {usedPercentage - 100}%</p>
      )}
    </div>
  )
}
