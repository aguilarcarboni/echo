import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { studies, participants } from "@/lib/data"
import Link from "next/link"
import { ArrowRight, Users, FileText, Activity } from "lucide-react"

export default function DashboardPage() {
  const activeStudies = studies.filter((s) => s.status === "active")
  const recentParticipants = participants.slice(-3).reverse()
  const totalParticipants = participants.length

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Sidebar />
      <main className="ml-64 mt-16 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Overview of your research activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="bg-gradient-to-br from-pink-500/20 to-pink-500/5 border-pink-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Studies</CardTitle>
              <FileText className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{studies.length}</div>
              <p className="text-xs text-gray-400 mt-1">Active and completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Studies</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{activeStudies.length}</div>
              <p className="text-xs text-gray-400 mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-500/5 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{totalParticipants}</div>
              <p className="text-xs text-gray-400 mt-1">Across all studies</p>
            </CardContent>
          </Card>
        </div>

        {/* Studies Table */}
        <Card className="bg-gray-950 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">All Studies</CardTitle>
            <CardDescription className="text-gray-400">Manage your research studies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Participants</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Duration</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studies.map((study) => (
                    <tr key={study.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                      <td className="py-3 px-4 text-white">{study.name}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                            study.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : study.status === "draft"
                                ? "bg-gray-500/20 text-gray-400"
                                : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {study.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{study.numParticipants}</td>
                      <td className="py-3 px-4 text-gray-400">{study.durationDays} days</td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/studies/${study.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-pink-500 hover:text-pink-400 hover:bg-pink-500/10"
                          >
                            View <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Participants */}
        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Participants</CardTitle>
            <CardDescription className="text-gray-400">Latest participant activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentParticipants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-800"
                >
                  <div>
                    <p className="text-white font-medium">{participant.contact}</p>
                    <p className="text-sm text-gray-400">
                      {participant.demographics.age} yrs • {participant.demographics.gender} •{" "}
                      {participant.demographics.location}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      participant.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : participant.status === "started"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {participant.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
