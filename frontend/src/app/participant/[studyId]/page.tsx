'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_URL = 'http://127.0.0.1:5000'

interface StudyData {
  study: {
    id: string
    name: string
    objective: string
    status: string
  }
  participant: {
    id: string
    contact: string
    status: string
  }
  tasks: Array<{
    id: string
    type: string
    title: string
    instructions: string
    order_index: number
    completed: boolean
  }>
  responses: Array<any>
}

export default function ParticipantStudyPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studyId = params.studyId as string
  
  const [accessCode, setAccessCode] = useState(searchParams.get('access_code') || '')
  const [studyData, setStudyData] = useState<StudyData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-load study if access code is provided in URL
  useEffect(() => {
    const codeFromUrl = searchParams.get('access_code')
    if (codeFromUrl && codeFromUrl.trim() && !studyData) {
      setAccessCode(codeFromUrl)
      loadStudy(codeFromUrl)
    }
  }, [searchParams, studyId])

  const loadStudy = async (code: string) => {
    if (!code.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/participant/study/${studyId}?access_code=${code}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to access study')
      }

      setStudyData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to access study. Please check your access code.')
      setStudyData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleAccess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!accessCode.trim()) {
      setError('Please enter your access code')
      return
    }
    await loadStudy(accessCode)
  }

  const handleStartTask = (taskId: string) => {
    if (!accessCode) {
      setError('Access code is required')
      return
    }
    router.push(`/participant/${studyId}/task/${taskId}?access_code=${accessCode}`)
  }

  if (!studyData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-950 border-gray-800 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Access Study</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your access code to view and participate in this study
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAccess} className="space-y-4">
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertDescription className="text-red-400">{error}</AlertDescription>
                </Alert>
              )}
              
              <div>
                <Input
                  type="text"
                  placeholder="Enter your access code"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                  disabled={loading}
                  autoFocus
                />
              </div>
              
              <Button
                type="submit"
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2" />
                    Accessing...
                  </>
                ) : (
                  'Access Study'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedCount = studyData.tasks.filter(t => t.completed).length
  const totalTasks = studyData.tasks.length

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">{studyData.study.name}</h1>
            <Badge
              className={
                studyData.study.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/20"
                  : "bg-gray-500/20 text-gray-400 border-gray-500/20"
              }
            >
              {studyData.study.status}
            </Badge>
          </div>
          {studyData.study.objective && (
            <p className="text-gray-400">{studyData.study.objective}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>Participant: {studyData.participant.contact}</span>
            <span>•</span>
            <span>Status: {studyData.participant.status}</span>
            <span>•</span>
            <span>Progress: {completedCount}/{totalTasks} tasks completed</span>
          </div>
        </div>

        {/* Progress Bar */}
        {totalTasks > 0 && (
          <Card className="bg-gray-950 border-gray-800">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Study Progress</span>
                  <span>{Math.round((completedCount / totalTasks) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-900 rounded-full h-2">
                  <div
                    className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedCount / totalTasks) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks List */}
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Tasks</CardTitle>
            <CardDescription className="text-gray-400">
              Complete all tasks to finish the study
            </CardDescription>
          </CardHeader>
          <CardContent>
            {studyData.tasks.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No tasks available yet</p>
            ) : (
              <div className="space-y-3">
                {studyData.tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-lg border ${
                      task.completed
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            task.completed
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-pink-500/20 text-pink-500'
                          }`}
                        >
                          {task.completed ? '✓' : task.order_index || index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{task.title}</h3>
                          {task.instructions && (
                            <p className="text-sm text-gray-400 mb-2">{task.instructions}</p>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              task.completed
                                ? 'bg-green-500/20 text-green-400 border-green-500/20'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }
                          >
                            {task.type}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        {task.completed ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
                            Completed
                          </Badge>
                        ) : (
                          <Button
                            onClick={() => handleStartTask(task.id)}
                            className="bg-pink-500 hover:bg-pink-600 text-white"
                            size="sm"
                          >
                            {studyData.responses.find((r: any) => r.task_id === task.id)
                              ? 'Continue'
                              : 'Start'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
