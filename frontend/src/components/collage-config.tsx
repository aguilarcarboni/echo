'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface CollageLayout {
  type: string
  rows: number
  cols: number
  minImages?: number
  maxImages?: number
}

interface CollageConfigProps {
  value?: { layout?: CollageLayout }
  onSave: (config: { layout: CollageLayout }) => void
  onCancel: () => void
}

const PRESETS = [
  { name: '2x2 Grid', rows: 2, cols: 2, maxImages: 4 },
  { name: '3x3 Grid', rows: 3, cols: 3, maxImages: 9 },
  { name: '4x4 Grid', rows: 4, cols: 4, maxImages: 16 },
]

export function CollageConfig({ value, onSave, onCancel }: CollageConfigProps) {
  const [layout, setLayout] = useState<CollageLayout>(
    value?.layout || { type: 'grid', rows: 3, cols: 3, minImages: 1, maxImages: 9 }
  )
  const [isCustom, setIsCustom] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (value?.layout) {
      setLayout(value.layout)
      // Check if it matches a preset
      const matchesPreset = PRESETS.some(
        p => p.rows === value.layout.rows && p.cols === value.layout.cols
      )
      setIsCustom(!matchesPreset)
    }
  }, [value])

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setLayout({
      type: 'grid',
      rows: preset.rows,
      cols: preset.cols,
      minImages: 1,
      maxImages: preset.maxImages
    })
    setIsCustom(false)
    setError(null)
  }

  const updateLayout = (field: keyof CollageLayout, value: number | string) => {
    const updated = { ...layout, [field]: value }
    // Auto-update maxImages if rows/cols change
    if (field === 'rows' || field === 'cols') {
      updated.maxImages = updated.rows * updated.cols
    }
    setLayout(updated)
    setError(null)
  }

  const validateLayout = (): boolean => {
    if (layout.rows < 1 || layout.rows > 10) {
      setError('Rows must be between 1 and 10')
      return false
    }
    if (layout.cols < 1 || layout.cols > 10) {
      setError('Columns must be between 1 and 10')
      return false
    }
    if (layout.minImages !== undefined && layout.minImages < 1) {
      setError('Minimum images must be at least 1')
      return false
    }
    if (layout.maxImages !== undefined && layout.maxImages > layout.rows * layout.cols) {
      setError(`Maximum images cannot exceed grid size (${layout.rows * layout.cols})`)
      return false
    }
    if (layout.minImages !== undefined && layout.maxImages !== undefined && layout.minImages > layout.maxImages) {
      setError('Minimum images cannot exceed maximum images')
      return false
    }
    setError(null)
    return true
  }

  const handleSave = () => {
    if (validateLayout()) {
      onSave({ layout })
    }
  }

  const totalCells = layout.rows * layout.cols

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-white">Layout Configuration</Label>

        {/* Preset Templates */}
        <div className="space-y-2">
          <Label className="text-gray-400 text-sm">Preset Templates</Label>
          <div className="grid grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <Button
                key={preset.name}
                type="button"
                onClick={() => selectPreset(preset)}
                variant={!isCustom && layout.rows === preset.rows && layout.cols === preset.cols ? 'default' : 'outline'}
                className={
                  !isCustom && layout.rows === preset.rows && layout.cols === preset.cols
                    ? 'bg-pink-500 hover:bg-pink-600 text-white'
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                }
              >
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Option */}
        <div className="space-y-2">
          <Button
            type="button"
            onClick={() => setIsCustom(true)}
            variant={isCustom ? 'default' : 'outline'}
            className={
              isCustom
                ? 'bg-pink-500 hover:bg-pink-600 text-white'
                : 'border-gray-700 text-gray-300 hover:bg-gray-800'
            }
          >
            Custom Layout
          </Button>
        </div>

        {/* Custom Layout Inputs */}
        {isCustom && (
          <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rows" className="text-white text-sm">
                  Rows
                </Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="10"
                  value={layout.rows}
                  onChange={(e) => updateLayout('rows', parseInt(e.target.value) || 1)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
              <div>
                <Label htmlFor="cols" className="text-white text-sm">
                  Columns
                </Label>
                <Input
                  id="cols"
                  type="number"
                  min="1"
                  max="10"
                  value={layout.cols}
                  onChange={(e) => updateLayout('cols', parseInt(e.target.value) || 1)}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Min/Max Images */}
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minImages" className="text-white text-sm">
                Minimum Images <span className="text-gray-500">(optional)</span>
              </Label>
              <Input
                id="minImages"
                type="number"
                min="1"
                value={layout.minImages || ''}
                onChange={(e) => updateLayout('minImages', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="1"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div>
              <Label htmlFor="maxImages" className="text-white text-sm">
                Maximum Images <span className="text-gray-500">(optional)</span>
              </Label>
              <Input
                id="maxImages"
                type="number"
                min="1"
                max={totalCells}
                value={layout.maxImages || ''}
                onChange={(e) => updateLayout('maxImages', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder={totalCells.toString()}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>
        </div>

        {/* Grid Preview */}
        <div className="space-y-2">
          <Label className="text-gray-400 text-sm">Grid Preview</Label>
          <div
            className="inline-grid gap-1 p-4 border border-gray-800 rounded-lg bg-gray-950"
            style={{
              gridTemplateColumns: `repeat(${layout.cols}, 20px)`,
              gridTemplateRows: `repeat(${layout.rows}, 20px)`,
            }}
          >
            {Array.from({ length: totalCells }).map((_, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded border border-gray-700 bg-gray-800"
              />
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Grid size: {layout.rows} × {layout.cols} = {totalCells} cells
          </p>
        </div>

        {error && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
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
          disabled={!!error}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
