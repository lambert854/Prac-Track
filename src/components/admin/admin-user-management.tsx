'use client'

import {
    ArrowPathIcon,
    EnvelopeIcon,
    ExclamationTriangleIcon,
    KeyIcon,
    PencilIcon,
    ShieldCheckIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline'
import { UserRole } from '@prisma/client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  active: boolean
  lastLogin: string | null
  createdAt: string
  studentProfile?: {
    id: string
    program: string
    cohort: string
  } | null
  facultyProfile?: {
    id: string
    title: string
    honorific: string | null
  } | null
  supervisorProfile?: {
    id: string
    siteId: string
  } | null
}

interface RoleUpdateData {
  userId: string
  role: UserRole
}

export function AdminUserManagement() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [activeFilter, setActiveFilter] = useState<UserRole | 'ALL'>('ALL')
  const queryClient = useQueryClient()

  // Fetch users
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    }
  })

  // Update user role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: RoleUpdateData) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update user role')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowRoleModal(false)
      setSelectedUser(null)
    },
    onError: (error) => {
      console.error('Failed to update user role:', error)
    }
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, password }: { userId: string; password: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reset password')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowPasswordModal(false)
      setSelectedUser(null)
      setNewPassword('')
      // Show success message
    },
    onError: (error) => {
      console.error('Failed to reset password:', error)
    }
  })

  // Send password reset link mutation
  const sendPasswordResetMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/send-password-reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send password reset link')
      }

      return response.json()
    },
    onSuccess: () => {
      setShowPasswordModal(false)
      setSelectedUser(null)
      // Show success message
    },
    onError: (error) => {
      console.error('Failed to send password reset link:', error)
    }
  })

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'FACULTY':
        return 'bg-blue-100 text-blue-800'
      case 'SUPERVISOR':
        return 'bg-green-100 text-green-800'
      case 'STUDENT':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (active: boolean) => {
    return active 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  const formatUserName = (user: User) => {
    const parts = []
    
    // Add honorific if available (for faculty)
    if (user.facultyProfile?.honorific) {
      parts.push(user.facultyProfile.honorific)
    }
    
    // Add first and last name
    parts.push(user.firstName, user.lastName)
    
    return parts.join(' ')
  }

  // Filter users based on active filter
  const filteredUsers = users.filter((user: User) => {
    if (activeFilter === 'ALL') return true
    return user.role === activeFilter
  })

  const handleFilterClick = (filter: UserRole | 'ALL') => {
    setActiveFilter(filter)
  }

  const handleRoleUpdate = (user: User) => {
    setSelectedUser(user)
    setShowRoleModal(true)
  }

  const confirmRoleUpdate = () => {
    if (selectedUser) {
      updateRoleMutation.mutate({
        userId: selectedUser.id,
        role: selectedUser.role
      })
    }
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setNewPassword('')
    setShowPasswordModal(true)
  }

  const handleDirectPasswordReset = () => {
    if (!selectedUser || !newPassword.trim()) {
      alert('Please enter a password')
      return
    }
    resetPasswordMutation.mutate({
      userId: selectedUser.id,
      password: newPassword.trim()
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Users</h3>
            <p className="text-red-700 mt-1">
              {error instanceof Error ? error.message : 'Failed to load users'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button 
          onClick={() => handleFilterClick('ALL')}
          className={`bg-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-md cursor-pointer ${
            activeFilter === 'ALL' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleFilterClick('ADMIN')}
          className={`bg-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-md cursor-pointer ${
            activeFilter === 'ADMIN' ? 'ring-2 ring-red-500 bg-red-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldCheckIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u: User) => u.role === 'ADMIN').length}
              </p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleFilterClick('FACULTY')}
          className={`bg-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-md cursor-pointer ${
            activeFilter === 'FACULTY' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Faculty</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u: User) => u.role === 'FACULTY').length}
              </p>
            </div>
          </div>
        </button>

        <button 
          onClick={() => handleFilterClick('STUDENT')}
          className={`bg-white p-6 rounded-lg shadow transition-all duration-200 hover:shadow-md cursor-pointer ${
            activeFilter === 'STUDENT' ? 'ring-2 ring-purple-500 bg-purple-50' : ''
          }`}
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter((u: User) => u.role === 'STUDENT').length}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Demo Data Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-800">
              <strong>Demo Data Notice:</strong> This system contains demonstration data for testing purposes. All user information shown here is sample data and will be replaced with real data in production.
            </p>
          </div>
        </div>
      </div>

      {/* Active Filter Indicator */}
      {activeFilter !== 'ALL' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Filter Active:</strong> Showing only {activeFilter.toLowerCase()} users ({filteredUsers.length} of {users.length} total)
                </p>
              </div>
            </div>
            <button
              onClick={() => handleFilterClick('ALL')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatUserName(user)}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.studentProfile && (
                      <div>
                        <div className="font-medium">{user.studentProfile.program}</div>
                        <div className="text-gray-500">{user.studentProfile.cohort}</div>
                      </div>
                    )}
                    {user.facultyProfile && (
                      <div>
                        <div className="font-medium">Faculty</div>
                        {user.facultyProfile.title && (
                          <div className="text-gray-500">{user.facultyProfile.title}</div>
                        )}
                      </div>
                    )}
                    {user.supervisorProfile && (
                      <div>
                        <div className="font-medium">Supervisor</div>
                      </div>
                    )}
                    {!user.studentProfile && !user.facultyProfile && !user.supervisorProfile && (
                      <span className="text-gray-400">No profile</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.active)}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin 
                      ? new Date(user.lastLogin).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleRoleUpdate(user)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Change Role"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Reset Password"
                    >
                      <KeyIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Update Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Change User Role
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Changing role for: <strong>{formatUserName(selectedUser)}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Current role: <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role}
                  </span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Role
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    role: e.target.value as UserRole
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STUDENT">Student</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="FACULTY">Faculty</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRoleUpdate}
                  disabled={updateRoleMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Password Reset Options
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Reset password for: <strong>{formatUserName(selectedUser)}</strong>
                </p>
                <p className="text-sm text-gray-600">
                  Email: <span className="font-mono text-blue-600">{selectedUser.email}</span>
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <ArrowPathIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Direct Password Reset</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Set a specific password for the user. This allows you to login as this user if needed.
                      </p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            New Password
                          </label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <button
                          onClick={handleDirectPasswordReset}
                          disabled={resetPasswordMutation.isPending || !newPassword.trim()}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <EnvelopeIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">Send Reset Link</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Send a secure password reset link to the user's email address.
                      </p>
                      <div className="mt-2">
                        <button
                          onClick={() => sendPasswordResetMutation.mutate(selectedUser.id)}
                          disabled={sendPasswordResetMutation.isPending}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {sendPasswordResetMutation.isPending ? 'Sending...' : 'Send Reset Link'}
                        </button>
                        <p className="text-xs text-gray-500 mt-1">
                          Link will redirect to: <a href="https://prac-track.com/forgot-password" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">prac-track.com/forgot-password</a>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
