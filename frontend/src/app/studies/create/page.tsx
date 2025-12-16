"use client"

import type React from "react"
import { createStudy, createTask, getOrganizations, createOrganization, getUsers, createUser } from "@/utils/api"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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

export default function CreateStudyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [objective, setObjective] = useState("")
  const [researchType, setResearchType] = useState("")
  const [segment, setSegment] = useState("")
  const [numParticipants, setNumParticipants] = useState("")
  const [duration, setDuration] = useState("")
  const [tasks, setTasks] = useState<Task[]>([])
  const [currentTaskType, setCurrentTaskType] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState("")
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch or create default organization and user on mount
  useEffect(() => {
    const initializeUserAndOrg = async () => {
      try {
        // Try to get the first organization
        const orgs = await getOrganizations()
        let orgId: string

        if (orgs && orgs.length > 0) {
          orgId = orgs[0].id
        } else {
          // Create a default organization if none exists
          const newOrg = await createOrganization({ name: 'Default Organization' })
          orgId = newOrg.id
        }
        setOrganizationId(orgId)

        // Try to get the first user
        const users = await getUsers()
        let user: string

        if (users && users.length > 0) {
          user = users[0].id
        } else {
          // Create a default user if none exists
          const newUser = await createUser({
            email: 'default@example.com',
            organization_id: orgId,
            role: 'admin'
          })
          user = newUser.id
        }
        setUserId(user)
      } catch (error) {
        console.error('Failed to initialize user and organization:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeUserAndOrg()
  }, [])

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
    
    if (!organizationId || !userId) {
      toast({
        title: "Error",
        description: "User or organization not initialized. Please refresh the page.",
        variant: "destructive",
      })
      return
    }
    
    try {
        // First, create the study
        const studyResult = await createStudy({
            name,
            objective,
            study_type: researchType,
            target_participants: parseInt(numParticipants) || 50,
            duration_days: parseInt(duration) || 7,
            segment_criteria: segment ? { description: segment } : {},
            status: 'draft',
            organization_id: organizationId,
            created_by: userId,
        })
        
        const studyId = studyResult.id
        
        // Then, create all tasks
        for (const task of tasks) {
            await createTask({
                study_id: studyId,
                type: getTaskTypeFromId(task.taskTypeId), // Map your task type IDs
                title: task.prompt,
                instructions: task.prompt,
            })
        }
        
        toast({
            title: "Study Created!",
            description: "Your study has been created successfully.",
        })
        
        router.push(`/studies/${studyId}`)
    } catch (error) {
        console.error('Failed to create study:', error)
        toast({
            title: "Error",
            description: "Failed to create study. Please try again.",
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
          <h1 className="text-3xl font-bold text-white mb-2">Create New Study</h1>
          <p className="text-gray-400">Set up a new consumer research study</p>
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

                <Button
                  type="button"
                  onClick={handleAddTask}
                  variant="outline"
                  className="border-blue-500 text-blue-500 hover:bg-blue-500/10 bg-transparent"
                  disabled={!currentTaskType || !currentPrompt}
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
                Create Study
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
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
