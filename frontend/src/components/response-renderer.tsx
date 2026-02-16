'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ResponseRendererProps {
  responseData: any
  taskType: string
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    const parts = [`${hours}h`]
    if (mins > 0) parts.push(`${mins}m`)
    if (secs > 0) parts.push(`${secs}s`)
    return parts.join(' ')
  }
}

function VideoPlayer({ url }: { url: string }) {
  return (
    <video
      src={url}
      controls
      className="w-full h-full object-contain"
      preload="metadata"
      crossOrigin="anonymous"
      onError={(e) => {
        console.error('Video load error:', e)
        const target = e.target as HTMLVideoElement
        const errorMsg = document.createElement('div')
        errorMsg.className = 'absolute inset-0 flex items-center justify-center bg-gray-900/90 text-red-400 text-sm p-4 text-center'
        errorMsg.innerHTML = `
          <div>
            <p>Failed to load video</p>
            <p class="text-xs text-gray-500 mt-2">URL: ${url.substring(0, 50)}...</p>
            <p class="text-xs text-gray-500 mt-1">Make sure the storage bucket is public and the URL is correct.</p>
          </div>
        `
        target.parentElement?.appendChild(errorMsg)
      }}
    >
      <source src={url} type="video/webm" />
      <source src={url} type="video/mp4" />
      Your browser does not support the video tag.
    </video>
  )
}

