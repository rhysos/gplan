"use client"

import { useState } from "react"
import { LogOut, Menu, X, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GardenSelector } from "@/components/gardens"

interface HeaderProps {
  gardens: any[]
  currentGardenId: number | null
  viewMode: "list" | "grid"
  onSelectGarden: (gardenId: number) => void
  onAddGarden: (name: string) => Promise<any>
  onUpdateGarden: (gardenId: number, name: string) => Promise<any>
  onDeleteGarden: (gardenId: number) => Promise<boolean>
  onChangeViewMode: (mode: "list" | "grid") => void
  onLogout: () => void
}

export function Header({
  gardens,
  currentGardenId,
  viewMode,
  onSelectGarden,
  onAddGarden,
  onUpdateGarden,
  onDeleteGarden,
  onChangeViewMode,
  onLogout,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="mb-4">
      <div className="flex items-center justify-between gap-4">
        {/* Garden Selector (Left aligned) */}
        <div className="flex items-center">
          {gardens.length > 0 && (
            <GardenSelector
              gardens={gardens}
              currentGardenId={currentGardenId}
              onSelectGarden={onSelectGarden}
              onAddGarden={onAddGarden}
              onUpdateGarden={onUpdateGarden}
              onDeleteGarden={onDeleteGarden}
            />
          )}
        </div>

        {/* View Controls and Logout (Right aligned) */}
        <div className="flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(value) => onChangeViewMode(value as "list" | "grid")}>
            <TabsList className="bg-muted/30">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <Menu size={16} />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>List View</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger value="grid" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <LayoutGrid size={16} />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Grid View</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </TabsList>
          </Tabs>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Sign out</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <div className="space-y-3">
            {gardens.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Current Garden</p>
                <GardenSelector
                  gardens={gardens}
                  currentGardenId={currentGardenId}
                  onSelectGarden={onSelectGarden}
                  onAddGarden={onAddGarden}
                  onUpdateGarden={onUpdateGarden}
                  onDeleteGarden={onDeleteGarden}
                />
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeViewMode("list")}
                className={viewMode === "list" ? "bg-primary text-white" : ""}
              >
                <Menu size={16} className="mr-2" />
                List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChangeViewMode("grid")}
                className={viewMode === "grid" ? "bg-primary text-white" : ""}
              >
                <LayoutGrid size={16} className="mr-2" />
                Grid
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
