"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react"

export function InstructionsPanel() {
  // Separate state variables to avoid interdependencies
  const [isVisible, setIsVisible] = useState(true)
  const [alwaysHide, setAlwaysHide] = useState(false)

  // Ref to track if we've loaded from localStorage
  const hasLoaded = useRef(false)
  // Ref to track if we should save to localStorage
  const shouldSave = useRef(false)

  // ONLY load from localStorage on mount
  useEffect(() => {
    if (!hasLoaded.current) {
      try {
        const savedValue = localStorage.getItem("garden-planner-always-hide-instructions")
        if (savedValue === "true") {
          setAlwaysHide(true)
          setIsVisible(false)
        }
      } catch (error) {
        console.error("Error reading from localStorage:", error)
      }
      hasLoaded.current = true
    }
  }, []) // Empty dependency array - only runs once on mount

  // ONLY save to localStorage when shouldSave.current is true
  useEffect(() => {
    if (hasLoaded.current && shouldSave.current) {
      try {
        localStorage.setItem("garden-planner-always-hide-instructions", alwaysHide ? "true" : "false")
      } catch (error) {
        console.error("Error writing to localStorage:", error)
      }
      shouldSave.current = false
    }
  }, [alwaysHide]) // Only depends on alwaysHide

  // Toggle visibility without causing loops
  const toggleVisibility = () => {
    if (alwaysHide && !isVisible) {
      // If showing panel and alwaysHide was true, update alwaysHide
      setAlwaysHide(false)
      shouldSave.current = true
    }
    setIsVisible((prev) => !prev)
  }

  // Handle checkbox change
  const handleAlwaysHideChange = (checked: boolean) => {
    setAlwaysHide(checked)
    shouldSave.current = true

    // If checking "always hide", also hide the panel
    if (checked) {
      setIsVisible(false)
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <Lightbulb className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-lg font-medium">Garden Planner Instructions</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleVisibility}>
          {isVisible ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" /> Hide
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" /> Show
            </>
          )}
        </Button>
      </div>

      {isVisible && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Getting Started</h3>
                <p className="text-sm text-muted-foreground">
                  Welcome to the Garden Planner! This tool helps you plan and visualize your garden rows and plants.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Creating Gardens and Rows</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Start by creating a garden using the "New Garden" button</li>
                  <li>Add rows to your garden with the "Add Row" button</li>
                  <li>Specify the length and name for each row</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Adding Plants</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Click "Add Flower" on any row to add plants</li>
                  <li>Select from available plants in your inventory</li>
                  <li>Plants will be positioned automatically in the row</li>
                  <li>You can move plants left or right within a row</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-1">Managing Your Inventory</h3>
                <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                  <li>Go to the "Flowers" tab to manage your plant inventory</li>
                  <li>Add new plants with quantities and spacing requirements</li>
                  <li>The system tracks how many plants you've used in your garden</li>
                </ul>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="always-hide"
                  checked={alwaysHide}
                  onCheckedChange={(checked) => handleAlwaysHideChange(checked === true)}
                />
                <label
                  htmlFor="always-hide"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Always hide instructions
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
