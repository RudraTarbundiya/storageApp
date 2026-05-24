import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function BreadcrumbNav({ items, onNavigate }) {
  return (
    <div className="flex items-center gap-2 text-base overflow-x-auto pb-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate(null)}
        className="h-10 px-3 hover:bg-accent rounded-xl flex items-center gap-2 font-medium cursor-pointer"
      >
        <Home className="h-5 w-5" />
        <span>Root</span>
      </Button>

      {items.map((item, index) => (
        <div key={item.id} className="flex items-center gap-2">
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(item.id)}
            className="h-10 px-3 hover:bg-accent rounded-xl whitespace-nowrap font-medium text-base cursor-pointer"
          >
            {item.name}
          </Button>
        </div>
      ))}
    </div>
  )
}