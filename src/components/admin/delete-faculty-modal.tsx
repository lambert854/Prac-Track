'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  facultyStudentAssignments?: Array<{
    student: {
      id: string
      firstName: string
      lastName: string
    }
  }>
}

interface DeleteFacultyModalProps {
  faculty: Faculty
  onClose: () => void
}

export function DeleteFacultyModal({ faculty, onClose }: DeleteFacultyModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const queryClient = useQueryClient()

  const deleteFacultyMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/faculty/${faculty.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete faculty member')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faculty'] })
      onClose()
    },
    onError: (error) => {
      console.error('Delete faculty error:', error)
      alert(error.message)
    }
  })

  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      await deleteFacultyMutation.mutateAsync()
    } finally {
      setIsDeleting(false)
    }
  }

  const hasAssignments = (faculty.facultyStudentAssignments?.length || 0) > 0
  const canDelete = !hasAssignments

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Delete Faculty Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-900">
                Are you sure you want to delete <strong>{faculty.firstName} {faculty.lastName}</strong>?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {!canDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Cannot Delete Faculty Member</h4>
              <div className="text-sm text-red-700 space-y-1">
                {hasAssignments && (
                  <p>• This faculty member has {faculty.facultyStudentAssignments?.length} assigned students</p>
                )}
                <p className="mt-2">Please reassign students before deleting this faculty member.</p>
              </div>
            </div>
          )}

          {canDelete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Warning</h4>
              <p className="text-sm text-yellow-700">
                This will permanently delete the faculty member and all associated data.
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="btn-danger"
              disabled={isDeleting || !canDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete Faculty'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
