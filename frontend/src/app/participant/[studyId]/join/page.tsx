'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"

const API_URL = 'http://127.0.0.1:5000'

export default function ParticipantJoinPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const studyId = params.studyId as string
  const studyCode = searchParams.get('code') || ''

  const [formData, setFormData] = useState({
    email: '',
    age: '',
    gender: '',
    location: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validatingCode, setValidatingCode] = useState(true)
  const [studyValid, setStudyValid] = useState(false)

  useEffect(() => {
    if (!studyCode) {
      setError('Study access code is required. Please use the correct link provided by the study administrator.')
      setValidatingCode(false)
      return
    }
    
    // Validate study code by trying to access study info
    validateStudyCode()
  }, [studyId, studyCode])

  const validateStudyCode = async () => {
    if (!studyCode.trim()) {
      setError('Study access code is required')
      setValidatingCode(false)
      return
    }

    try {
      // Validate study code using public endpoint
      const response = await fetch(`${API_URL}/participant/validate-study-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          study_id: studyId,
          study_access_code: studyCode
        })
      })

      const data = await response.json()

      if (!response.ok || !data.valid) {
        throw new Error(data.message || 'Invalid study access code or study not found')
      }
      
      setStudyValid(true)
    } catch (err: any) {
      setError(err.message || 'Invalid study access code or study not found')
      setStudyValid(false)
    } finally {
      setValidatingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.email.trim()) {
      setError('Email is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/participant/join-study`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          study_id: studyId,
          study_access_code: studyCode,
          email: formData.email,
          demographics: {
            ...(formData.age && { age: parseInt(formData.age) }),
            ...(formData.gender && { gender: formData.gender }),
            ...(formData.location && { location: formData.location })
          }
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to register for study')
      }

      // Store participant access code in localStorage for future visits
      if (data.access_code) {
        localStorage.setItem(`participant_${studyId}`, data.access_code)
      }

      // Redirect to study with participant access code
      router.push(`/participant/${studyId}?access_code=${data.access_code}`)
    } catch (err: any) {
      setError(err.message || 'Failed to register for study. Please check your information and try again.')
    } finally {
      setLoading(false)
    }
  }

  if (validatingCode) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-950 border-gray-800 w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Spinner className="text-pink-500" />
              <span className="text-gray-400">Validating study access code...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!studyValid && error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-950 border-gray-800 w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-white">Invalid Study Link</CardTitle>
            <CardDescription className="text-gray-400">
              Unable to access this study
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-red-500/10 border-red-500/20">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
            <p className="text-gray-400 text-sm mt-4">
              Please contact the study administrator for the correct link.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="bg-gray-950 border-gray-800 w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-white">Join Study</CardTitle>
          <CardDescription className="text-gray-400">
            Please provide your information to participate in this study
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertDescription className="text-red-400">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                required
                disabled={loading}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-white">
                Age (Optional)
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="e.g., 30"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                min="1"
                max="120"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender" className="text-white">
                Gender (Optional)
              </Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={loading}
              >
                <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-800">
                  <SelectItem value="male" className="text-white hover:bg-gray-800">Male</SelectItem>
                  <SelectItem value="female" className="text-white hover:bg-gray-800">Female</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-gray-800">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say" className="text-white hover:bg-gray-800">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-white">
                Location (Optional)
              </Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., New York, NY"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500"
                disabled={loading}
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
                  Registering...
                </>
              ) : (
                'Join Study'
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By joining, you agree to participate in this research study.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
