'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { EvaluationConfig } from '@/config/evaluation.config'

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

export function SchemaForm({ 
  pages, 
  initialAnswers, 
  onSave, 
  isLocked,
  lastSavedAt,
}: SchemaFormProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | string>>(initialAnswers)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(lastSavedAt || null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const hasUnsavedChanges = useRef(false)

  const currentPage = pages[currentPageIndex]

  // Auto-save effect
  useEffect(() => {
    if (isLocked || !hasUnsavedChanges.current) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(async () => {
      await saveProgress()
    }, EvaluationConfig.AUTOSAVE_MS)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [answers, isLocked])

  const saveProgress = useCallback(async () => {
    if (isLocked || !hasUnsavedChanges.current) return

    setIsSaving(true)
    try {
      await onSave(answers, currentPage.id)
      setLastAutoSave(new Date())
      hasUnsavedChanges.current = false
    } catch (error) {
      console.error('Auto-save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }, [answers, currentPage.id, isLocked, onSave])

  const handleAnswerChange = (fieldId: string, value: number | string) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }))
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[fieldId]
      return newErrors
    })
    hasUnsavedChanges.current = true
  }

  const validateCurrentPage = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    for (const field of currentPage.fields) {
      if (field.required) {
        const value = answers[field.id]
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = 'This field is required'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = async () => {
    if (!validateCurrentPage()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0]
      document.getElementById(firstErrorField)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Save before moving to next page
    await saveProgress()

    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevious = async () => {
    // Save before moving to previous page
    await saveProgress()

    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const calculateProgress = (): number => {
    let answeredRequired = 0
    let totalRequired = 0

    for (const page of pages) {
      for (const field of page.fields) {
        if (field.required) {
          totalRequired++
          const value = answers[field.id]
          if (value !== undefined && value !== null && value !== '') {
            answeredRequired++
          }
        }
      }
    }

    return totalRequired > 0 ? (answeredRequired / totalRequired) * 100 : 0
  }

  const progress = calculateProgress()

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {!isLocked && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {Math.round(progress)}%
            </span>
            {isSaving && (
              <span className="text-sm text-gray-500 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            )}
            {lastAutoSave && !isSaving && (
              <span className="text-sm text-gray-500">
                Last saved: {lastAutoSave.toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Page Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
          <div className="flex space-x-1">
            {pages.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full ${
                  index === currentPageIndex
                    ? 'bg-blue-600'
                    : index < currentPageIndex
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Current Page Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentPage.title}
          </h2>
          {currentPage.description && (
            <p className="text-gray-600">{currentPage.description}</p>
          )}
        </div>

        <div className="space-y-6">
          {currentPage.fields.map((field) => (
            <div key={field.id} id={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {field.type === 'single-select' && field.options && (
                <div className="space-y-2">
                  {field.options.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        isLocked
                          ? 'bg-gray-50 cursor-not-allowed'
                          : answers[field.id] === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name={field.id}
                        value={option.value}
                        checked={answers[field.id] === option.value}
                        onChange={(e) => handleAnswerChange(field.id, parseInt(e.target.value))}
                        disabled={isLocked}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                      <span className="ml-3 text-sm text-gray-900">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={answers[field.id] as string || ''}
                  onChange={(e) => handleAnswerChange(field.id, e.target.value)}
                  disabled={isLocked}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                    errors[field.id] ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              )}

              {field.maxLength && field.type === 'textarea' && (
                <p className="text-xs text-gray-500 text-right">
                  {(answers[field.id] as string || '').length} / {field.maxLength}
                </p>
              )}

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
}
