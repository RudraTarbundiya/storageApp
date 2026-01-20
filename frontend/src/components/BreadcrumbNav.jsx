import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BreadcrumbNav({ items, onNavigate }) {
  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto pb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="h-8 px-2 hover:bg-accent"
      >
        <Home className="h-4 w-4" />
      </Button>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className="h-8 px-2 hover:bg-accent whitespace-nowrap"
          >
            {item.name}
          </Button>
        </div>
      ))}
    </div>
  )
}