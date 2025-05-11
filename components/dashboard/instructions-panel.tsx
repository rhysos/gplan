"use client"

import { useState, useEffect, useRef } from "react"
import { X, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function InstructionsPanel() {
  const [isVisible, setIsVisible] = useState(true)
  const [alwaysHide, setAlwaysHide] = useState(false)
  const initialized = useRef(false)
  const shouldSave = useRef(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && !initialized.current) {
        initialized.current = true
        const savedAlwaysHide = localStorage.getItem("garden-planner-always-hide-instructions")
        if (savedAlwaysHide !== null) {
          const parsedValue = JSON.parse(savedAlwaysHide)
          setAlwaysHide(parsedValue)
          setIsVisible(!parsedValue)
        }
      }
    } catch (error) {
      console.error("Error loading instructions panel preferences:", error)
    }
  }, [])

  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && initialized.current && shouldSave.current) {
        localStorage.setItem("garden-planner-always-hide-instructions", JSON.stringify(alwaysHide))
        shouldSave.current = false
      }
    } catch (error) {
      console.error("Error saving instructions panel preferences:", error)
    }
  }, [alwaysHide])

  const handleHideClick = () => {
    setIsVisible(false)
  }

  const handleAlwaysHideChange = (checked: boolean) => {
    setAlwaysHide(checked)
    shouldSave.current = true
    if (checked) {
      setIsVisible(false)
    }
  }

  const handleShowClick = () => {
    setIsVisible(true)
  }

  if (!isVisible) {
    return (
      <div className="mx-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={handleShowClick}
                aria-label="Show Instructions"
                className="h-9 w-9"
              >
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show Instructions</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mx-2 relative">
      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={handleHideClick}>
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>

      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <h2 className="text-lg font-semibold">Garden Planner Instructions</h2>
      </div>

      <div className="text-sm space-y-2 mb-4">
        <p>
          <strong>Getting Started:</strong>
        </p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Create a Garden by clicking the "Add Garden" button</li>
          <li>Manage your Flower inventory in the "Flowers" tab</li>
          <li>Add Rows to your garden with the "Add Row" button</li>
          <li>Add Flowers to your rows by clicking the "+" button in each row</li>
        </ol>

        <p>
          <strong>Tips:</strong>
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>A row has a name, length and row ends</li>
          <li>Row ends represent space at both ends of a row that can't be planted</li>
          <li>Flowers have a name, image, spacing requirement and quantity</li>
          <li>You can add multiple instances of a flower until quantity reaches zero</li>
          <li>The interface will tell you how much space used and warn you when a flower doesn't fit</li>
          <li>The visualization shows how your garden will look</li>
        </ul>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="always-hide" checked={alwaysHide} onCheckedChange={handleAlwaysHideChange} />
        <label
          htmlFor="always-hide"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Always hide instructions
        </label>
      </div>
    </div>
  )
}
