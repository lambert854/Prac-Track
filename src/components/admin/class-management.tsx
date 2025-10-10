'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'

interface Class {
  id: string
  name: string
  hours: number
  facultyId: string | null
  active: boolean
  createdAt: string
  updatedAt: string
  faculty?: {
    id: string
    firstName: string
    lastName: string
    facultyProfile?: {
      honorific: string | null
    } | null
  } | null
  _count: {
    placements: number
  }
}

interface Faculty {
  id: string
  firstName: string
  lastName: string
  facultyProfile?: {
    honorific: string | null
  } | null
}

export default function ClassManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    hours: 200,
    facultyId: '',
    active: true
  })
  
  const queryClient = useQueryClient()

  // Fetch classes
  const { data: classes = [], isLoading } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: async () => {
      const response = await fetch('/api/admin/classes')
      if (!response.ok) throw new Error('Failed to fetch classes')
      return response.json()
    }
  })

  // Fetch faculty
  const { data: faculty = [] } = useQuery({
    queryKey: ['admin-faculty'],
    queryFn: async () => {
      const response = await fetch('/api/admin/faculty')
      if (!response.ok) throw new Error('Failed to fetch faculty')
      const data = await response.json()
      console.log('Faculty data loaded:', data)
      return data
    }
  })

  // Create/Update class mutation
  const classMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = editingClass ? `/api/admin/classes/${editingClass.id}` : '/api/admin/classes'
      const method = editingClass ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save class')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
      setShowForm(false)
      setEditingClass(null)
      resetForm()
    },
    onError: (error: Error) => {
      console.error('Class mutation error:', error)
      alert(`Error: ${error.message}`)
    }
  })

  // Delete class mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/classes/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete class')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      hours: 200,
      facultyId: '',
      active: true
    })
  }

  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem)
    setFormData({
      name: classItem.name,
      hours: classItem.hours,
      facultyId: classItem.facultyId || '',
      active: classItem.active
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submitting form data:', formData)
    classMutation.mutate(formData)
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  const getFacultyName = (faculty: Faculty | null | undefined) => {
    if (!faculty) return 'Unassigned'
    const honorific = faculty.facultyProfile?.honorific
    return `${honorific ? `${honorific} ` : ''}${faculty.firstName} ${faculty.lastName}`
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading classes...</div>
  }

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      {showForm && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false)
                setEditingClass(null)
                resetForm()
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Class Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="e.g., SWK 404"
                  required
                />
              </div>

              <div>
                <label htmlFor="hours" className="block text-sm font-medium text-gray-700 mb-1">
                  Required Hours *
                </label>
                <input
                  type="number"
                  id="hours"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) })}
                  className="form-input"
                  min="1"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="facultyId" className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Faculty
              </label>
              <select
                id="facultyId"
                value={formData.facultyId}
                onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                className="form-input"
              >
                <option value="">Select Faculty (Optional)</option>
                {faculty.map((f: Faculty) => (
                  <option key={f.id} value={f.id}>
                    {getFacultyName(f)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingClass(null)
                  resetForm()
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={classMutation.isPending}
                className="btn-primary"
              >
                {classMutation.isPending ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Classes List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Class
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Faculty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active Placements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.map((classItem: Class) => (
                <tr key={classItem.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{classItem.hours}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getFacultyName(classItem.faculty)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{classItem._count.placements}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      classItem.active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {classItem.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(classItem)}
                        className="text-primary hover:text-accent"
                        title="Edit class"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(classItem.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete class"
                        disabled={classItem._count.placements > 0}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {classes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No classes found. Create your first class to get started.
          </div>
        )}
      </div>
    </div>
  )
}
