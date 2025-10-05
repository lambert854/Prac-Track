'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  UserIcon, 
  KeyIcon, 
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  lastLogin?: string
  createdAt: string
  studentProfile?: {
    program: string
    cohort: string
    requiredHours: number
  }
  facultyProfile?: {
    department: string
    title: string
  }
  supervisorProfile?: {
    organization: string
    title: string
  }
}

interface AdminSettingsProps {}

export function AdminSettings({}: AdminSettingsProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showReportsModal, setShowReportsModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      return response.json()
    },
  })

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!response.ok) throw new Error('Failed to update user role')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setShowUserModal(false)
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to reset password')
      return response.json()
    },
    onSuccess: () => {
      setShowPasswordModal(false)
    },
  })

  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  }) || []

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleRoleChange = (newRole: string) => {
    if (!selectedUser) return
    
    if (confirm(`Are you sure you want to change ${selectedUser.firstName} ${selectedUser.lastName}'s role to ${newRole}?`)) {
      updateUserRoleMutation.mutate({ userId: selectedUser.id, newRole })
    }
  }

  const handlePasswordReset = () => {
    if (!selectedUser) return
    
    if (confirm(`Are you sure you want to reset ${selectedUser.firstName} ${selectedUser.lastName}'s password? They will receive an email with instructions.`)) {
      resetPasswordMutation.mutate(selectedUser.id)
    }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: 'bg-red-100 text-red-800',
      FACULTY: 'bg-blue-100 text-blue-800',
      SUPERVISOR: 'bg-green-100 text-green-800',
      STUDENT: 'bg-yellow-100 text-yellow-800'
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {role}
      </span>
    )
  }

  const getLastLoginText = (lastLogin?: string) => {
    if (!lastLogin) return 'Never'
    
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    
    return date.toLocaleDateString()
  }

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
          <p className="text-red-600">Error loading users: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
        <p className="text-gray-600">Manage users, permissions, and system settings</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users?.filter((u: User) => u.role === 'ADMIN').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {users?.filter((u: User) => u.role === 'STUDENT').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {users?.filter((u: User) => {
                  if (!u.lastLogin) return false
                  const lastLogin = new Date(u.lastLogin)
                  const today = new Date()
                  return lastLogin.toDateString() === today.toDateString()
                }).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="FACULTY">Faculty</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="STUDENT">Student</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
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
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleUserClick(user)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {getLastLoginText(user.lastLogin)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUserClick(user)
                      }}
                      className="text-yellow-600 hover:text-yellow-900"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No users have been added to the system yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Manage User: {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2">User Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Current Role:</strong> {selectedUser.role}</p>
                  <p><strong>Last Login:</strong> {getLastLoginText(selectedUser.lastLogin)}</p>
                  <p><strong>Member Since:</strong> {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Role Management */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Change Role</h3>
                <div className="grid grid-cols-2 gap-2">
                  {['STUDENT', 'SUPERVISOR', 'FACULTY', 'ADMIN'].map((role) => (
                    <button
                      key={role}
                      onClick={() => handleRoleChange(role)}
                      disabled={selectedUser.role === role || updateUserRoleMutation.isPending}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                        selectedUser.role === role
                          ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password Management */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Password Management</h3>
                <button
                  onClick={handlePasswordReset}
                  disabled={resetPasswordMutation.isPending}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  {resetPasswordMutation.isPending ? 'Sending...' : 'Send Password Reset Email'}
                </button>
              </div>

              {/* Admin Actions */}
              {selectedUser.role === 'STUDENT' && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Admin Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setShowUserModal(false)
                        setShowReportsModal(true)
                      }}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center"
                    >
                      <DocumentTextIcon className="h-4 w-4 mr-2" />
                      View Student Reports
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement timesheet override
                        alert('Timesheet override functionality coming soon!')
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                    >
                      <ClockIcon className="h-4 w-4 mr-2" />
                      Override Timesheet Approvals
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Reports for {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <button
                onClick={() => setShowReportsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    // TODO: Implement report generation
                    alert('Hours report generation coming soon!')
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <ClockIcon className="h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Hours Report</h3>
                  <p className="text-sm text-gray-600">Export detailed timesheet data</p>
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement report generation
                    alert('Evaluation report generation coming soon!')
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <DocumentTextIcon className="h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Evaluation Report</h3>
                  <p className="text-sm text-gray-600">View all form submissions</p>
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement report generation
                    alert('Placement report generation coming soon!')
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <UserIcon className="h-8 w-8 text-yellow-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Placement Report</h3>
                  <p className="text-sm text-gray-600">Track placement history</p>
                </button>
                
                <button
                  onClick={() => {
                    // TODO: Implement report generation
                    alert('Comprehensive report generation coming soon!')
                  }}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                >
                  <DocumentTextIcon className="h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-medium text-gray-900">Comprehensive Report</h3>
                  <p className="text-sm text-gray-600">All data in one report</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
