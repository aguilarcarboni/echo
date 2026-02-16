'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { X, Plus } from 'lucide-react'

interface ClassificationItem {
  id: string
  label: string
  image?: string
}

interface ClassificationConfigProps {
  value?: { items?: ClassificationItem[] }
  onSave: (config: { items: ClassificationItem[] }) => void
  onCancel: () => void
}

export function ClassificationConfig({ value, onSave, onCancel }: ClassificationConfigProps) {
  const [items, setItems] = useState<ClassificationItem[]>(value?.items || [])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (value?.items && value.items.length > 0) {
      setItems(value.items)
    }
  }, [value])

  const addItem = () => {
    const newItem: ClassificationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      label: '',
      image: ''
    }
    setItems([...items, newItem])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof ClassificationItem, value: string) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  const validateItems = (): boolean => {
    if (items.length < 2) {
      setError('At least 2 items are required for classification')
      return false
    }
    for (let i = 0; i < items.length; i++) {
      if (!items[i].label.trim()) {
        setError(`Item ${i + 1} must have a label`)
        return false
      }
      if (!items[i].id.trim()) {
        setError(`Item ${i + 1} must have an ID`)
        return false
      }
    }
    // Check for duplicate IDs
    const ids = items.map(item => item.id)
    if (new Set(ids).size !== ids.length) {
      setError('All items must have unique IDs')
      return false
    }
    setError(null)
    return true
  }

  const handleSave = () => {
    if (validateItems()) {
      const cleanedItems = items.map(item => ({
        id: item.id.trim(),
        label: item.label.trim(),
        image: item.image?.trim() || undefined
      }))
      onSave({ items: cleanedItems })
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-white">Items to Rank</Label>
          <Button
            type="button"
            onClick={addItem}
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {items.length === 0 && (
          <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 text-center">
            <p className="text-gray-400 mb-2">No items added yet</p>
            <p className="text-sm text-gray-500">Click "Add Item" to start</p>
          </div>
        )}

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {items.map((item, index) => (
            <div
              key={item.id || index}
              className="p-4 rounded-lg bg-gray-900 border border-gray-800 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Label className="text-gray-400 text-sm">Item {index + 1}</Label>
                <Button
                  type="button"
                  onClick={() => removeItem(index)}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-auto p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label htmlFor={`item-id-${index}`} className="text-white text-sm">
                    ID <span className="text-gray-500">(auto-generated if empty)</span>
                  </Label>
                  <Input
                    id={`item-id-${index}`}
                    value={item.id}
                    onChange={(e) => {
                      const newId = e.target.value || `item-${Date.now()}-${index}`
                      updateItem(index, 'id', newId)
                    }}
                    placeholder={`item-${index + 1}`}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor={`item-label-${index}`} className="text-white text-sm">
                    Label <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id={`item-label-${index}`}
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    placeholder="e.g., Brand A"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>

                <div>
                  <Label htmlFor={`item-image-${index}`} className="text-white text-sm">
                    Image URL <span className="text-gray-500">(optional)</span>
                  </Label>
                  <Input
                    id={`item-image-${index}`}
                    value={item.image || ''}
                    onChange={(e) => updateItem(index, 'image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    type="url"
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                  {item.image && (
                    <div className="mt-2">
                      <img
                        src={item.image}
                        alt={item.label || 'Preview'}
                        className="w-20 h-20 object-cover rounded border border-gray-700"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-400">
          <p>Participants will rank these items from highest to lowest preference.</p>
          <p className="mt-1">Minimum 2 items required.</p>
        </div>
      </div>

      <div className="flex gap-4 justify-end pt-4 border-t border-gray-800">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border-gray-800 text-gray-400 hover:bg-gray-900"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          className="bg-pink-500 hover:bg-pink-600 text-white"
          disabled={items.length < 2 || !!error}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
