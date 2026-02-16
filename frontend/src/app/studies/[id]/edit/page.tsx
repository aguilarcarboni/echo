"use client"

import type React from "react"
import { getStudies, updateStudy, getTasks, createTask, updateTask, deleteTask } from "@/utils/api"
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
import { TaskConfigModal } from "@/components/task-config-modal"

interface Task {
  id?: string  // Existing task ID (if editing)
  taskTypeId: number
  prompt: string
  config?: any
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
  const [currentTaskConfig, setCurrentTaskConfig] = useState<any>(null)
  const [configModalOpen, setConfigModalOpen] = useState(false)
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
          const taskObj: Task = {
            id: task.id,  // Preserve existing task ID
            taskTypeId: typeMap[task.type] || 2,
            prompt: task.title || task.instructions || ""
          }
          
          // Load configuration if it exists
          if (task.template) {
            taskObj.config = { template: task.template }
          } else if (task.items) {
            taskObj.config = { items: task.items }
          } else if (task.layout) {
            taskObj.config = { layout: task.layout }
          }
          
          return taskObj
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

  const needsConfiguration = (taskTypeId: number): boolean => {
    return taskTypeId === 4 || taskTypeId === 5 || taskTypeId === 6 // collage, classification, fill_blanks
  }

  const handleConfigureTask = () => {
    if (currentTaskType) {
      setConfigModalOpen(true)
    }
  }

  const handleConfigSave = (config: any) => {
    setCurrentTaskConfig(config)
    setConfigModalOpen(false)
  }

  const handleAddTask = () => {
    if (currentTaskType && currentPrompt) {
      const taskTypeId = Number.parseInt(currentTaskType)
      const task: Task = {
        taskTypeId,
        prompt: currentPrompt,
      }
      
      // Add config if it's a special task type and config exists
      if (needsConfiguration(taskTypeId) && currentTaskConfig) {
        task.config = currentTaskConfig
      }
      
      setTasks([...tasks, task])
      setCurrentTaskType("")
      setCurrentPrompt("")
      setCurrentTaskConfig(null)
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
      
      // Sync tasks: create new, update existing, delete removed
      let existingTasks: any[] = []
      try {
        const tasksResponse = await getTasks({ study_id: studyId })
        existingTasks = Array.isArray(tasksResponse) ? tasksResponse : []
      } catch (error) {
        console.error('Failed to fetch existing tasks:', error)
        // Continue anyway - we'll try to create/update based on what we have
      }
      
      const existingTaskIds = new Set(
        existingTasks.map((t: any) => t.id).filter((id: any) => id)
      )
      const currentTaskIds = new Set(
        tasks.filter(t => t.id).map(t => t.id!)
      )
      
      // Delete tasks that were removed
      const tasksToDelete = Array.from(existingTaskIds).filter(id => !currentTaskIds.has(id))
      for (const taskId of tasksToDelete) {
        try {
          await deleteTask(taskId)
        } catch (error) {
          console.error(`Failed to delete task ${taskId}:`, error)
          // Continue with other operations even if one delete fails
        }
      }
      
      // Create or update tasks
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i]
        
        // Skip if task is missing required fields
        if (!task.prompt || !task.prompt.trim()) {
          console.warn(`Skipping task at index ${i} - missing prompt`)
          continue
        }
        
        const taskType = getTaskTypeFromId(task.taskTypeId)
        
        if (task.id) {
          // Update existing task - only send fields that are changing
          const updateData: any = {
            title: task.prompt,
            instructions: task.prompt,
            order_index: i + 1,
          }
          
          // Check if task type changed (compare with existing task)
          // Note: Changing task type is risky - we'll only update type if it's different
          // but this might cause validation issues if old config fields conflict
          const existingTask = existingTasks.find((t: any) => t.id === task.id)
          if (existingTask && existingTask.type !== taskType) {
            // When type changes, we should clear old config fields
            // But for safety, let's not change type on existing tasks
            // Users should delete and recreate if they need to change type
            console.warn(`Task ${task.id} type change detected (${existingTask.type} -> ${taskType}). Type changes may cause validation errors.`)
            // Uncomment below to allow type changes (may cause validation errors):
            // updateData.type = taskType
          }
          
          // Only include config fields if they have values (don't send null)
          if (taskType === 'fill_blanks') {
            if (task.config?.template) {
              updateData.template = task.config.template
            }
          } else if (taskType === 'classification') {
            if (task.config?.items && task.config.items.length > 0) {
              updateData.items = task.config.items
            }
          } else if (taskType === 'collage') {
            if (task.config?.layout) {
              updateData.layout = task.config.layout
            }
          }
          
          try {
            await updateTask(task.id, updateData)
          } catch (error) {
            console.error(`Failed to update task ${task.id}:`, error)
            throw error // Re-throw to show error to user
          }
        } else {
          // Create new task - include all required fields
          const taskData: any = {
            study_id: studyId,
            type: taskType,
            title: task.prompt,
            instructions: task.prompt,
            order_index: i + 1,
          }
          
          // Add task-specific configuration if present
          if (task.config) {
            if (taskType === 'fill_blanks' && task.config.template) {
              taskData.template = task.config.template
            } else if (taskType === 'classification' && task.config.items) {
              taskData.items = task.config.items
            } else if (taskType === 'collage' && task.config.layout) {
              taskData.layout = task.config.layout
            }
          }
          
          try {
            await createTask(taskData)
          } catch (error) {
            console.error(`Failed to create task:`, error)
            throw error // Re-throw to show error to user
          }
        }
      }
      
