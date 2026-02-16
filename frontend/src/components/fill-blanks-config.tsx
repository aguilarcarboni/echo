'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FillBlanksInput } from "./fill-blanks-input"

interface FillBlanksConfigProps {
  value?: { template?: string }
  onSave: (config: { template: string }) => void
  onCancel: () => void
}

export function FillBlanksConfig({ value, onSave, onCancel }: FillBlanksConfigProps) {
  const [template, setTemplate] = useState(value?.template || '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (value?.template) {
      setTemplate(value.template)
    }
  }, [value])

  const validateTemplate = (text: string): boolean => {
    if (!text.trim()) {
      setError('Template cannot be empty')
      return false
    }
    if (!text.includes('____')) {
      setError('Template must contain at least one blank placeholder (____)')
      return false
    }
    setError(null)
    return true
  }

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTemplate = e.target.value
    setTemplate(newTemplate)
    if (newTemplate.trim()) {
      validateTemplate(newTemplate)
    } else {
      setError(null)
    }
  }

  const handleSave = () => {
    if (validateTemplate(template)) {
      onSave({ template: template.trim() })
    }
  }

  const countBlanks = () => {
    const matches = template.match(/____+/g)
    return matches ? matches.length : 0
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="template" className="text-white">
          Template Text
        </Label>
        <Textarea
          id="template"
          value={template}
          onChange={handleTemplateChange}
          placeholder="My favorite snack is ____ because ____. I eat it ____ times per week."
          className="bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 min-h-[120px]"
        />
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-400">
            Use <span className="font-mono text-pink-400">____</span> (4 underscores) to create blanks
          </p>
          <p className="text-gray-400">
            {countBlanks()} blank{countBlanks() !== 1 ? 's' : ''} found
          </p>
        </div>
        {error && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {template && template.includes('____') && (
        <div className="space-y-2">
          <Label className="text-white">Preview</Label>
          <div className="p-4 rounded-lg bg-gray-900 border border-gray-800">
            <FillBlanksInput
              template={template}
              disabled={true}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 justify-end pt-4 border-t border-gray-800">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border-gray-800 text-gray-400 hover:bg-gray-900"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          className="bg-pink-500 hover:bg-pink-600 text-white"
          disabled={!!error || !template.trim()}
        >
          Save Configuration
        </Button>
      </div>
    </div>
  )
}
