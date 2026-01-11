"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getStudies, deleteStudy } from "@/utils/api"
import Link from "next/link"
import { Eye, Edit, PlusCircle, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface Study {
  id: string
  name: string
  objective?: string
  study_type?: string
  researchType?: string
  status: string
}

export default function StudiesPage() {
  const [studies, setStudies] = useState<Study[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studyToDelete, setStudyToDelete] = useState<Study | null>(null)
  const { toast } = useToast()

  const fetchStudies = async () => {
    try {
      const data = await getStudies()
      setStudies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch studies:', error)
      setStudies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudies()
  }, [])

  const handleDeleteClick = (study: Study) => {
    setStudyToDelete(study)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!studyToDelete) return

    try {
      await deleteStudy(studyToDelete.id)
      toast({
        title: "Study Deleted",
        description: `"${studyToDelete.name}" has been deleted successfully.`,
      })
      setDeleteDialogOpen(false)
      setStudyToDelete(null)
      // Refresh the studies list
      await fetchStudies()
    } catch (error) {
      console.error('Failed to delete study:', error)
      toast({
        title: "Error",
        description: "Failed to delete study. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Studies</h1>
            <p className="text-gray-400">Manage all your research studies</p>
          </div>
          <Link href="/studies/create">
            <Button className="bg-pink-500 hover:bg-pink-600 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Study
            </Button>
          </Link>
        </div>

        <Card className="bg-gray-950 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">All Studies</CardTitle>
            <CardDescription className="text-gray-400">{studies.length} total studies</CardDescription>
          </CardHeader>
          <CardContent>
            {studies.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No studies yet. Create your first study to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Objective</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studies.map((study) => (
                      <tr key={study.id} className="border-b border-gray-800/50 hover:bg-gray-900/50">
                        <td className="py-3 px-4 text-white font-medium">{study.name}</td>
                        <td className="py-3 px-4 text-gray-400 max-w-xs truncate">{study.objective || 'N/A'}</td>
                        <td className="py-3 px-4 text-gray-400">{study.study_type || study.researchType || 'N/A'}</td>
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
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/studies/${study.id}`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/studies/${study.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white hover:bg-gray-800"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(study)}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-gray-950 border-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Study</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                Are you sure you want to delete "{studyToDelete?.name}"? This action cannot be undone and will permanently delete the study and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-900 border-gray-800 text-white hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  )
}