export function ResponseRenderer({ responseData, taskType }: ResponseRendererProps) {
  // Handle string responses (shouldn't happen if parent component parses correctly, but be safe)
  let parsedData = responseData
  if (typeof responseData === 'string') {
    try {
      parsedData = JSON.parse(responseData)
    } catch {
      // If it's not JSON, treat it as plain text
      if (taskType === 'discussion' || taskType === 'fill_blanks') {
        return (
          <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
            <p className="text-white whitespace-pre-wrap">{responseData}</p>
          </div>
        )
      }
      return (
        <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-gray-400 text-sm">Invalid response data format</p>
        </div>
      )
    }
  }

  if (!parsedData || typeof parsedData !== 'object' || Array.isArray(parsedData)) {
    return (
      <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
        <p className="text-gray-400 text-sm">No response data available</p>
      </div>
    )
  }

  const data = parsedData

  // Discussion - show text
  if (taskType === 'discussion') {
    return (
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
        <p className="text-white whitespace-pre-wrap">{data.text || 'No text provided'}</p>
      </div>
    )
  }

  // Fill Blanks - show filled text with highlights
  if (taskType === 'fill_blanks') {
    if (data.filledText) {
      return (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-white whitespace-pre-wrap">{data.filledText}</p>
          {data.answers && Object.keys(data.answers).length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-400 mb-2">Individual answers:</p>
              <div className="space-y-1">
                {Object.entries(data.answers).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-gray-500">{key}:</span>{' '}
                    <span className="text-white">{value as string}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
        <p className="text-gray-400 text-sm">No response provided</p>
      </div>
    )
  }

  // Camera - show video
  if (taskType === 'camera') {
    let videoUrl = data.videoUrl || data.video_url || data.video
    
    // Handle URL format - ensure it's a full URL, not just a path
    if (videoUrl && typeof videoUrl === 'string') {
      // If it's a relative path, try to construct the full Supabase Storage URL
      if (!videoUrl.startsWith('http')) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        if (supabaseUrl) {
          // Extract project reference and construct public URL
          const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '').replace('.supabase.com', '')
          if (videoUrl.startsWith('participant-uploads/')) {
            videoUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/participant-uploads/${videoUrl.replace('participant-uploads/', '')}`
          } else if (!videoUrl.includes('/')) {
            // If it's just a filename, construct the full path
            videoUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/participant-uploads/${videoUrl}`
          } else {
            // Assume it's a path within the bucket
            videoUrl = `https://${projectRef}.supabase.co/storage/v1/object/public/participant-uploads/${videoUrl}`
          }
        }
      }
      
      // Clean up double slashes and ensure proper format
      videoUrl = videoUrl.replace(/([^:]\/)\/+/g, '$1')
    }
    
    if (!videoUrl || typeof videoUrl !== 'string') {
      return (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-gray-400 text-sm">No video uploaded</p>
        </div>
      )
    }
    
    return (
      <div className="space-y-2">
        <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
          <VideoPlayer url={videoUrl} />
        </div>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-pink-500 hover:text-pink-400 underline inline-block"
        >
          Open video in new tab
        </a>
      </div>
    )
  }

  // Gallery - show images
  if (taskType === 'gallery') {
    const images = Array.isArray(data.images) ? data.images : Array.isArray(data.image_urls) ? data.image_urls : []
    if (images.length === 0) {
      return (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-gray-400 text-sm">No images uploaded</p>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        <div className={`grid gap-4 ${images.length === 1 ? 'grid-cols-1' : images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
          {images.map((imageUrl: string, index: number) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border border-gray-800 bg-gray-900">
                <img
                  src={imageUrl}
                  alt={`Response image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Handle broken image URLs
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="12"%3EImage not found%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge className="bg-black/70 text-white text-xs">
                  {index + 1}/{images.length}
                </Badge>
              </div>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors"
              >
                <span className="text-white opacity-0 group-hover:opacity-100 text-sm">View full size</span>
              </a>
            </div>
          ))}
        </div>
        {data.selectedImage && data.selectedImage !== images[0] && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-400">
              Selected image: {images.indexOf(data.selectedImage) + 1}
            </p>
          </div>
        )}
      </div>
    )
  }

  // Collage - show images with layout
  if (taskType === 'collage') {
    const images = Array.isArray(data.images) ? data.images : []
    const layout = data.layout || { type: 'grid', rows: 3, cols: 3 }
    
    if (images.length === 0) {
      return (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-gray-400 text-sm">No images uploaded</p>
        </div>
      )
    }

    // Create grid with images at their positions
    const cellSize = 120
    const gridCells: Array<{ row: number; col: number; image?: any }> = []
    
    for (let row = 0; row < layout.rows; row++) {
      for (let col = 0; col < layout.cols; col++) {
        const image = images.find((img: any) => 
          img.position && img.position.row === row && img.position.col === col
        )
        gridCells.push({ row, col, image })
      }
    }

    return (
      <div className="space-y-4">
        <div
          className="inline-grid gap-2 p-4 border border-gray-800 rounded-lg bg-gray-950"
          style={{
            gridTemplateColumns: `repeat(${layout.cols}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${layout.rows}, ${cellSize}px)`,
          }}
        >
          {gridCells.map((cell, index) => (
            <div
              key={`${cell.row}-${cell.col}`}
              className={`
                relative border-2 rounded
                ${cell.image ? 'border-gray-700 bg-gray-900' : 'border-dashed border-gray-800 bg-gray-900/50'}
              `}
              style={{ width: cellSize, height: cellSize }}
            >
              {cell.image && (
                <img
                  src={cell.image.url || cell.image}
                  alt={`Collage image at ${cell.row}, ${cell.col}`}
                  className="w-full h-full object-cover rounded"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23333" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="Arial" font-size="12"%3EImage not found%3C/text%3E%3C/svg%3E'
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Classification - show rankings if available
  if (taskType === 'classification') {
    const rankings = Array.isArray(data.rankings) ? data.rankings : Array.isArray(data.classification) ? data.classification : []
    if (rankings.length === 0) {
      return (
        <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
          <p className="text-gray-400 text-sm">No classification data available</p>
        </div>
      )
    }
    // Sort by rank if available
    const sortedRankings = [...rankings].sort((a: any, b: any) => {
      const rankA = a.rank || a.rank === 0 ? a.rank : 999
      const rankB = b.rank || b.rank === 0 ? b.rank : 999
      return rankA - rankB
    })
    return (
      <div className="space-y-2">
        {sortedRankings.map((ranking: any, index: number) => {
          const rank = ranking.rank !== undefined ? ranking.rank : index + 1
          return (
            <div key={ranking.itemId || index} className="p-3 rounded-lg bg-gray-900 border border-gray-800">
              <div className="flex items-center gap-3">
                <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/20 min-w-[2rem] justify-center">
                  #{rank}
                </Badge>
                <span className="text-white">{ranking.label || ranking.name || JSON.stringify(ranking)}</span>
                {ranking.score && (
                  <span className="ml-auto text-sm text-gray-400">Score: {ranking.score}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Fallback - show formatted JSON for unknown types
  return (
    <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
      <details className="cursor-pointer">
        <summary className="text-gray-400 text-sm mb-2 hover:text-white">
          View raw response data (task type: {taskType || 'unknown'})
        </summary>
        <pre className="text-white text-xs whitespace-pre-wrap overflow-auto max-h-64 mt-2">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  )
}
