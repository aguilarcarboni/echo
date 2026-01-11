'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getStudyAccessLink } from "@/utils/api"

export function ParticipantLinkButton({ studyId }: { studyId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [linkData, setLinkData] = useState<{ url: string; study_access_code: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGetLink = async () => {
    setLoading(true)
    setError(null)
    setLinkData(null)

    try {
      const data = await getStudyAccessLink(studyId)
      setLinkData(data)
    } catch (err: any) {
      setError(err.message || 'Failed to get participant link')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (linkData?.url) {
      try {
        await navigator.clipboard.writeText(linkData.url)
        // You could show a toast notification here
      } catch (err) {
        setError('Failed to copy link. Please copy it manually.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-pink-500 hover:bg-pink-600 text-white"
          onClick={() => {
            setOpen(true)
            handleGetLink()
          }}
        >
          Get Participant Link
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Participant Registration Link</DialogTitle>
          <DialogDescription className="text-gray-400">
            Share this link with participants to allow them to register and join the study
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8">
              <Spinner className="text-pink-500" />
              <span className="text-gray-400">Generating link...</span>
            </div>
          )}

          {error && (
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          {linkData && (
            <>
              <div className="space-y-2">
                <Label className="text-white text-sm">Study Access Code</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={linkData.study_access_code}
                    readOnly
                    className="bg-gray-900 border-gray-800 text-white font-mono text-sm"
                  />
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(linkData.study_access_code)
                    }}
                    variant="outline"
                    size="sm"
                    className="border-gray-800 text-gray-400 hover:bg-gray-900"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white text-sm">Participant Registration Link</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={linkData.url}
                    readOnly
                    className="bg-gray-900 border-gray-800 text-white font-mono text-xs"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="border-gray-800 text-gray-400 hover:bg-gray-900"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <p className="text-sm text-gray-400">
                  Participants will be asked to provide their email and optional demographics before accessing the study.
                </p>
              </div>
            </>
          )}

          {!loading && !linkData && !error && (
            <div className="py-8 text-center">
              <Button
                onClick={handleGetLink}
                className="bg-pink-500 hover:bg-pink-600 text-white"
              >
                Generate Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
