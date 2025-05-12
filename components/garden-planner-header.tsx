"use client"
import { Plus, Trash2, Edit, Home, ChevronDown, LogOut, LayoutGrid, Menu, X, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Garden {
  id: number
  name: string
}

interface GardenPlannerHeaderProps {
  gardens: Garden[]
  currentGardenId: number | null
  setCurrentGardenId: (id: number) => void
  currentGardenName: string
  isAddingGarden: boolean
  setIsAddingGarden: (value: boolean) => void
  startEditGarden: (garden: Garden) => void
  deleteGarden: (gardenId: number) => void
  handleLogout: () => void
  viewMode: "list" | "grid"
  setViewMode: (mode: "list" | "grid") => void
  isMobileMenuOpen: boolean
  setIsMobileMenuOpen: (value: boolean) => void
  isInstructionsOpen: boolean
  setIsInstructionsOpen: (value: boolean) => void
}

export function GardenPlannerHeader({
  gardens,
  currentGardenId,
  setCurrentGardenId,
  currentGardenName,
  isAddingGarden,
  setIsAddingGarden,
  startEditGarden,
  deleteGarden,
  handleLogout,
  viewMode,
  setViewMode,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isInstructionsOpen,
  setIsInstructionsOpen,
}: GardenPlannerHeaderProps) {
  return (
    <header className="mb-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Three-part layout: Garden Selector | Instructions Panel | View Controls */}
        <div className="flex items-center justify-between w-full md:w-auto">
          {/* Garden Selector (Left aligned) */}
          <div className="flex-shrink-0">
            {gardens.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all text-xs"
                  >
                    <Home size={14} className="text-primary" />
                    <span className="font-medium">{currentGardenName}</span>
                    <ChevronDown size={14} className="text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {gardens.map((garden) => (
                    <DropdownMenuItem
                      key={garden.id}
                      onClick={() => setCurrentGardenId(garden.id)}
                      className={garden.id === currentGardenId ? "bg-primary/10 text-primary font-medium" : ""}
                    >
                      {garden.name}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setIsAddingGarden(true)} className="text-primary">
                    <Plus size={16} className="mr-2" />
                    Add New Garden
                  </DropdownMenuItem>
                  {currentGardenId && gardens.length > 1 && (
                    <DropdownMenuItem onClick={() => deleteGarden(currentGardenId)} className="text-destructive">
                      <Trash2 size={16} className="mr-2" />
                      Delete {currentGardenName}
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
          </div>

          {/* Instructions Button (Middle) - Mobile version */}
          <div className="md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsInstructionsOpen(true)}
              aria-label="Show Instructions"
              className="h-9 w-9"
            >
              <Lightbulb className="h-5 w-5 text-amber-500" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Instructions Button (Middle) */}
        <div className="hidden md:flex flex-1 justify-left">
          <div className="mx-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsInstructionsOpen(true)}
              aria-label="Show Instructions"
              className="h-9 w-9"
            >
              <Lightbulb className="h-5 w-5 text-amber-500" />
            </Button>
          </div>
        </div>

        {/* View Controls and Logout (Right aligned) */}
        <div className="hidden md:flex items-center gap-3">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "list" | "grid")}>
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
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut size={18} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Logout</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
          <div className="space-y-3">
            {gardens.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Current Garden</p>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span>{currentGardenName}</span>
                      <ChevronDown size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-full">
                    {gardens.map((garden) => (
                      <DropdownMenuItem
                        key={garden.id}
                        onClick={() => setCurrentGardenId(garden.id)}
                        className={garden.id === currentGardenId ? "bg-primary/10 text-primary font-medium" : ""}
                      >
                        {garden.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsAddingGarden(true)} className="text-primary">
                      <Plus size={16} className="mr-2" />
                      Add New Garden
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-primary text-white" : ""}
              >
                <Menu size={16} className="mr-2" />
                List
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-primary text-white" : ""}
              >
                <LayoutGrid size={16} className="mr-2" />
                Grid
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
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
