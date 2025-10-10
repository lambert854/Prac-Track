'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  ArrowLeftIcon, 
  PencilIcon, 
  TrashIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { SiteForm } from './site-form'
import { AddSupervisorForm } from './add-supervisor-form'
import { EditSupervisorForm } from './edit-supervisor-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Site {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  contactName: string
  contactEmail: string
  contactPhone: string
  practiceAreas: string
  active: boolean
  createdAt: string
  updatedAt: string
  // Practicum Placement Agreement fields
  agreementStartMonth?: number | null
  agreementStartYear?: number | null
  agreementExpirationDate?: string | null
  staffHasActiveLicense?: string | null
  supervisorTraining?: string | null
  supervisors?: {
    id: string
    title?: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
  placements?: {
    id: string
    status: string
    startDate: string
    endDate: string
    student: {
      firstName: string
      lastName: string
      email: string
    }
  }[]
}

interface SiteDetailViewProps {
  siteId: string
}

export function SiteDetailView({ siteId }: SiteDetailViewProps) {
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAddSupervisor, setShowAddSupervisor] = useState(false)
  const [editingSupervisor, setEditingSupervisor] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [supervisorToDelete, setSupervisorToDelete] = useState<{id: string, name: string} | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  // Calculate agreement status
  const getAgreementStatus = (site: Site) => {
    if (!site.agreementExpirationDate) {
      return { status: 'unknown', label: 'Unknown', color: 'gray' }
    }
    
    const expirationDate = new Date(site.agreementExpirationDate)
    const currentDate = new Date()
    
    if (currentDate > expirationDate) {
      return { status: 'expired', label: 'Expired', color: 'red' }
    } else {
      return { status: 'active', label: 'Active', color: 'green' }
    }
  }

  const { data: site, isLoading, error } = useQuery({
    queryKey: ['site', siteId],
    queryFn: async () => {
      const response = await fetch(`/api/sites/${siteId}`)
      if (!response.ok) throw new Error('Failed to fetch site')
      return response.json()
    },
  })

  const deactivateSiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      })
      if (!response.ok) throw new Error('Failed to deactivate site')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
    },
  })

  const reactivateSiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      })
      if (!response.ok) throw new Error('Failed to reactivate site')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
    },
  })

  const deleteSupervisorMutation = useMutation({
    mutationFn: async (supervisorId: string) => {
      const response = await fetch(`/api/admin/supervisors/${supervisorId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete supervisor')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site', siteId] })
      queryClient.invalidateQueries({ queryKey: ['supervisors'] })
    },
  })

  const deleteSiteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/sites/${siteId}?hard=true`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete site')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      router.push('/admin/sites')
    },
  })

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleDeactivate = () => {
    if (confirm('Are you sure you want to deactivate this site? It will be moved to the inactive section.')) {
      deactivateSiteMutation.mutate()
    }
  }

  const handleReactivate = () => {
    if (confirm('Are you sure you want to reactivate this site? It will be moved back to the active section.')) {
      reactivateSiteMutation.mutate()
    }
  }

  const handleFormClose = () => {
    setShowEditForm(false)
    // Ensure data is refreshed when form closes
    queryClient.invalidateQueries({ queryKey: ['site', siteId] })
  }

  const handleDeleteSupervisor = (supervisorId: string, supervisorName: string) => {
    setSupervisorToDelete({ id: supervisorId, name: supervisorName })
  }

  const confirmDeleteSupervisor = () => {
    if (supervisorToDelete) {
      deleteSupervisorMutation.mutate(supervisorToDelete.id)
      setSupervisorToDelete(null)
    }
  }

  const handleDeleteSite = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteSite = () => {
    deleteSiteMutation.mutate()
    setShowDeleteConfirm(false)
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
          <p className="text-red-600">Error loading site: {error.message}</p>
          <button
            onClick={() => router.push('/admin/sites')}
            className="mt-4 btn-primary"
          >
            Back to Sites
          </button>
        </div>
      </div>
    )
  }

  if (!site) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-gray-600">Site not found</p>
          <button
            onClick={() => router.push('/admin/sites')}
            className="mt-4 btn-primary"
          >
            Back to Sites
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/admin/sites')}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeftIcon className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
            <p className="text-gray-600">Site Details</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
            site.active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {site.active ? 'Active' : 'Inactive'}
          </span>
          
          <button
            onClick={handleEdit}
            className="btn-outline flex items-center"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
          
          {site.active ? (
            <button
              onClick={handleDeactivate}
              className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center"
              disabled={deactivateSiteMutation.isPending}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {deactivateSiteMutation.isPending ? 'Deactivating...' : 'Deactivate'}
            </button>
          ) : (
            <button
              onClick={handleReactivate}
              className="btn-outline text-green-600 border-green-300 hover:bg-green-50 flex items-center"
              disabled={reactivateSiteMutation.isPending}
            >
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {reactivateSiteMutation.isPending ? 'Reactivating...' : 'Reactivate'}
            </button>
          )}

          {/* Admin-only delete button */}
          {session?.user?.role === 'ADMIN' && (
            <button
              onClick={handleDeleteSite}
              className="btn-outline text-red-600 border-red-300 hover:bg-red-50 flex items-center"
              disabled={deleteSiteMutation.isPending}
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {deleteSiteMutation.isPending ? 'Deleting...' : 'Delete Site'}
            </button>
          )}
        </div>
      </div>

      {/* Site Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">{site.name}</p>
                <p className="text-sm text-gray-600">{site.address}</p>
                <p className="text-sm text-gray-600">{site.city}, {site.state} {site.zip}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <UserGroupIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Practice Areas</p>
                <p className="text-sm text-gray-600">{site.practiceAreas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">{site.contactName}</p>
                <p className="text-sm text-gray-600">Primary Contact</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-900">{site.contactEmail}</p>
                <p className="text-sm text-gray-600">Email</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-900">{site.contactPhone}</p>
                <p className="text-sm text-gray-600">Phone</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Practicum Placement Agreement */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Practicum Placement Agreement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Agreement Status */}
          <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
            <div className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full mb-2 ${
              getAgreementStatus(site).color === 'green' 
                ? 'bg-green-100 text-green-800'
                : getAgreementStatus(site).color === 'red'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {getAgreementStatus(site).label}
            </div>
            <span className="text-sm font-medium text-gray-900">Agreement Status</span>
          </div>

          {/* Start Date */}
          {site.agreementStartMonth && site.agreementStartYear && !isNaN(new Date(site.agreementStartYear, site.agreementStartMonth - 1, 1).getTime()) && (
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <CalendarIcon className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">
                {new Date(site.agreementStartYear, site.agreementStartMonth - 1, 1).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </p>
              <span className="text-sm text-gray-600">Start Date</span>
            </div>
          )}

          {/* Expiration Date */}
          {site.agreementExpirationDate && !isNaN(new Date(site.agreementExpirationDate).getTime()) && (
            <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
              <CalendarIcon className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-900">
                {new Date(site.agreementExpirationDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}
              </p>
              <span className="text-sm text-gray-600">Expiration Date</span>
            </div>
          )}

          {/* Staff License */}
          <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
            <UserGroupIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {site.staffHasActiveLicense || 'Not specified'}
            </p>
            <span className="text-sm text-gray-600">Staff with Active SW License</span>
          </div>

          {/* Supervisor Training */}
          <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
            <UserGroupIcon className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-900">
              {site.supervisorTraining || 'Not specified'}
            </p>
            <span className="text-sm text-gray-600">Field Supervisor Training</span>
          </div>
        </div>
      </div>

      {/* Supervisors Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Supervisors</h2>
          <button
            onClick={() => setShowAddSupervisor(true)}
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Supervisor
          </button>
        </div>
        
        {site.supervisors && site.supervisors.length > 0 ? (
          <div className="space-y-3">
            {site.supervisors.map((supervisor: { id: string; title?: string; user: { id: string; firstName: string; lastName: string; email: string; phone?: string | null } }) => (
              <div key={supervisor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserGroupIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {supervisor.user.firstName} {supervisor.user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{supervisor.user.email}</p>
                    {supervisor.title && (
                      <p className="text-xs text-gray-500">{supervisor.title}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingSupervisor({
                      id: supervisor.user.id,
                      firstName: supervisor.user.firstName,
                      lastName: supervisor.user.lastName,
                      email: supervisor.user.email,
                      phone: supervisor.user.phone,
                      supervisorProfile: {
                        id: supervisor.id,
                        title: supervisor.title,
                        site: {
                          id: site.id,
                          name: site.name,
                          active: site.active
                        }
                      }
                    })}
                    className="text-blue-600 hover:text-blue-800 p-1"
                    title="Edit Supervisor"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSupervisor(supervisor.user.id, `${supervisor.user.firstName} ${supervisor.user.lastName}`)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete Supervisor"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <UserGroupIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No supervisors assigned to this site</p>
            <p className="text-sm text-gray-400 mt-1">Click "Add Supervisor" to assign supervisors to this site</p>
          </div>
        )}
      </div>

      {/* Site Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Placements</p>
              <p className="text-2xl font-bold text-gray-900">{site.placements?.length || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {site.placements?.filter((p: { status: string }) => p.status === 'ACTIVE').length || 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {site.placements?.filter((p: { status: string }) => p.status === 'PENDING').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CalendarIcon className="h-8 w-8 text-gray-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Placements</p>
              <p className="text-2xl font-bold text-gray-900">
                {site.placements?.filter((p: { status: string }) => p.status === 'COMPLETE').length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Placements History */}
      {site.placements && site.placements.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Placement History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {site.placements.map((placement) => (
                  <tr key={placement.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {placement.student.firstName} {placement.student.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{placement.student.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        placement.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : placement.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : placement.status === 'COMPLETE'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {placement.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(placement.startDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(placement.endDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Form Modal */}
      {showEditForm && (
        <SiteForm
          site={site}
          onClose={handleFormClose}
        />
      )}

      {showAddSupervisor && (
        <AddSupervisorForm
          siteId={siteId}
          siteName={site.name}
          onClose={() => {
            setShowAddSupervisor(false)
            queryClient.invalidateQueries({ queryKey: ['site', siteId] })
          }}
        />
      )}

      {editingSupervisor && (
        <EditSupervisorForm
          supervisor={editingSupervisor}
          onClose={() => {
            setEditingSupervisor(null)
            queryClient.invalidateQueries({ queryKey: ['site', siteId] })
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Site
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently delete "{site.name}" and all associated data including supervisors and placement history. This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-outline"
                  disabled={deleteSiteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSite}
                  className="btn-primary bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleteSiteMutation.isPending}
                >
                  {deleteSiteMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Site'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supervisor Delete Confirmation Modal */}
      {supervisorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <TrashIcon className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Supervisor
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> This will permanently delete "{supervisorToDelete.name}" and remove them from all associated placements. This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSupervisorToDelete(null)}
                  className="btn-outline"
                  disabled={deleteSupervisorMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteSupervisor}
                  className="btn-primary bg-red-600 hover:bg-red-700 text-white"
                  disabled={deleteSupervisorMutation.isPending}
                >
                  {deleteSupervisorMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Supervisor'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
