import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { analyses, studies } from "@/lib/data"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function AnalysisPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analysis</h1>
          <p className="text-gray-400">AI-powered insights from your studies</p>
        </div>

        <div className="space-y-6">
          {analyses.map((analysis) => {
            const study = studies.find((s) => s.id === analysis.studyId)
            if (!study) return null

            return (
              <Card key={analysis.id} className="bg-gray-950 border-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white">{study.name}</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">{study.objective}</CardDescription>
                    </div>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/20">{study.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="details" className="border-gray-800">
                      <AccordionTrigger className="text-white hover:no-underline">
                        View Analysis Details
                      </AccordionTrigger>
                      <AccordionContent className="pt-4">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-white font-medium mb-3">Summary</h3>
                            <p className="text-gray-300 p-4 rounded-lg bg-gray-900 border border-gray-800">
                              {analysis.summary}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-white font-medium mb-3">Key Themes</h3>
                            <div className="flex flex-wrap gap-2">
                              {analysis.insights.themes.map((theme, index) => (
                                <Badge key={index} className="bg-blue-500/20 text-blue-400 border-blue-500/20">
                                  {theme}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-white font-medium mb-3">Recommendations</h3>
                            <div className="space-y-2">
                              {analysis.insights.recommendations.map((rec, index) => (
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            )
          })}

          {analyses.length === 0 && (
            <Card className="bg-gray-950 border-gray-800">
              <CardContent className="py-12">
                <p className="text-gray-400 text-center">No analyses available yet</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
