"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { deleteStudy } from "@/utils/api"
import { useToast } from "@/components/ui/use-toast"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"

interface StudyActionsProps {
  studyId: string
  studyName: string
}

export function StudyActions({ studyId, studyName }: StudyActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleDeleteConfirm = async () => {
    try {
      await deleteStudy(studyId)
      toast({
        title: "Study Deleted",
        description: `"${studyName}" has been deleted successfully.`,
      })
      setDeleteDialogOpen(false)
      // Redirect to studies list
      router.push("/studies")
    } catch (error: any) {
      console.error('Failed to delete study:', error)
      const errorMessage = error?.message || "Failed to delete study. Please try again."
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Link href={`/studies/${studyId}/edit`}>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDeleteDialogOpen(true)}
          className="border-red-500/50 text-red-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-gray-950 border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Study</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete "{studyName}"? This action cannot be undone and will permanently delete the study and all associated data.
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
    </>
  )
}
