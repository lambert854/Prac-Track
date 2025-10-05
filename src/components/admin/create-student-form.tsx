'use client'

import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateStudentFormProps {
  onClose: () => void
}

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  facultyProfile?: {
    title?: string
    officePhone?: string
  }
}

export function CreateStudentForm({ onClose }: CreateStudentFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    aNumber: '',
    program: '',
    cohort: '',
    facultyId: ''
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

  // Set default faculty when data loads
  React.useEffect(() => {
    if (faculty && faculty.length > 0 && !formData.facultyId) {
      // Find Mackenzie Reffitt or default to first faculty member
      const mackenzieReffitt = faculty.find((f: Faculty) => 
        f.firstName.toLowerCase().includes('mackenzie') && f.lastName.toLowerCase().includes('reffitt')
      )
      const defaultFaculty = mackenzieReffitt || faculty[0]
      setFormData(prev => ({ ...prev, facultyId: defaultFaculty.id }))
    }
  }, [faculty, formData.facultyId])

  const createStudentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create student')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] })
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createStudentMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create New Student</h3>
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
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
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
                placeholder="e.g., MSW, BSW"
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
                placeholder="e.g., 2024"
              />
            </div>
          </div>
          
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Faculty *
            </label>
            <select
              name="facultyId"
              value={formData.facultyId}
              onChange={handleChange}
              required
              className="form-select w-full"
            >
              <option value="">Select a faculty member...</option>
              {faculty?.map((facultyMember: Faculty) => (
                <option key={facultyMember.id} value={facultyMember.id}>
                  {facultyMember.firstName} {facultyMember.lastName}
                  {facultyMember.facultyProfile?.title && ` - ${facultyMember.facultyProfile.title}`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createStudentMutation.isPending}
              className="btn-primary"
            >
              {createStudentMutation.isPending ? 'Creating...' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
