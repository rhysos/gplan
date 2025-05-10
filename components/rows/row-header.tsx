import type { Row } from "@/types"

interface RowHeaderProps {
  row: Row
}

export function RowHeader({ row }: RowHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-lg font-medium">{row.name}</h3>
        <div className="text-sm text-gray-500">
          {row.length} cm long
          {row.row_ends > 0 && (
            <span className="ml-2">
              ({row.row_ends} cm reserved for row ends, {row.length - row.row_ends} cm plantable)
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
