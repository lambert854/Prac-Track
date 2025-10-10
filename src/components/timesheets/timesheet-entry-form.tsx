'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const timesheetEntrySchema = z.object({
  date: z.string().min(1, 'Date is required'),
  hours: z.number().min(0.1, 'Hours must be greater than 0').max(24, 'Hours cannot exceed 24'),
  category: z.enum(['DIRECT', 'INDIRECT', 'TRAINING', 'ADMIN']),
  notes: z.string().optional(),
})

type TimesheetEntryData = z.infer<typeof timesheetEntrySchema>

interface TimesheetEntry {
  id: string
  date: string
  hours: number
  category: string
  notes?: string
  locked: boolean
}

interface TimesheetEntryFormProps {
  placementId: string
  date?: string | null
  entry?: TimesheetEntry | null
  onClose: () => void
}

export function TimesheetEntryForm({ placementId, date, entry, onClose }: TimesheetEntryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // Check if placement has supervisor assigned
  const { data: supervisorData, isLoading: checkingSupervisor } = useQuery({
    queryKey: ['placement-supervisor-check', placementId],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placementId}/supervisor-check`)
      if (!response.ok) throw new Error('Failed to check supervisor assignment')
      return response.json()
    }
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TimesheetEntryData>({
    resolver: zodResolver(timesheetEntrySchema),
    defaultValues: {
      date: date || entry?.date || '',
      hours: entry?.hours || 0,
      category: (entry?.category as 'ADMIN' | 'DIRECT' | 'INDIRECT' | 'TRAINING') || 'DIRECT',
      notes: entry?.notes || '',
    },
  })

  const createOrUpdateEntryMutation = useMutation({
    mutationFn: async (data: TimesheetEntryData) => {
      console.log('Submitting timesheet entry:', data)
      const response = await fetch(`/api/placements/${placementId}/timesheets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        console.error('Timesheet entry error:', error)
        throw new Error(error.error || 'Failed to save timesheet entry')
      }
      const result = await response.json()
      console.log('Timesheet entry saved successfully:', result)
      return result
    },
    onSuccess: (data) => {
      console.log('Mutation successful, invalidating queries')
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries', placementId] })
      // Also invalidate student dashboard data
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      onClose()
    },
  })

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      console.log('Deleting timesheet entry:', entryId)
      const response = await fetch(`/api/placements/${placementId}/timesheets?entryId=${entryId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        console.error('Delete timesheet entry error:', error)
        throw new Error(error.error || 'Failed to delete timesheet entry')
      }
      return response.json()
    },
    onSuccess: () => {
      console.log('Delete successful, invalidating queries')
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries', placementId] })
      // Also invalidate student dashboard data
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] })
      onClose()
    },
  })

  const onSubmit = async (data: TimesheetEntryData) => {
    setIsSubmitting(true)
    try {
      await createOrUpdateEntryMutation.mutateAsync(data)
    } catch (error) {
      console.error('Timesheet entry error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!entry?.id) return
    
    if (window.confirm('Are you sure you want to delete this timesheet entry?')) {
      setIsSubmitting(true)
      try {
        await deleteEntryMutation.mutateAsync(entry.id)
      } catch (error) {
        console.error('Delete timesheet entry error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  useEffect(() => {
    if (date) {
      setValue('date', date)
    }
  }, [date, setValue])

  const categoryOptions = [
    { value: 'DIRECT', label: 'Direct Practice' },
    { value: 'INDIRECT', label: 'Indirect Practice' },
    { value: 'TRAINING', label: 'Training/Education' },
    { value: 'ADMIN', label: 'Administrative' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {entry ? 'Edit Timesheet Entry' : 'Add Timesheet Entry'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Supervisor Assignment Check */}
        {checkingSupervisor ? (
          <div className="p-6">
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-600">Checking supervisor assignment...</span>
            </div>
          </div>
        ) : !supervisorData?.hasSupervisor ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
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
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div>
            <label htmlFor="date" className="form-label">
              Date *
            </label>
            <input
              {...register('date')}
              type="date"
              className="form-input"
              disabled={!!entry?.locked}
            />
            {errors.date && (
              <p className="form-error">{errors.date.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="hours" className="form-label">
              Hours *
            </label>
            <input
              {...register('hours', { valueAsNumber: true })}
              type="number"
              step="0.1"
              min="0.1"
              max="24"
              className="form-input"
              placeholder="Enter hours worked"
              disabled={!!entry?.locked}
            />
            {errors.hours && (
              <p className="form-error">{errors.hours.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="form-label">
              Category *
            </label>
            <select
              {...register('category')}
              className="form-input"
              disabled={!!entry?.locked}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="form-error">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="form-label">
              Notes (Optional)
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="form-input"
              placeholder="Describe your activities..."
              disabled={!!entry?.locked}
            />
            {errors.notes && (
              <p className="form-error">{errors.notes.message}</p>
            )}
          </div>

          {entry?.locked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 text-sm">
                This entry has been approved and cannot be modified.
              </p>
            </div>
          )}

          {createOrUpdateEntryMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">
                {createOrUpdateEntryMutation.error.message}
              </p>
            </div>
          )}

          {deleteEntryMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">
                {deleteEntryMutation.error.message}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div>
              {entry && !entry.locked && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                  disabled={isSubmitting}
                >
                  Delete Entry
                </button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
                disabled={isSubmitting || !!entry?.locked}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  entry ? 'Update Entry' : 'Add Entry'
                )}
              </button>
            </div>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
