'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadFile } from "@/utils/storage"
import { FillBlanksInput } from "@/components/fill-blanks-input"
import { ClassificationInput } from "@/components/classification-input"
import { CollageCanvas } from "@/components/collage-canvas"

const API_URL = 'http://127.0.0.1:5000'

interface TaskData {
  task: {
    id: string
    type: string
    title: string
    instructions: string
    order_index: number
    template?: string
    items?: Array<{ id: string; label: string; image?: string }>
    layout?: { type: string; rows: number; cols: number; minImages?: number; maxImages?: number }
  }
  participant: {
    id: string
    contact: string
  }
  existing_response?: {
    id: string
    response_data: any
  }
}

export default function ParticipantTaskPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studyId = params.studyId as string
  const taskId = params.taskId as string
  const accessCode = searchParams.get('access_code') || ''

  const [taskData, setTaskData] = useState<TaskData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Response data state
  const [textResponse, setTextResponse] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([])
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoDuration, setVideoDuration] = useState<number>(0)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [fillBlanksResponse, setFillBlanksResponse] = useState<{ answers: Record<string, string>, filledText: string } | null>(null)
  const [rankings, setRankings] = useState<Array<{ itemId: string; rank: number; label: string }>>([])
  const [collageData, setCollageData] = useState<{ images: Array<{ url: string; position: { row: number; col: number }; id: string }>, layout: any } | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (!accessCode) {
      setError('Access code is required')
      setLoading(false)
      return
    }

    loadTask()
  }, [taskId, accessCode])

  const loadTask = async () => {
    try {
      const response = await fetch(
        `${API_URL}/participant/task/${taskId}?access_code=${accessCode}&study_id=${studyId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to load task')
      }

      setTaskData(data)
      if (data.existing_response) {
        const existing = data.existing_response.response_data
        if (existing.text) setTextResponse(existing.text)
        if (existing.images) setSelectedImages(existing.images)
        if (existing.videoUrl) setUploadedUrls([existing.videoUrl])
        if (existing.answers && existing.filledText) {
          setFillBlanksResponse({ answers: existing.answers, filledText: existing.filledText })
        }
        if (existing.rankings) {
          setRankings(existing.rankings)
        }
        if (existing.images && existing.layout && data.task.type === 'collage') {
          setCollageData({ images: existing.images, layout: existing.layout })
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Handle video files for camera tasks
    if (taskData?.task.type === 'camera') {
      const videoFile = files.find(file => file.type.startsWith('video/'))
      if (videoFile) {
        setSelectedFiles([videoFile])
        // Get video duration
        const objectUrl = URL.createObjectURL(videoFile)
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.src = objectUrl
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(objectUrl)
          setVideoDuration(Math.round(video.duration))
        }
        setUploadedUrls([objectUrl])
        return
      }
    }

    // Handle images for gallery/collage tasks
    if (taskData?.task.type === 'gallery' || taskData?.task.type === 'collage') {
      setSelectedFiles([...selectedFiles, ...files])
      files.forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setSelectedImages([...selectedImages, e.target?.result as string])
          }
          reader.readAsDataURL(file)
        }
      })
    } else {
      setSelectedFiles([...selectedFiles, ...files])
    }
  }

  const startVideoRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        setVideoBlob(blob)
        const objectUrl = URL.createObjectURL(blob)
        setUploadedUrls([objectUrl])
        
        // Get video duration
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.src = objectUrl
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(objectUrl)
          setVideoDuration(Math.round(video.duration))
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      setError('Failed to access camera: ' + err.message)
    }
  }

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
      setIsRecording(false)
    }
  }

  const uploadFiles = async (): Promise<string[]> => {
    const urls: string[] = []

    // Upload video if recording
    if (videoBlob && taskData?.task.type === 'camera') {
      const videoFile = new File([videoBlob], 'video.webm', { type: 'video/webm' })
      const path = `participant-uploads/${studyId}/${taskData.participant.id}/${Date.now()}-video.webm`
      const url = await uploadFile('participant-uploads', videoFile, path)
      urls.push(url)
    }

    // Upload selected files
    for (const file of selectedFiles) {
      const path = `participant-uploads/${studyId}/${taskData?.participant.id}/${Date.now()}-${file.name}`
      const url = await uploadFile('participant-uploads', file, path)
      urls.push(url)
    }

    return urls
  }

  const handleSubmit = async () => {
    if (!taskData) return

    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      // Build response data based on task type
      let responseData: any = {}

      switch (taskData.task.type) {
        case 'discussion':
          if (!textResponse.trim()) {
            throw new Error('Please enter your response')
          }
          responseData = { text: textResponse }
          break

        case 'fill_blanks':
          if (!fillBlanksResponse || !fillBlanksResponse.filledText) {
            throw new Error('Please fill in all blanks')
          }
          // Validate all blanks are filled
          const allFilled = Object.values(fillBlanksResponse.answers).every(answer => answer.trim())
          if (!allFilled) {
            throw new Error('Please fill in all blanks before submitting')
          }
          responseData = {
            answers: fillBlanksResponse.answers,
            filledText: fillBlanksResponse.filledText
          }
          break

        case 'camera':
          if (!videoBlob && uploadedUrls.length === 0) {
            throw new Error('Please record or upload a video')
          }
          const videoUrls = await uploadFiles()
          responseData = {
            videoUrl: videoUrls[0] || uploadedUrls[0],
            duration: videoDuration || 0
          }
          break

        case 'gallery':
          if (selectedImages.length === 0 && selectedFiles.length === 0) {
            throw new Error('Please select at least one image')
          }
          const imageUrls = selectedImages.length > 0 
            ? selectedImages 
            : await uploadFiles()
          responseData = {
            images: imageUrls,
            selectedImage: imageUrls[0] // For gallery tasks
          }
          break

        case 'classification':
          if (!rankings || rankings.length === 0) {
            throw new Error('Please rank all items')
          }
          responseData = { rankings }
          break

        case 'collage':
          if (!collageData || collageData.images.length === 0) {
            throw new Error('Please add at least one image to your collage')
          }
          // Upload any images that haven't been uploaded yet (have file objects)
          const imagesToUpload = collageData.images.filter(img => img.file)
          const finalImages = [...collageData.images]
          
          if (imagesToUpload.length > 0) {
            // Upload each file
            for (let i = 0; i < imagesToUpload.length; i++) {
              const img = imagesToUpload[i]
              if (img.file) {
                const path = `participant-uploads/${studyId}/${taskData.participant.id}/${Date.now()}-${img.file.name}`
                const url = await uploadFile('participant-uploads', img.file, path)
                // Update the image in finalImages
                const imgIndex = finalImages.findIndex(fimg => fimg.id === img.id)
                if (imgIndex !== -1) {
                  finalImages[imgIndex] = {
                    ...finalImages[imgIndex],
                    url: url,
                    file: undefined
                  }
                }
              }
            }
          }
          
          responseData = {
            images: finalImages.map(({ file, ...rest }) => rest), // Remove file objects
            layout: collageData.layout
          }
          break

        default:
          responseData = { text: textResponse, files: uploadedUrls }
      }

      // Submit response
      const response = await fetch(`${API_URL}/participant/submit-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_code: accessCode,
          task_id: taskId,
          response_data: responseData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to submit response')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/participant/${studyId}?access_code=${accessCode}`)
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Spinner className="text-pink-500" />
      </div>
    )
  }

  if (error && !taskData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-950 border-gray-800 w-full max-w-md">
          <CardContent className="pt-6">
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
            <Button
              onClick={() => router.back()}
              className="mt-4 w-full bg-gray-800 hover:bg-gray-700 text-white"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!taskData) return null

  const renderTaskInput = () => {
    switch (taskData.task.type) {
      case 'discussion':
        return (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your response here..."
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 min-h-[200px]"
              disabled={submitting || !!taskData.existing_response}
            />
          </div>
        )

      case 'fill_blanks':
        if (!taskData.task.template) {
          return (
            <div className="space-y-4">
              <p className="text-gray-400 text-center py-8">
                No template provided for this task
              </p>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <FillBlanksInput
              template={taskData.task.template}
              value={fillBlanksResponse || undefined}
              onChange={(value) => setFillBlanksResponse(value)}
              disabled={submitting || !!taskData.existing_response}
            />
          </div>
        )

      case 'camera':
        return (
          <div className="space-y-4">
            {!videoBlob && uploadedUrls.length === 0 ? (
              <div className="space-y-4">
                <div className="aspect-video bg-gray-900 rounded-lg border border-gray-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain rounded-lg"
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
                <div className="flex gap-4 justify-center">
                  {!isRecording ? (
                    <Button
                      onClick={startVideoRecording}
                      className="bg-red-500 hover:bg-red-600 text-white"
                      disabled={submitting}
                    >
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      onClick={stopVideoRecording}
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={submitting}
                    >
                      Stop Recording
                    </Button>
                  )}
                </div>
                <div className="text-center text-sm text-gray-400">
                  Or upload a video file
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="mt-2 bg-gray-900 border-gray-800 text-white"
                    disabled={submitting}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <video
                  src={uploadedUrls[0]}
                  controls
                  className="w-full rounded-lg border border-gray-800"
                />
                <Button
                  onClick={() => {
                    setVideoBlob(null)
                    setUploadedUrls([])
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                  disabled={submitting}
                >
                  Record New Video
                </Button>
              </div>
            )}
          </div>
        )

      case 'gallery':
        return (
          <div className="space-y-4">
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="bg-gray-900 border-gray-800 text-white"
              disabled={submitting}
            />
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedImages.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-800">
                    <img src={img} alt={`Selected ${idx + 1}`} className="w-full h-full object-cover" />
                    <Button
                      onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white text-xs p-1 h-auto"
                      size="sm"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {selectedImages.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                Select one or more images
              </p>
            )}
          </div>
        )

      case 'collage':
        if (!taskData.task.layout) {
          return (
            <div className="space-y-4">
              <p className="text-gray-400 text-center py-8">
                No layout configuration provided for this collage task
              </p>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <CollageCanvas
              layout={taskData.task.layout}
              value={collageData || undefined}
              onChange={(data) => {
                setCollageData(data)
                // Upload images if they have file objects
                const uploadPromises = data.images
                  .filter(img => img.file)
                  .map(async (img) => {
                    if (img.file && studyId && taskData.participant.id) {
                      const path = `participant-uploads/${studyId}/${taskData.participant.id}/${Date.now()}-${img.file.name}`
                      const url = await uploadFile('participant-uploads', img.file, path)
                      return { ...img, url, file: undefined }
                    }
                    return img
                  })
                
                Promise.all(uploadPromises).then(uploadedImages => {
                  const updatedData = {
                    ...data,
                    images: data.images.map(img => {
                      const uploaded = uploadedImages.find(u => u.id === img.id)
                      return uploaded || img
                    })
                  }
                  setCollageData(updatedData)
                })
              }}
              disabled={submitting || !!taskData.existing_response}
              studyId={studyId}
              participantId={taskData.participant.id}
            />
          </div>
        )

      case 'classification':
        if (!taskData.task.items || taskData.task.items.length === 0) {
          return (
            <div className="space-y-4">
              <p className="text-gray-400 text-center py-8">
                No items provided for classification
              </p>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <ClassificationInput
              items={taskData.task.items}
              value={rankings.length > 0 ? rankings : undefined}
              onChange={(newRankings) => setRankings(newRankings)}
              disabled={submitting || !!taskData.existing_response}
            />
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <Textarea
              placeholder="Enter your response..."
              value={textResponse}
              onChange={(e) => setTextResponse(e.target.value)}
              className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 min-h-[200px]"
              disabled={submitting}
            />
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push(`/participant/${studyId}?access_code=${accessCode}`)}
            className="bg-gray-800 hover:bg-gray-700 text-white"
          >
            ← Back to Study
          </Button>
          <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/20">
            Task {taskData.task.order_index || 1}
          </Badge>
        </div>

        {/* Task Card */}
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{taskData.task.title}</CardTitle>
            <CardDescription className="text-gray-400">
              {taskData.task.type}
            </CardDescription>
            {taskData.task.instructions && (
              <p className="text-gray-300 mt-2">{taskData.task.instructions}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-500/10 border-green-500/20">
                <AlertDescription className="text-green-400">
                  Response submitted successfully! Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {taskData.existing_response && (
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <AlertDescription className="text-blue-400">
                  You have already submitted a response for this task. You can submit again to update it.
                </AlertDescription>
              </Alert>
            )}

            {renderTaskInput()}

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white"
                disabled={submitting || success}
              >
                {submitting ? (
                  <>
                    <Spinner className="mr-2" />
                    Submitting...
                  </>
                ) : taskData.existing_response ? (
                  'Update Response'
                ) : (
                  'Submit Response'
                )}
              </Button>
              <Button
                onClick={() => router.push(`/participant/${studyId}?access_code=${accessCode}`)}
                className="bg-gray-800 hover:bg-gray-700 text-white"
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
