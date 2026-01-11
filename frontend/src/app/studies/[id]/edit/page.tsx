"use client"

import type React from "react"
import { getStudies, updateStudy, getTasks, createTask } from "@/utils/api"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { taskTypes, researchTypeOptions } from "@/lib/data"
import { Sparkles, X } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Task {
  taskTypeId: number
  prompt: string
}

export default function EditStudyPage() {
  const router = useRouter()
  const params = useParams()
  const studyId = params.id as string
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [objective, setObjective] = useState("")
  const [researchType, setResearchType] = useState("")
  const [segment, setSegment] = useState("")
  const [numParticipants, setNumParticipants] = useState("")
  const [duration, setDuration] = useState("")
  const [status, setStatus] = useState("draft")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskType, setCurrentTaskType] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // Fetch study data and existing tasks
  useEffect(() => {
    const fetchStudyData = async () => {
      try {
        const [studiesData, tasksData] = await Promise.all([
          getStudies({ id: studyId }),
          getTasks({ study_id: studyId })
        ])
        
        const study = Array.isArray(studiesData) && studiesData.length > 0 ? studiesData[0] : null
        
        if (!study) {
          toast({
            title: "Error",
            description: "Study not found.",
            variant: "destructive",
          })
          router.push("/studies")
          return
        }
        
        // Populate form with study data
        setName(study.name || "")
        setObjective(study.objective || "")
        setResearchType(study.study_type || study.researchType || "")
        setNumParticipants(String(study.target_participants || study.numParticipants || ""))
        setDuration(String(study.duration_days || study.durationDays || ""))
        setStatus(study.status || "draft")
        
        // Handle segment_criteria
        if (study.segment_criteria) {
          if (typeof study.segment_criteria === 'string') {
            try {
              const parsed = JSON.parse(study.segment_criteria)
              setSegment(parsed.description || study.segment_criteria)
            } catch {
              setSegment(study.segment_criteria)
            }
          } else if (study.segment_criteria.description) {
            setSegment(study.segment_criteria.description)
          } else {
            setSegment(study.segment || "")
          }
        } else {
          setSegment(study.segment || "")
        }
        
        // Convert existing tasks to the form format
        const existingTasks: Task[] = (Array.isArray(tasksData) ? tasksData : []).map((task: any) => {
          // Map API task type to taskType id
          const typeMap: { [key: string]: number } = {
            'camera': 1,
            'discussion': 2,
            'gallery': 3,
            'collage': 4,
            'classification': 5,
            'fill_blanks': 6
          }
          return {
            taskTypeId: typeMap[task.type] || 2,
            prompt: task.title || task.instructions || ""
          }
        })
        setTasks(existingTasks)
      } catch (error) {
        console.error('Failed to fetch study data:', error)
        toast({
          title: "Error",
          description: "Failed to load study data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchStudyData()
  }, [studyId, router, toast])

  const handleAddTask = () => {
    if (currentTaskType && currentPrompt) {
      setTasks([...tasks, { taskTypeId: Number.parseInt(currentTaskType), prompt: currentPrompt }])
      setCurrentTaskType("")
      setCurrentPrompt("")
    }
  }

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const handleAISuggestion = () => {
    toast({
      title: "AI Suggestion",
      description:
        "Recomendamos Cámara y Discusión para este objetivo. Estas tareas permiten capturar insights profundos y auténticos.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Update the study
      await updateStudy(studyId, {
        name,
        objective,
        study_type: researchType,
        target_participants: parseInt(numParticipants) || 50,
        duration_days: parseInt(duration) || 7,
        segment_criteria: segment ? { description: segment } : {},
        status: status,
      })
      
      toast({
        title: "Study Updated!",
        description: "Your study has been updated successfully.",
      })
      
      router.push(`/studies/${studyId}`)
    } catch (error) {
      console.error('Failed to update study:', error)
      toast({
        title: "Error",
        description: "Failed to update study. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Helper function to map task type IDs to strings
  function getTaskTypeFromId(id: number): string {
    const typeMap: { [key: number]: string } = {
      1: 'camera',
      2: 'discussion',
      3: 'gallery',
      4: 'collage',
      5: 'classification',
      6: 'fill_blanks',
    }
    return typeMap[id] || 'discussion'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <Sidebar />
        <main className="ml-64 mt-16 p-8">
          <div className="text-white">Loading...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Edit Study</h1>
          <p className="text-gray-400">Update your research study</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 max-w-4xl">
            {/* Basic Information */}
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
                <CardDescription className="text-gray-400">Define your study details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">
                    Study Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Hábitos de Consumo de Snacks"
                    required
                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="objective" className="text-white">
                    Objective
                  </Label>
                  <Textarea
                    id="objective"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder="What do you want to learn?"
                    required
                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="researchType" className="text-white">
                    Research Type
                  </Label>
                  <Select value={researchType} onValueChange={setResearchType} required>
                    <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                      <SelectValue placeholder="Select research type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      {researchTypeOptions.map((option) => (
                        <SelectItem key={option} value={option} className="text-white">
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="segment" className="text-white">
                    Target Segment
                  </Label>
                  <Textarea
                    id="segment"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    placeholder="Describe your target audience"
                    required
                    className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="participants" className="text-white">
                      Number of Participants
                    </Label>
                    <Input
                      id="participants"
                      type="number"
                      value={numParticipants}
                      onChange={(e) => setNumParticipants(e.target.value)}
                      placeholder="e.g., 50"
                      required
                      className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-white">
                      Duration (days)
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 7"
                      required
                      className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-white">
                    Status
                  </Label>
                  <Select value={status} onValueChange={setStatus} required>
                    <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800">
                      <SelectItem value="draft" className="text-white">Draft</SelectItem>
                      <SelectItem value="active" className="text-white">Active</SelectItem>
                      <SelectItem value="completed" className="text-white">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Tasks - Note: This shows existing tasks but doesn't edit them yet */}
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Study Tasks</CardTitle>
                    <CardDescription className="text-gray-400">
                      Existing tasks: {tasks.length}. Note: Task editing is coming soon.
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAISuggestion}
                    variant="outline"
                    className="border-pink-500 text-pink-500 hover:bg-pink-500/10 bg-transparent"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    AI Suggestion
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-white">Existing Tasks ({tasks.length})</Label>
                    <div className="space-y-2">
                      {tasks.map((task, index) => {
                        const taskType = taskTypes.find((t) => t.id === task.taskTypeId)
                        return (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 rounded-lg bg-gray-900 border border-gray-800"
                          >
                            <div>
                              <p className="text-white font-medium">{taskType?.name}</p>
                              <p className="text-sm text-gray-400">{task.prompt}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-4">
              <Button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white">
                Update Study
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/studies/${studyId}`)}
                className="border-gray-800 text-gray-400 hover:bg-gray-900"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </main>
    </div>
  )
}