      toast({
        title: "Study Updated!",
        description: "Your study and tasks have been updated successfully.",
      })
      
      router.push(`/studies/${studyId}`)
    } catch (error: any) {
      console.error('Failed to update study:', error)
      // Extract error message - could be from error.message or error.details
      let errorMessage = error?.message || "Failed to update study. Please try again."
      if (error?.details?.error) {
        errorMessage = error.details.error
      } else if (error?.details?.message) {
        errorMessage = error.details.message
      }
      toast({
        title: "Error",
        description: errorMessage,
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

            {/* Tasks */}
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Study Tasks</CardTitle>
                    <CardDescription className="text-gray-400">Add tasks for participants to complete</CardDescription>
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="taskType" className="text-white">
                      Task Type
                    </Label>
                    <Select value={currentTaskType} onValueChange={setCurrentTaskType}>
                      <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-800">
                        {taskTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()} className="text-white">
                            {type.name} - {type.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-white">
                      Task Prompt
                    </Label>
                    <Input
                      id="prompt"
                      value={currentPrompt}
                      onChange={(e) => setCurrentPrompt(e.target.value)}
                      placeholder="Enter task prompt"
                      className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                    />
                  </div>
                </div>

                {currentTaskType && needsConfiguration(Number.parseInt(currentTaskType)) && (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={handleConfigureTask}
                      variant="outline"
                      className="border-purple-500 text-purple-500 hover:bg-purple-500/10 bg-transparent"
                    >
                      {currentTaskConfig ? '✓ Configured' : 'Configure Task'}
                    </Button>
                    {currentTaskConfig && (
                      <span className="text-sm text-gray-400">
                        Task configuration saved
                      </span>
                    )}
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleAddTask}
                  variant="outline"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10 bg-transparent"
                  disabled={!currentTaskType || !currentPrompt || (currentTaskType && needsConfiguration(Number.parseInt(currentTaskType)) && !currentTaskConfig)}
                >
                  Add Task
                </Button>

                {tasks.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-white">Added Tasks ({tasks.length})</Label>
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
                              {task.config && (
                                <p className="text-xs text-purple-400 mt-1">✓ Configured</p>
                              )}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTask(index)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <X className="h-4 w-4" />
                            </Button>
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

        {/* Task Configuration Modal */}
        {currentTaskType && (
          <TaskConfigModal
            taskType={getTaskTypeFromId(Number.parseInt(currentTaskType))}
            isOpen={configModalOpen}
            onClose={() => setConfigModalOpen(false)}
            onSave={handleConfigSave}
            existingConfig={currentTaskConfig}
          />
        )}
      </main>
    </div>
  )
}
