'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"

interface FillBlanksInputProps {
  template: string
  value?: { answers: Record<string, string>, filledText: string }
  onChange?: (value: { answers: Record<string, string>, filledText: string }) => void
  disabled?: boolean
}

export function FillBlanksInput({ template, value, onChange, disabled }: FillBlanksInputProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(value?.answers || {})
  const [blankIds, setBlankIds] = useState<string[]>([])

  // Parse template to find all blanks
  useEffect(() => {
    if (!template) return
    
    // Find all placeholders (____)
    const placeholderRegex = /____+/g
    const matches = Array.from(template.matchAll(placeholderRegex))
    const ids: string[] = []
    
    matches.forEach((_, index) => {
      ids.push(`blank${index + 1}`)
    })
    
    setBlankIds(ids)
    
    // Initialize answers if not provided
    if (!value?.answers) {
      const initialAnswers: Record<string, string> = {}
      ids.forEach(id => {
        initialAnswers[id] = ''
      })
      setAnswers(initialAnswers)
    }
  }, [template, value?.answers])

  // Update answers when value prop changes
  useEffect(() => {
    if (value?.answers) {
      setAnswers(value.answers)
    }
  }, [value?.answers])

  const handleAnswerChange = (blankId: string, answer: string) => {
    const newAnswers = { ...answers, [blankId]: answer }
    setAnswers(newAnswers)
    
    // Generate filled text
    let filledText = template
    blankIds.forEach((id, index) => {
      const placeholderRegex = /____+/
      const answer = newAnswers[id] || ''
      filledText = filledText.replace(placeholderRegex, answer || '____')
    })
    
    if (onChange) {
      onChange({ answers: newAnswers, filledText })
    }
  }

  // Split template into parts (text and blanks)
  const renderTemplate = () => {
    if (!template) return null
    
    const parts: Array<{ type: 'text' | 'blank', content: string, blankId?: string }> = []
    const placeholderRegex = /(____+)/g
    let lastIndex = 0
    let blankIndex = 0
    let match
    
    while ((match = placeholderRegex.exec(template)) !== null) {
      // Add text before placeholder
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: template.substring(lastIndex, match.index)
        })
      }
      
      // Add placeholder
      parts.push({
        type: 'blank',
        content: match[0],
        blankId: `blank${blankIndex + 1}`
      })
      
      lastIndex = match.index + match[0].length
      blankIndex++
    }
    
    // Add remaining text
    if (lastIndex < template.length) {
      parts.push({
        type: 'text',
        content: template.substring(lastIndex)
      })
    }
    
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-white leading-relaxed">
          {parts.map((part, index) => {
            if (part.type === 'text') {
              return (
                <span key={index} className="whitespace-pre-wrap">
                  {part.content}
                </span>
              )
            } else {
              const blankId = part.blankId!
              const answer = answers[blankId] || ''
              return (
                <Input
                  key={index}
                  value={answer}
                  onChange={(e) => handleAnswerChange(blankId, e.target.value)}
                  placeholder="____"
                  disabled={disabled}
                  className="inline-block w-auto min-w-[120px] bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-pink-500 focus:ring-pink-500"
                  style={{ display: 'inline-block' }}
                />
              )
            }
          })}
        </div>
        <div className="text-xs text-gray-400 mt-4">
          {blankIds.filter(id => answers[id]?.trim()).length} of {blankIds.length} blanks filled
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {renderTemplate()}
    </div>
  )
}
