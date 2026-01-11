import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { taskTypes } from "@/lib/data"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { getStudies, getTasks, getParticipants, getResponses } from "@/utils/api"
import { ParticipantLinkButton } from "./participant-link-button"
import { ResponseRenderer } from "@/components/response-renderer"

export default async function StudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  // Fetch study from API
  const studiesData = await getStudies({ id })
  const study = Array.isArray(studiesData) && studiesData.length > 0 ? studiesData[0] : null

  if (!study) {
    notFound()
  }

  // Fetch related data from API
  const [tasksData, participantsData, responsesData] = await Promise.all([
    getTasks({ study_id: id }),
    getParticipants({ study_id: id }),
    getResponses({ study_id: id })
  ])

  const studyTasks = Array.isArray(tasksData) ? tasksData : []
  const studyParticipants = Array.isArray(participantsData) ? participantsData : []
  const studyResponses = Array.isArray(responsesData) ? responsesData : []
  
  // Extract segment description from segment_criteria
  let segmentDescription = study.segment || 'N/A'
  if (study.segment_criteria) {
    if (typeof study.segment_criteria === 'string') {
      try {
        const parsed = JSON.parse(study.segment_criteria)
        segmentDescription = parsed.description || study.segment_criteria
      } catch {
        segmentDescription = study.segment_criteria
      }
    } else {
      segmentDescription = study.segment_criteria.description || JSON.stringify(study.segment_criteria)
    }
  }
  
  // Note: Analysis and follow-ups are not yet available via API, so we'll show empty states

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{study.name}</h1>
              <p className="text-gray-400">{study.objective || 'No objective provided'}</p>
            </div>
            <div className="flex items-center gap-4">
              <ParticipantLinkButton studyId={id} />
              <Badge
                className={
                  study.status === "active"
                    ? "bg-green-500/20 text-green-400 border-green-500/20"
                    : study.status === "draft"
                      ? "bg-gray-500/20 text-gray-400 border-gray-500/20"
                      : "bg-blue-500/20 text-blue-400 border-blue-500/20"
                }
              >
                {study.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Study Info */}
        <Card className="bg-gray-950 border-gray-800 mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-400">Research Type</p>
                <p className="text-white font-medium mt-1">{study.study_type || study.researchType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Target Segment</p>
                <p className="text-white font-medium mt-1">{segmentDescription}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-white font-medium mt-1">
                  {study.duration_days || study.durationDays || 0} days • {study.target_participants || study.numParticipants || 0} participants
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="bg-gray-950 border border-gray-800">
            <TabsTrigger value="tasks" className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500">
              Tasks
            </TabsTrigger>
            <TabsTrigger
              value="participants"
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500"
            >
              Participants
            </TabsTrigger>
            <TabsTrigger
              value="responses"
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500"
            >
              Responses
            </TabsTrigger>
            <TabsTrigger
              value="analysis"
              className="data-[state=active]:bg-pink-500/20 data-[state=active]:text-pink-500"
            >
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks">
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Study Tasks</CardTitle>
                <CardDescription className="text-gray-400">{studyTasks.length} tasks configured</CardDescription>
              </CardHeader>
              <CardContent>
                {studyTasks.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No tasks configured yet</p>
                ) : (
                  <div className="space-y-4">
                    {studyTasks.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)).map((task, index) => {
                      // Map API task type to taskType id for lookup
                      const typeMap: { [key: string]: number } = {
                        'camera': 1,
                        'discussion': 2,
                        'gallery': 3,
                        'collage': 4,
                        'classification': 5,
                        'fill_blanks': 6
                      }
                      const taskType = taskTypes.find((t) => t.id === typeMap[task.type])
                      return (
                        <div key={task.id} className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <span className="text-pink-500 font-bold text-sm">{task.order_index || index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium mb-1">{task.title || taskType?.name || task.type}</h3>
                              {task.instructions && (
                                <p className="text-sm text-gray-400 mb-2">{task.instructions}</p>
                              )}
                              {taskType && !task.instructions && (
                                <p className="text-sm text-gray-400 mb-2">{taskType.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="participants">
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Participants</CardTitle>
                <CardDescription className="text-gray-400">
                  {studyParticipants.length} participants enrolled
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studyParticipants.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No participants yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Contact</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Age</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Gender</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Location</th>
                          <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studyParticipants.map((participant) => {
                          const demographics = typeof participant.demographics === 'string' 
                            ? JSON.parse(participant.demographics || '{}')
                            : participant.demographics || {}
                          return (
                            <tr key={participant.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                              <td className="py-3 px-4 text-white">{participant.contact}</td>
                              <td className="py-3 px-4 text-gray-400">{demographics.age || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-400">{demographics.gender || 'N/A'}</td>
                              <td className="py-3 px-4 text-gray-400">{demographics.location || 'N/A'}</td>
                              <td className="py-3 px-4">
                                <Badge
                                  className={
                                    participant.status === "completed"
                                      ? "bg-green-500/20 text-green-400 border-green-500/20"
                                      : participant.status === "started"
                                        ? "bg-blue-500/20 text-blue-400 border-blue-500/20"
                                        : "bg-gray-500/20 text-gray-400 border-gray-500/20"
                                  }
                                >
                                  {participant.status || 'invited'}
                                </Badge>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="responses">
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Participant Responses</CardTitle>
                <CardDescription className="text-gray-400">{studyResponses.length} responses collected</CardDescription>
              </CardHeader>
              <CardContent>
                {studyResponses.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No responses yet</p>
                ) : (
                  <Accordion type="single" collapsible className="space-y-2">
                    {studyResponses.map((response) => {
                      const participant = studyParticipants.find((p) => p.id === response.participant_id)
                      const task = studyTasks.find((t) => t.id === response.task_id)
                      // Map API task type to taskType id for lookup
                      const typeMap: { [key: string]: number } = {
                        'camera': 1,
                        'discussion': 2,
                        'gallery': 3,
                        'collage': 4,
                        'classification': 5,
                        'fill_blanks': 6
                      }
                      const taskType = task ? taskTypes.find((t) => t.id === typeMap[task.type]) : null
                      const responseData = typeof response.response_data === 'string'
                        ? JSON.parse(response.response_data || '{}')
                        : response.response_data || {}

                      return (
                        <AccordionItem
                          key={response.id}
                          value={response.id.toString()}
                          className="border border-gray-800 rounded-lg px-4 bg-gray-900/50"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-4 text-left">
                              <div>
                                <p className="text-white font-medium">{participant?.contact || 'Unknown participant'}</p>
                                <p className="text-sm text-gray-400">
                                  {taskType?.name || task?.type || 'Unknown task'} • {response.submitted_at || response.submittedAt || 'No date'}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-400 mb-3">
                                  {taskType?.name || task?.type || 'Response'}:
                                </p>
                                <ResponseRenderer 
                                  responseData={responseData} 
                                  taskType={task?.type || 'unknown'} 
                                />
                              </div>

                              {/* Follow-ups not yet available via API */}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      )
                    })}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="bg-gray-950 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">AI-Powered Analysis</CardTitle>
                <CardDescription className="text-gray-400">Insights and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-center py-8">Analysis feature coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
