'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface EditStudentFormProps {
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    studentProfile?: {
      aNumber: string
      program: string
      cohort: string
    }
  }
  onClose: () => void
}

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  facultyProfile?: {
    title: string
    department: string
  }
}

export function EditStudentForm({ student, onClose }: EditStudentFormProps) {
  const [formData, setFormData] = useState({
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    aNumber: student.studentProfile?.aNumber || '',
    program: student.studentProfile?.program || '',
    cohort: student.studentProfile?.cohort || '',
    password: '' // Optional password change
  })
  const queryClient = useQueryClient()

  const { data: faculty } = useQuery({
    queryKey: ['faculty-for-assignment'],
    queryFn: async () => {
      const response = await fetch('/api/admin/faculty')
      if (!response.ok) throw new Error('Failed to fetch faculty')
      return response.json()
    },
  })

  const updateStudentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update student')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      onClose()
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateStudentMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Student</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-input w-full"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID Number * (e.g., A0001234)
            </label>
            <input
              type="text"
              name="aNumber"
              value={formData.aNumber}
              onChange={handleChange}
              required
              pattern="A[0-9]{7}"
              placeholder="A0001234"
              className="form-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">8 characters: A followed by 7 digits</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password (leave blank to keep current)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program *
              </label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleChange}
                required
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cohort *
              </label>
              <input
                type="text"
                name="cohort"
                value={formData.cohort}
                onChange={handleChange}
                required
                className="form-input w-full"
              />
            </div>
          </div>
          

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={updateStudentMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateStudentMutation.isPending}
            >
              {updateStudentMutation.isPending ? 'Updating...' : 'Update Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
