'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { FormModal } from '@/components/ui/form-modal'
import { useToast } from '@/hooks/use-toast'

const timesheetEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0.1, 'Hours must be greater than 0').max(24, 'Hours cannot exceed 24'),
  category: z.enum(['DIRECT', 'INDIRECT', 'TRAINING', 'ADMIN']),
  notes: z.string().optional(),
})

type TimesheetEntryData = z.infer<typeof timesheetEntrySchema>

interface AddHoursModalProps {
  isOpen: boolean
  onClose: () => void
  placementId: string
}

export function AddHoursModal({ isOpen, onClose, placementId }: AddHoursModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Check if placement has supervisor assigned
  const { data: supervisorData, isLoading: checkingSupervisor } = useQuery({
    queryKey: ['placement-supervisor-check', placementId],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placementId}/supervisor-check`)
      if (!response.ok) throw new Error('Failed to check supervisor assignment')
      return response.json()
    },
    enabled: isOpen && !!placementId,
  })

  const createEntryMutation = useMutation({
    mutationFn: async (data: TimesheetEntryData) => {
      const response = await fetch(`/api/placements/${placementId}/timesheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save timesheet entry')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries', placementId] })
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      toast({
        title: 'Success',
        description: 'Hours logged successfully',
        type: 'success',
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        type: 'error',
      })
    },
  })

  const onSubmit = async (data: TimesheetEntryData) => {
    setIsSubmitting(true)
    try {
      await createEntryMutation.mutateAsync(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get today&apos;s date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  const categoryOptions = [
    { value: 'DIRECT', label: 'Direct Practice' },
    { value: 'INDIRECT', label: 'Indirect Practice' },
    { value: 'TRAINING', label: 'Training/Education' },
    { value: 'ADMIN', label: 'Administrative' },
  ]

  if (checkingSupervisor) {
    return (
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Hours"
        schema={timesheetEntrySchema}
        onSubmit={async () => {}}
        disabled={true}
      >
        {(form) => (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Checking supervisor assignment...</p>
            </div>
          </div>
        )}
      </FormModal>
    )
  }

  if (!supervisorData?.hasSupervisor) {
    return (
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Hours"
        schema={timesheetEntrySchema}
        onSubmit={async () => {}}
        disabled={true}
      >
        {(form) => (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Supervisor Assignment Required
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>
                    You cannot log hours until a supervisor is assigned to your placement.
                    Please contact your faculty member to assign a supervisor.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </FormModal>
    )
  }

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Hours"
      schema={timesheetEntrySchema}
      defaultValues={{
        date: today,
        hours: 8,
        category: 'DIRECT',
        notes: '',
      }}
      onSubmit={onSubmit}
      submitLabel="Add Entry"
      isSubmitting={isSubmitting}
    >
      {(form) => (
        <>
          <div>
            <label htmlFor="date" className="form-label">
              Date *
            </label>
            <input
              {...form.register('date')}
              type="date"
              className="form-input"
              aria-invalid={form.formState.errors.date ? 'true' : 'false'}
              aria-describedby={form.formState.errors.date ? 'date-error' : undefined}
            />
            {form.formState.errors.date && (
              <p id="date-error" className="form-error" role="alert">
                {String(form.formState.errors.date?.message || '')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="hours" className="form-label">
              Hours *
            </label>
            <input
              {...form.register('hours', { valueAsNumber: true })}
              type="number"
              step="0.1"
              min="0.1"
              max="24"
              className="form-input"
              placeholder="Enter hours worked"
              aria-invalid={form.formState.errors.hours ? 'true' : 'false'}
              aria-describedby={form.formState.errors.hours ? 'hours-error' : undefined}
            />
            {form.formState.errors.hours && (
              <p id="hours-error" className="form-error" role="alert">
                {String(form.formState.errors.hours?.message || '')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="form-label">
              Category *
            </label>
            <select
              {...form.register('category')}
              className="form-input"
              aria-invalid={form.formState.errors.category ? 'true' : 'false'}
              aria-describedby={form.formState.errors.category ? 'category-error' : undefined}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {form.formState.errors.category && (
              <p id="category-error" className="form-error" role="alert">
                {String(form.formState.errors.category?.message || '')}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              {...form.register('notes')}
              rows={3}
              className="form-input"
              placeholder="Describe your activities..."
              aria-invalid={form.formState.errors.notes ? 'true' : 'false'}
              aria-describedby={form.formState.errors.notes ? 'notes-error' : undefined}
            />
            {form.formState.errors.notes && (
              <p id="notes-error" className="form-error" role="alert">
                {String(form.formState.errors.notes?.message || '')}
              </p>
            )}
          </div>
        </>
      )}
    </FormModal>
  )
}
