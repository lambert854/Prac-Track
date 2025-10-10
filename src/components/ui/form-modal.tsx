'use client'

import { ReactNode, useEffect, useRef } from 'react'
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { z } from 'zod'
import { LoadingSpinner } from './loading-spinner'

interface FormModalProps<TSchema extends z.ZodType> {
  isOpen: boolean
  onClose: () => void
  title: string
  schema: TSchema
  defaultValues?: Partial<z.infer<TSchema>>
  onSubmit: (data: z.infer<TSchema>) => Promise<void>
  children: (form: UseFormReturn<any>) => ReactNode
  submitLabel?: string
  cancelLabel?: string
  isSubmitting?: boolean
  disabled?: boolean
}

export function FormModal<TSchema extends z.ZodType>({
  isOpen,
  onClose,
  title,
  schema,
  defaultValues,
  onSubmit,
  children,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  isSubmitting = false,
  disabled = false,
}: FormModalProps<TSchema>) {
  const form = useForm<any>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues as any,
  })

  const modalRef = useRef<HTMLDivElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      form.reset(defaultValues as any)
    }
  }, [isOpen, defaultValues, form])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Focus the modal when it opens
      modalRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSubmit = async (data: z.infer<TSchema>) => {
    try {
      await onSubmit(data)
      onClose()
    } catch (error) {
      // Error handling is done by the parent component
      console.error('Form submission error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        tabIndex={-1}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-6 space-y-6">
          {children(form)}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isSubmitting}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSubmitting || disabled}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                submitLabel
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
