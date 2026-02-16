'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from 'lucide-react'
import { uploadFile } from "@/utils/storage"

interface CollageImage {
  url: string
  position: { row: number; col: number }
  id: string
  file?: File
}

interface CollageCanvasProps {
  layout: { type: string; rows: number; cols: number; minImages?: number; maxImages?: number }
  value?: { images: CollageImage[]; layout: any }
  onChange?: (data: { images: CollageImage[]; layout: any }) => void
  disabled?: boolean
  studyId?: string
  participantId?: string
}

export function CollageCanvas({ layout, value, onChange, disabled, studyId, participantId }: CollageCanvasProps) {
  const [images, setImages] = useState<CollageImage[]>(value?.images || [])
  const [draggedImage, setDraggedImage] = useState<CollageImage | null>(null)
  const [draggedOverCell, setDraggedOverCell] = useState<{ row: number; col: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (value?.images) {
      setImages(value.images)
    }
  }, [value?.images])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Check max images limit
    if (layout.maxImages && images.length + files.length > layout.maxImages) {
      alert(`Maximum ${layout.maxImages} images allowed`)
      return
    }

    const newImages: CollageImage[] = []

    for (const file of files) {
      if (file.type.startsWith('image/')) {
        // Find first available position
        const position = findAvailablePosition()
        if (!position) {
          alert('Grid is full. Remove an image to add more.')
          break
        }

        const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const objectUrl = URL.createObjectURL(file)

        newImages.push({
          url: objectUrl,
          position,
          id: imageId,
          file,
        })
      }
    }

    const updatedImages = [...images, ...newImages]
    setImages(updatedImages)
    notifyChange(updatedImages)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const findAvailablePosition = (): { row: number; col: number } | null => {
    const occupied = new Set(images.map(img => `${img.position.row}-${img.position.col}`))
    
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.cols; col++) {
        const key = `${row}-${col}`
        if (!occupied.has(key)) {
          return { row, col }
        }
      }
    }
    return null
  }

  const removeImage = (imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    setImages(updatedImages)
    notifyChange(updatedImages)
  }

  const handleDragStart = (image: CollageImage) => {
    if (disabled) return
    setDraggedImage(image)
  }

  const handleDragOver = (e: React.DragEvent, row: number, col: number) => {
    if (disabled || !draggedImage) return
    e.preventDefault()
    setDraggedOverCell({ row, col })
  }

  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    if (disabled || !draggedImage) return
    e.preventDefault()

    // Check if position is already occupied
    const occupied = images.find(
      img => img.id !== draggedImage.id && img.position.row === row && img.position.col === col
    )

    if (occupied) {
      // Swap positions
      const updatedImages = images.map(img => {
        if (img.id === draggedImage.id) {
          return { ...img, position: { row, col } }
        }
        if (img.id === occupied.id) {
          return { ...img, position: draggedImage.position }
        }
        return img
      })
      setImages(updatedImages)
      notifyChange(updatedImages)
    } else {
      // Move to empty position
      const updatedImages = images.map(img =>
        img.id === draggedImage.id ? { ...img, position: { row, col } } : img
      )
      setImages(updatedImages)
      notifyChange(updatedImages)
    }

    setDraggedImage(null)
    setDraggedOverCell(null)
  }

  const handleDragEnd = () => {
    setDraggedImage(null)
    setDraggedOverCell(null)
  }

  const notifyChange = (updatedImages: CollageImage[]) => {
    if (onChange) {
      onChange({
        images: updatedImages,
        layout,
      })
    }
  }

  const getImageAtPosition = (row: number, col: number): CollageImage | undefined => {
    return images.find(img => img.position.row === row && img.position.col === col)
  }

  const cellSize = 120 // pixels

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">
            {images.length} / {layout.maxImages || layout.rows * layout.cols} images
            {layout.minImages && ` (minimum: ${layout.minImages})`}
          </p>
        </div>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          disabled={disabled}
          className="hidden"
          id="collage-file-input"
        />
        <Button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || (layout.maxImages ? images.length >= layout.maxImages : false)}
          className="bg-gray-800 hover:bg-gray-700 text-white"
        >
          Add Images
        </Button>
      </div>

      <div
        className="inline-grid gap-2 p-4 border border-gray-800 rounded-lg bg-gray-950"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
        }}
        onDragEnd={handleDragEnd}
      >
        {Array.from({ length: layout.rows * layout.cols }).map((_, index) => {
          const row = Math.floor(index / layout.cols)
          const col = index % layout.cols
          const image = getImageAtPosition(row, col)
          const isDraggedOver = draggedOverCell?.row === row && draggedOverCell?.col === col

          return (
            <div
              key={`${row}-${col}`}
              className={`
                relative border-2 rounded transition-all
                ${image
                  ? 'border-gray-700 bg-gray-900'
                  : isDraggedOver
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-dashed border-gray-800 bg-gray-900/50'
                }
                ${!disabled && !image ? 'hover:border-gray-700' : ''}
              `}
              style={{ width: cellSize, height: cellSize }}
              onDragOver={(e) => handleDragOver(e, row, col)}
              onDrop={(e) => handleDrop(e, row, col)}
            >
              {image ? (
                <>
                  <img
                    src={image.url}
                    alt={`Collage image at ${row}, ${col}`}
                    className="w-full h-full object-cover rounded"
                    draggable={!disabled}
                    onDragStart={() => handleDragStart(image)}
                  />
                  {!disabled && (
                    <Button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 h-auto w-auto"
                      size="sm"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                  {isDraggedOver ? 'Drop here' : ''}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {layout.minImages && images.length < layout.minImages && (
        <p className="text-sm text-yellow-400">
          Please add at least {layout.minImages} images
        </p>
      )}
    </div>
  )
}
