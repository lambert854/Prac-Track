'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, AcademicCapIcon, UserIcon } from '@heroicons/react/24/outline'

interface FacultyAssignment {
  id: string
  student: {
    id: string
    firstName: string
    lastName: string
    email: string
    studentProfile?: {
      program: string
      cohort: string
    }
  }
  faculty: {
    id: string
    firstName: string
    lastName: string
    email: string
    facultyProfile?: {
      honorific?: string
      title: string
    }
  }
  createdAt: string
}

interface Faculty {
  id: string
  firstName: string
  lastName: string
  email: string
  facultyProfile?: {
    honorific?: string
    title: string
  }
}

interface EditAssignmentModalProps {
  assignment: FacultyAssignment
  faculty: Faculty[]
  onClose: () => void
  onUpdate: (facultyId: string) => void
  isUpdating: boolean
}

export function EditAssignmentModal({ 
  assignment, 
  faculty, 
  onClose, 
  onUpdate, 
  isUpdating 
}: EditAssignmentModalProps) {
  const [selectedFacultyId, setSelectedFacultyId] = useState(assignment.faculty.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFacultyId && selectedFacultyId !== assignment.faculty.id) {
      onUpdate(selectedFacultyId)
    } else {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Edit Faculty Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Assignment Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Current Assignment</h3>
            <div className="flex items-start space-x-6">
              <div className="flex items-start space-x-3 flex-1">
                <UserIcon className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {assignment.student.firstName} {assignment.student.lastName}
                  </p>
                  <p className="text-sm text-gray-600 break-all">{assignment.student.email}</p>
                  {assignment.student.studentProfile && (
                    <p className="text-xs text-gray-500">
                      {assignment.student.studentProfile.program} - {assignment.student.studentProfile.cohort}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="text-gray-400 mt-1 flex-shrink-0">→</div>
              
              <div className="flex items-start space-x-3 flex-1">
                <AcademicCapIcon className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {assignment.faculty.facultyProfile?.honorific && `${assignment.faculty.facultyProfile.honorific} `}
                    {assignment.faculty.firstName} {assignment.faculty.lastName}
                  </p>
                  <p className="text-sm text-gray-600 break-all">{assignment.faculty.email}</p>
                  {assignment.faculty.facultyProfile && (
                    <p className="text-xs text-gray-500">
                      {assignment.faculty.facultyProfile.title}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Faculty Selection */}
          <div>
            <label htmlFor="faculty" className="block text-sm font-medium text-gray-700 mb-2">
              Assign to Faculty Member
            </label>
            <select
              id="faculty"
              value={selectedFacultyId}
              onChange={(e) => setSelectedFacultyId(e.target.value)}
              className="form-select w-full text-sm"
              required
            >
              <option value="">Select a faculty member...</option>
              {faculty.map((facultyMember) => (
                <option key={facultyMember.id} value={facultyMember.id}>
                  {facultyMember.facultyProfile?.honorific && `${facultyMember.facultyProfile.honorific} `}
                  {facultyMember.firstName} {facultyMember.lastName}
                  {facultyMember.facultyProfile?.title && ` - ${facultyMember.facultyProfile.title}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Email: {faculty.find(f => f.id === selectedFacultyId)?.email || 'Select a faculty member to see email'}
            </p>
          </div>

          {/* Assignment Date */}
          <div className="text-sm text-gray-500">
            <p>Originally assigned: {new Date(assignment.createdAt).toLocaleDateString()}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isUpdating || !selectedFacultyId}
            >
              {isUpdating ? 'Updating...' : 'Update Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
