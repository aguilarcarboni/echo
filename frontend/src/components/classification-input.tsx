'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Badge } from "@/components/ui/badge"

interface ClassificationItem {
  id: string
  label: string
  image?: string
}

interface ClassificationInputProps {
  items: ClassificationItem[]
  value?: Array<{ itemId: string; rank: number; label: string }>
  onChange?: (rankings: Array<{ itemId: string; rank: number; label: string }>) => void
  disabled?: boolean
}

function SortableItem({ item, rank, disabled }: { item: ClassificationItem; rank: number; disabled?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-4 p-4 rounded-lg border ${
        isDragging
          ? 'border-pink-500 bg-pink-500/10'
          : 'border-gray-800 bg-gray-900'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-move'}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={`flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <GripVertical className="w-5 h-5 text-gray-500" />
      </div>
      <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/20 min-w-[2rem] justify-center">
        #{rank}
      </Badge>
      {item.image && (
        <img
          src={item.image}
          alt={item.label}
          className="w-12 h-12 object-cover rounded"
        />
      )}
      <span className="text-white flex-1">{item.label}</span>
    </div>
  )
}

export function ClassificationInput({ items, value, onChange, disabled }: ClassificationInputProps) {
  const [rankedItems, setRankedItems] = useState<ClassificationItem[]>(items)

  // Initialize from value if provided
  useEffect(() => {
    if (value && value.length > 0) {
      // Sort items based on rankings
      const sorted = [...items].sort((a, b) => {
        const rankA = value.find(r => r.itemId === a.id)?.rank || 999
        const rankB = value.find(r => r.itemId === b.id)?.rank || 999
        return rankA - rankB
      })
      setRankedItems(sorted)
    } else {
      setRankedItems(items)
    }
  }, [items, value])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setRankedItems((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Generate rankings
        const rankings = newItems.map((item, index) => ({
          itemId: item.id,
          rank: index + 1,
          label: item.label,
        }))
        
        if (onChange) {
          onChange(rankings)
        }
        
        return newItems
      })
    }
  }

  // Generate current rankings
  const currentRankings = rankedItems.map((item, index) => ({
    itemId: item.id,
    rank: index + 1,
    label: item.label,
  }))

  // Notify parent of current rankings
  useEffect(() => {
    if (onChange && rankedItems.length > 0) {
      onChange(currentRankings)
    }
  }, [rankedItems])

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">
        Drag and drop items to rank them from highest to lowest preference
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rankedItems.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {rankedItems.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                rank={rankedItems.indexOf(item) + 1}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
