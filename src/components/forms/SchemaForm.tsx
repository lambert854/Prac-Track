'use client'

import { CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

interface Field {
  id: string
  type: 'single-select' | 'textarea'
  label: string
  required: boolean
  options?: Array<{ value: number; label: string }>
  maxLength?: number
  placeholder?: string
}

interface Page {
  id: string
  title: string
  description?: string
  fields: Field[]
}

interface SchemaFormProps {
  pages: Page[]
  initialAnswers: Record<string, number | string>
  onSave: (answers: Record<string, number | string>, pageId?: string) => Promise<void>
  isLocked: boolean
  lastSavedAt?: Date | null
}

export interface SchemaFormRef {
  saveCurrentPage: () => Promise<void>
}

export const SchemaForm = forwardRef<SchemaFormRef, SchemaFormProps>(({ 
  pages, 
  initialAnswers, 
  onSave, 
  isLocked,
  lastSavedAt,
}, ref) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | string>>(initialAnswers)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(lastSavedAt || null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedChanges = useRef(false)

  const currentPage = pages[currentPageIndex]

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    saveCurrentPage: async () => {
      if (hasUnsavedChanges.current) {
        await handleSave(answers, currentPage.id)
      }
    }
  }))

  // Auto-save effect
  useEffect(() => {
    if (isLocked || !hasUnsavedChanges.current) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        await handleSave(answers, currentPage.id)
        setLastAutoSave(new Date())
        hasUnsavedChanges.current = false
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [answers, currentPage.id, isLocked])

  // Update answers when initialAnswers change
  useEffect(() => {
    setAnswers(initialAnswers)
  }, [initialAnswers])

  const handleSave = useCallback(async (answersToSave: Record<string, number | string>, pageId?: string) => {
    if (isLocked) return

    setIsSaving(true)
    try {
      await onSave(answersToSave, pageId)
      hasUnsavedChanges.current = false
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isLocked])

  const handleFieldChange = useCallback((fieldId: string, value: number | string) => {
    if (isLocked) return

    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }))
    hasUnsavedChanges.current = true

    // Clear any existing error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }, [isLocked, errors])

  const handleNext = useCallback(async () => {
    if (currentPageIndex < pages.length - 1) {
      // Save current page before moving to next
      await handleSave(answers, currentPage.id)
      setCurrentPageIndex(prev => prev + 1)
    }
  }, [currentPageIndex, pages.length, handleSave, answers, currentPage.id])

  const handlePrevious = useCallback(async () => {
    if (currentPageIndex > 0) {
      // Save current page before moving to previous
      await handleSave(answers, currentPage.id)
      setCurrentPageIndex(prev => prev - 1)
    }
  }, [currentPageIndex, handleSave, answers, currentPage.id])

  const renderField = (field: Field) => {
    const value = answers[field.id] || ''

    if (field.type === 'single-select' && field.options) {
      return (
        <div className="space-y-2">
          {field.options.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name={field.id}
                value={option.value}
                checked={value === option.value}
                onChange={(e) => handleFieldChange(field.id, parseInt(e.target.value))}
                disabled={isLocked}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span className="ml-3 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => handleFieldChange(field.id, e.target.value)}
          disabled={isLocked}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Navigation */}
      <div className="flex justify-center space-x-2">
        {pages.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentPageIndex(index)
            }}
            className={`h-2 w-8 rounded-full transition-all duration-200 hover:scale-110 cursor-pointer ${
              index === currentPageIndex
                ? 'bg-blue-600'
                : index < currentPageIndex
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
            title={`Go to page ${index + 1}: ${pages[index].title}`}
          />
        ))}
      </div>

      {/* Current Page */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{currentPage.title}</h2>
          {currentPage.description && (
            <p className="mt-2 text-gray-600">{currentPage.description}</p>
          )}
        </div>

        <div className="space-y-6">
          {currentPage.fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              
              {renderField(field)}

              {errors[field.id] && (
                <p className="text-sm text-red-600">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      {!isLocked && (
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentPageIndex === 0}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={currentPageIndex === pages.length - 1}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-1" />
          </button>
        </div>
      )}

      {/* Read-only indicator */}
      {isLocked && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
          <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <p className="font-medium text-green-900">Evaluation Submitted</p>
            <p className="text-sm text-green-700">This evaluation has been locked and is now read-only.</p>
          </div>
        </div>
      )}
    </div>
  )
})

SchemaForm.displayName = 'SchemaForm'