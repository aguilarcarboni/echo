import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { studies, taskTypes, participants, responses, followUps, analyses } from "@/lib/data"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default async function StudyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const study = studies.find((s) => s.id === Number.parseInt(id))

  if (!study) {
    notFound()
  }

  const studyParticipants = participants.filter((p) => p.studyId === study.id)
  const studyAnalysis = analyses.find((a) => a.studyId === study.id)
  const studyResponses = responses.filter((r) => studyParticipants.some((p) => p.id === r.participantId))

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{study.name}</h1>
              <p className="text-gray-400">{study.objective}</p>
            </div>
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

        {/* Study Info */}
        <Card className="bg-gray-950 border-gray-800 mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-400">Research Type</p>
                <p className="text-white font-medium mt-1">{study.researchType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Target Segment</p>
                <p className="text-white font-medium mt-1">{study.segment}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-white font-medium mt-1">
                  {study.durationDays} days • {study.numParticipants} participants
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
                <CardDescription className="text-gray-400">{study.tasks.length} tasks configured</CardDescription>
              </CardHeader>
              <CardContent>
                {study.tasks.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No tasks configured yet</p>
                ) : (
                  <div className="space-y-4">
                    {study.tasks.map((task, index) => {
                      const taskType = taskTypes.find((t) => t.id === task.taskTypeId)
                      return (
                        <div key={task.id} className="p-4 rounded-lg bg-gray-900 border border-gray-800">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center">
                              <span className="text-pink-500 font-bold text-sm">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-white font-medium mb-1">{taskType?.name}</h3>
                              <p className="text-sm text-gray-400 mb-2">{taskType?.description}</p>
                              <p className="text-white">{task.prompt}</p>
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
                        {studyParticipants.map((participant) => (
                          <tr key={participant.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                            <td className="py-3 px-4 text-white">{participant.contact}</td>
                            <td className="py-3 px-4 text-gray-400">{participant.demographics.age}</td>
                            <td className="py-3 px-4 text-gray-400">{participant.demographics.gender}</td>
                            <td className="py-3 px-4 text-gray-400">{participant.demographics.location}</td>
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
                                {participant.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
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
                      const participant = participants.find((p) => p.id === response.participantId)
                      const task = study.tasks.find((t) => t.id === response.studyTaskId)
                      const taskType = taskTypes.find((t) => t.id === task?.taskTypeId)
                      const responseFollowUps = followUps.filter((f) => f.responseId === response.id)

                      return (
                        <AccordionItem
                          key={response.id}
                          value={response.id.toString()}
                          className="border border-gray-800 rounded-lg px-4 bg-gray-900/50"
                        >
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center gap-4 text-left">
                              <div>
                                <p className="text-white font-medium">{participant?.contact}</p>
                                <p className="text-sm text-gray-400">
                                  {taskType?.name} • {response.submittedAt}
                                </p>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pt-4">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-400 mb-2">Response Data:</p>
                                <div className="p-3 rounded-lg bg-gray-900 border border-gray-800">
                                  <pre className="text-white text-sm whitespace-pre-wrap">
                                    {JSON.stringify(response.responseData, null, 2)}
                                  </pre>
                                </div>
                              </div>

                              {responseFollowUps.length > 0 && (
                                <div>
                                  <p className="text-sm text-gray-400 mb-2">Follow-up Questions:</p>
                                  <div className="space-y-2">
                                    {responseFollowUps.map((followUp) => (
                                      <div
                                        key={followUp.id}
                                        className="p-3 rounded-lg bg-gray-900 border border-gray-800"
                                      >
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/20 text-xs">
                                            {followUp.type}
                                          </Badge>
                                        </div>
                                        <p className="text-white text-sm mb-1">
                                          <strong>Q:</strong> {followUp.question}
                                        </p>
                                        <p className="text-gray-400 text-sm">
                                          <strong>A:</strong> {followUp.answer}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
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
                {!studyAnalysis ? (
                  <p className="text-gray-400 text-center py-8">Analysis not available yet</p>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-white font-medium mb-3">Summary</h3>
                      <p className="text-gray-300 p-4 rounded-lg bg-gray-900 border border-gray-800">
                        {studyAnalysis.summary}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-3">Key Themes</h3>
                      <div className="flex flex-wrap gap-2">
                        {studyAnalysis.insights.themes.map((theme, index) => (
                          <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                            {theme}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-medium mb-3">Recommendations</h3>
                      <div className="space-y-2">
                        {studyAnalysis.insights.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800"
                          >
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-500/20 flex items-center justify-center mt-0.5">
                              <span className="text-pink-500 font-bold text-xs">{index + 1}</span>
                            </div>
                            <p className="text-gray-300">{rec}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
