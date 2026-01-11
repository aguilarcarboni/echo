'use client'

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Users, FileText, Activity } from "lucide-react"
import { getStudies, getParticipants } from "@/utils/api"

interface Study {
  id: string
  name: string
  status: string
  numParticipants?: number
  target_participants?: number
  durationDays?: number
  duration_days?: number
}

interface Participant {
  id: string
  contact: string
  demographics: {
    age?: number
    gender?: string
    location?: string
  } | string
  status: string
  study_id?: string
}

export default function DashboardPage() {
  const [studies, setStudies] = useState<Study[]>([])
  const [recentParticipants, setRecentParticipants] = useState<Participant[]>([])
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [studiesData, participantsData] = await Promise.all([
          getStudies(),
          getParticipants()
        ])
        
        // Normalize API response to match UI expectations
        const normalizedStudies = studiesData.map((study: any) => ({
          ...study,
          numParticipants: study.numParticipants ?? study.target_participants ?? 0,
          durationDays: study.durationDays ?? study.duration_days ?? 0,
        }))
        setStudies(normalizedStudies)
        
        // Normalize participants data
        const normalizedParticipants = Array.isArray(participantsData) ? participantsData : []
        setTotalParticipants(normalizedParticipants.length)
        
        // Get recent participants (last 3, reversed to show most recent first)
        // Sort by id (assuming UUIDs or sequential IDs) as a proxy for recency
        // In a real app, you'd sort by created_at timestamp
        const sorted = [...normalizedParticipants].reverse().slice(0, 3)
        setRecentParticipants(sorted)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  const activeStudies = studies.filter((s) => s.status === "active")

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
            <CardTitle className="text-white">Active Studies</CardTitle>
            <CardDescription className="text-gray-400">Currently running research studies</CardDescription>
          </CardHeader>
          <CardContent>
            {activeStudies.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No active studies at the moment</p>
            ) : (
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
                    {activeStudies.map((study) => (
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
            )}
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
              {recentParticipants.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No participants yet</p>
              ) : (
                recentParticipants.map((participant) => {
                  const demographics = typeof participant.demographics === 'string'
                    ? JSON.parse(participant.demographics || '{}')
                    : participant.demographics || {}
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-900/50 border border-gray-800"
                    >
                      <div>
                        <p className="text-white font-medium">{participant.contact}</p>
                        <p className="text-sm text-gray-400">
                          {demographics.age ? `${demographics.age} yrs` : 'Age N/A'} • {demographics.gender || 'N/A'} •{" "}
                          {demographics.location || 'N/A'}
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
                        {participant.status || 'invited'}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
