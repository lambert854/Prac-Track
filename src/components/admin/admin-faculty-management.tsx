'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  AcademicCapIcon, 
  UserIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CreateFacultyForm } from './create-faculty-form'
import { EditFacultyForm } from './edit-faculty-form'
import { DeleteFacultyModal } from './delete-faculty-modal'
import { FacultyDetailsModal } from './faculty-details-modal'

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: string
  lastLogin?: string | null
  facultyProfile?: {
    honorific: string | null
    title: string | null
    officePhone: string | null
    roomNumber: string | null
  }
  facultyStudentAssignments?: Array<{
    id: string
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
  }>
  facultyPlacements?: Array<{
    id: string
    status: string
    startDate: string
    endDate: string
    student: {
      firstName: string
      lastName: string
    }
    site: {
      name: string
    }
  }>
}

export function AdminFacultyManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [deletingFaculty, setDeletingFaculty] = useState<Faculty | null>(null)
  const [viewingFaculty, setViewingFaculty] = useState<Faculty | null>(null)

  const { data: allFaculty, isLoading, error } = useQuery({
    queryKey: ['admin-faculty'],
    queryFn: async () => {
      const response = await fetch('/api/admin/faculty', {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch faculty')
      return response.json()
    },
  })

  // Client-side filtering
  const filteredFaculty = allFaculty?.filter((facultyMember: Faculty) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      facultyMember.firstName.toLowerCase().includes(searchLower) ||
      facultyMember.lastName.toLowerCase().includes(searchLower) ||
      facultyMember.email.toLowerCase().includes(searchLower) ||
      facultyMember.facultyProfile?.title?.toLowerCase().includes(searchLower)
    )
  }) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading faculty: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
          <p className="text-gray-600">View and manage faculty members</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Faculty
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <input
            type="text"
            placeholder="Search faculty by name, email, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Faculty</p>
              <p className="text-2xl font-bold text-gray-900">{allFaculty?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">With Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {allFaculty?.filter((f: Faculty) => f.facultyStudentAssignments && f.facultyStudentAssignments.length > 0).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Faculty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFaculty.map((facultyMember: Faculty) => (
          <div key={facultyMember.id} className="card">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <AcademicCapIcon className="h-10 w-10 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {facultyMember.facultyProfile?.honorific && `${facultyMember.facultyProfile.honorific} `}{facultyMember.firstName} {facultyMember.lastName}
                </h3>
                <p className="text-sm text-gray-600 truncate">{facultyMember.email}</p>
                
                {facultyMember.facultyProfile && (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Title:</span> {facultyMember.facultyProfile.title}
                    </p>
                    {facultyMember.facultyProfile.officePhone && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Phone:</span> {facultyMember.facultyProfile.officePhone}
                      </p>
                    )}
                    {facultyMember.facultyProfile.roomNumber && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Location:</span> {facultyMember.facultyProfile.roomNumber}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-600">
                    {facultyMember.facultyStudentAssignments?.length || 0} Assigned Students
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewingFaculty(facultyMember)}
                    className="text-green-600 hover:text-green-800 p-1"
                    title="View Faculty Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingFaculty(facultyMember)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit Faculty"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingFaculty(facultyMember)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Faculty"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFaculty.length === 0 && (
        <div className="card text-center py-8">
          <AcademicCapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Faculty Found</h3>
          <p className="text-gray-600">
            {searchQuery 
              ? 'Try adjusting your search criteria.'
              : 'No faculty members have been added to the system yet.'
            }
          </p>
        </div>
      )}

      {/* Create Faculty Form Modal */}
      {showCreateForm && (
        <CreateFacultyForm onClose={() => setShowCreateForm(false)} />
      )}

      {/* Edit Faculty Form Modal */}
      {editingFaculty && (
        <EditFacultyForm 
          faculty={editingFaculty} 
          onClose={() => setEditingFaculty(null)} 
        />
      )}

      {/* Delete Faculty Confirmation Modal */}
      {deletingFaculty && (
        <DeleteFacultyModal 
          faculty={deletingFaculty} 
          onClose={() => setDeletingFaculty(null)} 
        />
      )}

      {/* Faculty Details Modal */}
      {viewingFaculty && (
        <FacultyDetailsModal 
          faculty={viewingFaculty} 
          onClose={() => setViewingFaculty(null)} 
        />
      )}
    </div>
  )
}
