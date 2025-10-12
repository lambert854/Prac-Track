'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  facultyProfile?: {
    honorific?: string | null
    title?: string | null
    officePhone?: string | null
    roomNumber?: string | null
  }
}

interface EditFacultyFormProps {
  faculty: Faculty
  onClose: () => void
}

export function EditFacultyForm({ faculty, onClose }: EditFacultyFormProps) {
  const [formData, setFormData] = useState({
    honorific: '',
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    officePhone: '',
    roomNumber: '',
    password: '' // Password field for admin to change faculty password
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // Initialize form data when faculty prop changes
  useEffect(() => {
    setFormData({
      honorific: faculty.facultyProfile?.honorific || '',
      firstName: faculty.firstName || '',
      lastName: faculty.lastName || '',
      email: faculty.email || '',
      title: faculty.facultyProfile?.title || '',
      officePhone: faculty.facultyProfile?.officePhone || '',
      roomNumber: faculty.facultyProfile?.roomNumber || '',
      password: ''
    })
  }, [faculty])

  const updateFacultyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/admin/faculty/${faculty.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update faculty member')
      }
      
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faculty'] })
      onClose()
    },
    onError: (error) => {
      console.error('Update faculty error:', error)
      alert(error.message)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await updateFacultyMutation.mutateAsync(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Faculty Member</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="honorific" className="block text-sm font-medium text-gray-700 mb-1">
              Honorific
            </label>
            <select
              id="honorific"
              name="honorific"
              value={formData.honorific}
              onChange={handleChange}
              className="form-select w-full"
            >
              <option value="">Select honorific...</option>
              <option value="Dr.">Dr.</option>
              <option value="Prof.">Prof.</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Miss">Miss</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="form-input w-full"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="form-input w-full"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input w-full"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              className="form-input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Only enter a password if you want to change it. Leave blank to keep the current password.
            </p>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Practicum Education Director"
              className="form-input w-full"
            />
          </div>

          <div>
            <label htmlFor="officePhone" className="block text-sm font-medium text-gray-700 mb-1">
              Office Phone
            </label>
            <input
              type="tel"
              id="officePhone"
              name="officePhone"
              value={formData.officePhone}
              onChange={handleChange}
              placeholder="e.g., (555) 123-4567"
              className="form-input w-full"
            />
          </div>

          <div>
            <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="roomNumber"
              name="roomNumber"
              value={formData.roomNumber}
              onChange={handleChange}
              placeholder="e.g., Room 201, Office A-123"
              className="form-input w-full"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
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
              className="btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating...' : 'Update Faculty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
