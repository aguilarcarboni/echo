'use client'

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FillBlanksConfig } from "./fill-blanks-config"
import { ClassificationConfig } from "./classification-config"
import { CollageConfig } from "./collage-config"

interface TaskConfigModalProps {
  taskType: string
  isOpen: boolean
  onClose: () => void
  onSave: (config: any) => void
  existingConfig?: any
}

export function TaskConfigModal({ taskType, isOpen, onClose, onSave, existingConfig }: TaskConfigModalProps) {
  const handleSave = (config: any) => {
    onSave(config)
    onClose()
  }

  const renderConfigForm = () => {
    switch (taskType) {
      case 'fill_blanks':
        return (
          <FillBlanksConfig
            value={existingConfig}
            onSave={handleSave}
            onCancel={onClose}
          />
        )
      case 'classification':
        return (
          <ClassificationConfig
            value={existingConfig}
            onSave={handleSave}
            onCancel={onClose}
          />
        )
      case 'collage':
        return (
          <CollageConfig
            value={existingConfig}
            onSave={handleSave}
            onCancel={onClose}
          />
        )
      default:
        return (
          <div className="p-4">
            <p className="text-gray-400">No configuration needed for this task type.</p>
          </div>
        )
    }
  }

  const getTitle = () => {
    switch (taskType) {
      case 'fill_blanks':
        return 'Configure Fill in Blanks Task'
      case 'classification':
        return 'Configure Classification Task'
      case 'collage':
        return 'Configure Collage Task'
      default:
        return 'Configure Task'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-950 border-gray-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{getTitle()}</DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure the settings for this task type
          </DialogDescription>
        </DialogHeader>
        {renderConfigForm()}
      </DialogContent>
    </Dialog>
  )
}
