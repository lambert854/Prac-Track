'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/use-toast'

interface TimesheetEntry {
  id: string
  date: string
  hours: number
  category: string
  notes?: string
  student: {
    firstName: string
    lastName: string
  }
  placement: {
    site: {
      name: string
    }
  }
}

interface ApprovalRowProps {
  entry: TimesheetEntry
  placementId: string
  role: 'SUPERVISOR' | 'FACULTY'
}

export function ApprovalRow({ entry, placementId, role }: ApprovalRowProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const approveMutation = useMutation({
    mutationFn: async (entryIds: string[]) => {
      const response = await fetch(`/api/placements/${placementId}/timesheets/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryIds,
          action: 'approve',
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to approve timesheet')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries', placementId] })
      if (role === 'SUPERVISOR') {
        queryClient.invalidateQueries({ queryKey: ['supervisor-dashboard'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['faculty-dashboard'] })
      }
      toast({
        title: 'Success',
        description: 'Timesheet approved successfully',
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

  const rejectMutation = useMutation({
    mutationFn: async ({ entryIds, notes }: { entryIds: string[]; notes: string }) => {
      const response = await fetch(`/api/placements/${placementId}/timesheets/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryIds,
          action: 'reject',
          notes,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to reject timesheet')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries'] })
      queryClient.invalidateQueries({ queryKey: ['timesheet-entries', placementId] })
      if (role === 'SUPERVISOR') {
        queryClient.invalidateQueries({ queryKey: ['supervisor-dashboard'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['faculty-dashboard'] })
      }
      toast({
        title: 'Success',
        description: 'Timesheet rejected successfully',
        type: 'success',
      })
      setShowRejectForm(false)
      setRejectNotes('')
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        type: 'error',
      })
    },
  })

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await approveMutation.mutateAsync([entry.id])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        type: 'error',
      })
      return
    }

    setIsProcessing(true)
    try {
      await rejectMutation.mutateAsync({
        entryIds: [entry.id],
        notes: rejectNotes,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const categoryLabels = {
    DIRECT: 'Direct Practice',
    INDIRECT: 'Indirect Practice',
    TRAINING: 'Training/Education',
    ADMIN: 'Administrative',
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">
            {entry.student.firstName} {entry.student.lastName}
          </h4>
          <p className="text-sm text-gray-600">{entry.placement.site.name}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {formatDate(entry.date)}
          </p>
          <p className="text-sm text-gray-600">
            {entry.hours}h • {categoryLabels[entry.category as keyof typeof categoryLabels]}
          </p>
        </div>
      </div>

      {/* Notes */}
      {entry.notes && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-700">{entry.notes}</p>
        </div>
      )}

      {/* Actions */}
      {!showRejectForm ? (
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={() => setShowRejectForm(true)}
            className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            <XMarkIcon className="h-4 w-4 mr-1" />
            Reject
          </button>
          <button
            onClick={handleApprove}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
            ) : (
              <CheckIcon className="h-4 w-4 mr-1" />
            )}
            Approve
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="reject-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection *
            </label>
            <textarea
              id="reject-notes"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Please explain why this timesheet entry is being rejected..."
              aria-invalid={!rejectNotes.trim() ? 'true' : 'false'}
            />
          </div>
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => {
                setShowRejectForm(false)
                setRejectNotes('')
              }}
              className="btn-outline"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1" />
              ) : (
                <XMarkIcon className="h-4 w-4 mr-1" />
              )}
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {(approveMutation.error || rejectMutation.error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-700">
              {approveMutation.error?.message || rejectMutation.error?.message}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
