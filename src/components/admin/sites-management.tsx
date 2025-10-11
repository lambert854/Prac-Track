'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon, EnvelopeIcon, EyeIcon, LinkIcon } from '@heroicons/react/24/outline'
import { SiteForm } from './site-form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ConfirmationModal } from './confirmation-modal'
import { SendLearningContractModal } from './send-learning-contract-modal'
import { LearningContractDetailsModal } from './learning-contract-details-modal'
import { LearningContractReviewModal } from './learning-contract-review-modal'

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
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'PENDING_LEARNING_CONTRACT' | 'REJECTED'
  learningContractStatus?: 'PENDING' | 'SENT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | null
  createdAt: string
  // practicum placement Agreement fields
  agreementStartMonth?: number | null
  agreementStartYear?: number | null
  agreementExpirationDate?: string | null
  staffHasActiveLicense?: string | null
  supervisorTraining?: string | null
  // Supervisors
  supervisors?: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    supervisorProfile?: {
      title?: string
    }
  }>
  pendingSupervisors?: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
    status: string
  }>
}

// Helper function to get agreement status
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

// Helper function to check if agreement expires within one month
const isExpiringSoon = (expirationDate: Date | null) => {
  if (!expirationDate) return false
  const now = new Date()
  const oneMonthFromNow = new Date()
  oneMonthFromNow.setMonth(now.getMonth() + 1)
  return expirationDate > now && expirationDate <= oneMonthFromNow
}

export function SitesManagement() {
  const [showForm, setShowForm] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [siteToDeactivate, setSiteToDeactivate] = useState<Site | null>(null)
  const [siteToReactivate, setSiteToReactivate] = useState<Site | null>(null)
  const [modalAction, setModalAction] = useState<'deactivate' | 'reactivate' | null>(null)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [selectedSiteForEmail, setSelectedSiteForEmail] = useState<Site | null>(null)
  const [showLearningContractModal, setShowLearningContractModal] = useState(false)
  const [selectedSiteForLearningContract, setSelectedSiteForLearningContract] = useState<Site | null>(null)
  const [selectedLearningContract, setSelectedLearningContract] = useState<any>(null)
  const [selectedContractForReview, setSelectedContractForReview] = useState<any>(null)
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: allSites, isLoading, error } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('includeInactive', 'true') // Always fetch all sites
      
      const response = await fetch(`/api/sites?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sites')
      return response.json()
    },
  })

  // Filter sites based on search and active status
  const activeSites = allSites?.filter((site: Site) => 
    site.active && 
    (searchQuery === '' || 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.practiceAreas.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const inactiveSites = allSites?.filter((site: Site) => 
    !site.active && 
    site.status !== 'PENDING_APPROVAL' &&
    (searchQuery === '' || 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.practiceAreas.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  // Sites waiting for learning contract to be sent
  const pendingSites = allSites?.filter((site: Site) => 
    site.status === 'PENDING_APPROVAL' &&
    (!site.learningContractStatus || site.learningContractStatus === 'PENDING') &&
    (searchQuery === '' || 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.practiceAreas.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  // Sites with submitted learning contracts ready for final approval
  const pendingLearningContractSites = allSites?.filter((site: Site) => 
    (site.status === 'PENDING_APPROVAL' && site.learningContractStatus === 'SUBMITTED') ||
    site.status === 'PENDING_LEARNING_CONTRACT' &&
    (searchQuery === '' || 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.practiceAreas.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || []

  const deactivateSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
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
    },
  })

  const reactivateSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
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
    },
  })


  const rejectSiteMutation = useMutation({
    mutationFn: async ({ siteId, reason }: { siteId: string; reason: string }) => {
      const response = await fetch(`/api/sites/${siteId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (!response.ok) throw new Error('Failed to reject site')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })

  const finalApproveSiteMutation = useMutation({
    mutationFn: async (siteId: string) => {
      const response = await fetch(`/api/sites/${siteId}/final-approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to approve site')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
    },
  })

  const handleEdit = (site: Site) => {
    setEditingSite(site)
    setShowForm(true)
  }

  const handleDeactivate = (site: Site) => {
    setSiteToDeactivate(site)
    setSiteToReactivate(null)
    setModalAction('deactivate')
    setShowConfirmModal(true)
  }

  const confirmDeactivate = () => {
    if (siteToDeactivate) {
      deactivateSiteMutation.mutate(siteToDeactivate.id)
      setShowConfirmModal(false)
      setSiteToDeactivate(null)
    }
  }

  const confirmReactivate = () => {
    if (siteToReactivate) {
      reactivateSiteMutation.mutate(siteToReactivate.id)
      setShowConfirmModal(false)
      setSiteToReactivate(null)
    }
  }

  const cancelModal = () => {
    setShowConfirmModal(false)
    setSiteToDeactivate(null)
    setSiteToReactivate(null)
    setModalAction(null)
  }

  const handleApprove = (site: Site) => {
    setSelectedSiteForLearningContract(site)
    setShowLearningContractModal(true)
  }

  const handleReject = (site: Site) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (reason && reason.trim()) {
      rejectSiteMutation.mutate({ siteId: site.id, reason: reason.trim() })
    }
  }

  const handleFinalApprove = (site: Site) => {
    finalApproveSiteMutation.mutate(site.id)
  }

  const handleReactivate = (site: Site) => {
    setSiteToReactivate(site)
    setSiteToDeactivate(null)
    setModalAction('reactivate')
    setShowConfirmModal(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingSite(null)
  }

  const handleSiteClick = (siteId: string) => {
    router.push(`/admin/sites/${siteId}`)
  }

  const handleViewLearningContract = async (e: React.MouseEvent, site: Site) => {
    e.stopPropagation() // Prevent row click
    
    try {
      const response = await fetch(`/api/admin/learning-contracts?siteId=${site.id}`)
      if (!response.ok) throw new Error('Failed to fetch learning contract')
      const contracts = await response.json()
      
      if (contracts && contracts.length > 0) {
        setSelectedLearningContract(contracts[0])
      }
    } catch (error) {
      console.error('Error fetching learning contract:', error)
    }
  }

  const handleSupervisorLink = async (e: React.MouseEvent, site: Site) => {
    e.stopPropagation() // Prevent row click
    
    try {
      const response = await fetch(`/api/admin/learning-contracts?siteId=${site.id}`)
      if (!response.ok) throw new Error('Failed to fetch learning contract')
      const contracts = await response.json()
      
      if (contracts && contracts.length > 0) {
        const contract = contracts[0]
        const supervisorLink = `http://www.prac-track.com/agency-learning-contract/${contract.token}`
        
        // Open in new window
        window.open(supervisorLink, '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('Error fetching supervisor link:', error)
    }
  }

  const handleReviewAndApprove = async (e: React.MouseEvent, site: Site) => {
    e.stopPropagation() // Prevent row click
    
    console.log('handleReviewAndApprove called for site:', site.id)
    
    try {
      const response = await fetch(`/api/admin/learning-contracts?siteId=${site.id}`)
      if (!response.ok) throw new Error('Failed to fetch learning contract')
      const contracts = await response.json()
      
      console.log('Fetched contracts:', contracts)
      
      if (contracts && contracts.length > 0) {
        console.log('Setting selected contract for review:', contracts[0])
        setSelectedContractForReview(contracts[0])
      } else {
        console.log('No contracts found for site')
      }
    } catch (error) {
      console.error('Error fetching learning contract:', error)
    }
  }

  const handleEditClick = (e: React.MouseEvent, site: Site) => {
    e.stopPropagation() // Prevent row click
    handleEdit(site)
  }

  const handleDeactivateClick = (e: React.MouseEvent, site: Site) => {
    e.stopPropagation() // Prevent row click
    handleDeactivate(site)
  }

  const handleReactivateClick = (e: React.MouseEvent, site: Site) => {
    e.stopPropagation() // Prevent row click
    handleReactivate(site)
  }

  const handleEmailClick = (e: React.MouseEvent, site: Site) => {
    e.stopPropagation() // Prevent row click
    setSelectedSiteForEmail(site)
    setShowEmailModal(true)
    // Future state: This is where the email sending logic would be implemented.
    // For now, it just opens a modal indicating the feature is coming in production.
  }

  const cancelEmailModal = () => {
    setShowEmailModal(false)
    setSelectedSiteForEmail(null)
  }

  // Get the current sites to display (either active or inactive based on toggle)
  const currentSites = showInactive ? inactiveSites : activeSites
  
  // Pagination logic
  const itemsPerPage = 25
  const totalPages = Math.ceil(currentSites.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSites = currentSites.slice(startIndex, endIndex)

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleToggleInactive = () => {
    setShowInactive(!showInactive)
    setCurrentPage(1) // Reset to first page when switching views
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
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
          <p className="text-red-600">Error loading sites: {error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Site Management</h1>
          <p className="text-gray-600">Manage practicum placement field sites</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Field Site
        </button>
      </div>


      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search field sites by name, contact, email, or practice areas..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleToggleInactive}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showInactive
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showInactive ? `Show Active (${activeSites.length})` : `Show Inactive (${inactiveSites.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Pending Sites */}
      {pendingSites.length > 0 && (
        <div className="card border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Field Site Approvals ({pendingSites.length})</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Awaiting Review
            </span>
          </div>

          <div className="space-y-4">
            {pendingSites.map((site: Site) => (
              <div key={site.id} className="bg-white rounded-lg border border-orange-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {site.address}, {site.city}, {site.state} {site.zip}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Contact:</strong> {site.contactName} ({site.contactEmail})
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Practice Areas:</strong> {site.practiceAreas}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Submitted: {new Date(site.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleApprove(site)}
                      className="bg-green-600 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    >
                      Send Field Site Application
                    </button>
                    <button
                      onClick={() => handleReject(site)}
                      disabled={rejectSiteMutation.isPending}
                      className="bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectSiteMutation.isPending ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Learning Contract Review */}
      {pendingLearningContractSites.length > 0 && (
        <div className="card border-blue-200 bg-blue-50">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Pending Field Site Application ({pendingLearningContractSites.length})</h2>
          </div>

          <div className="space-y-4">
            {pendingLearningContractSites.map((site: Site) => (
              <div key={site.id} className="bg-white rounded-lg border border-blue-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {site.address}, {site.city}, {site.state} {site.zip}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Contact:</strong> {site.contactName} ({site.contactEmail})
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Practice Areas:</strong> {site.practiceAreas}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Field Site Application Status: {site.learningContractStatus} - {site.learningContractStatus === 'SUBMITTED' ? 'Ready for Review' : 'Under Review'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => handleSupervisorLink(e, site)}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                      title="Open supervisor link in new window"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </button>
                    {site.learningContractStatus === 'SUBMITTED' ? (
                      <button
                        onClick={(e) => handleReviewAndApprove(e, site)}
                        className="bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        Review and Approve
                      </button>
                    ) : (
                      <button
                        disabled={true}
                        className="bg-gray-400 text-white px-3 py-1 rounded-lg text-sm font-medium cursor-not-allowed opacity-50"
                      >
                        Pending Field Site
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sites */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{showInactive ? 'Inactive' : 'Active'} Sites ({currentSites.length})</h2>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
          )}
        </div>


        {/* Top Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{startIndex + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">{Math.min(endIndex, currentSites.length)}</span>
                  {' '}of{' '}
                  <span className="font-medium">{currentSites.length}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: '900px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '35%' }}>
                  Field Site Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '25%' }}>
                  Contact
                </th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '30%' }}>
                  Practice Areas
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>
                  Field Site Application
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '10%' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSites.map((site: Site) => (
                <tr 
                  key={site.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSiteClick(site.id)}
                >
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{site.name}</div>
                    <div className="text-sm text-gray-500">{site.address}</div>
                    <div className="text-sm text-gray-500">
                      {site.city}, {site.state} {site.zip}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{site.contactName}</div>
                    <div className="text-sm text-gray-500">{site.contactEmail}</div>
                    <div className="text-sm text-gray-500">{site.contactPhone}</div>
                  </td>
                  <td className="hidden md:table-cell px-4 py-4">
                    <div className="text-sm text-gray-900 whitespace-normal break-words">
                      {site.practiceAreas}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {site.learningContractStatus ? (
                        <>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            site.learningContractStatus === 'APPROVED' 
                              ? 'bg-green-100 text-green-800'
                              : site.learningContractStatus === 'SUBMITTED'
                              ? 'bg-blue-100 text-blue-800'
                              : site.learningContractStatus === 'SENT'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {site.learningContractStatus === 'APPROVED' ? 'Approved' :
                             site.learningContractStatus === 'SUBMITTED' ? 'Review' :
                             site.learningContractStatus === 'SENT' ? 'Sent' :
                             site.learningContractStatus === 'REJECTED' ? 'Rejected' :
                             'Pending'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (site.learningContractStatus === 'SUBMITTED') {
                                handleReviewAndApprove(e, site)
                              } else {
                                handleViewLearningContract(e, site)
                              }
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title={site.learningContractStatus === 'SUBMITTED' ? 'Review and approve agency application' : 'View agency application details'}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                          None
                        </span>
                      )}
                      {site.status === 'ACTIVE' && (!site.learningContractStatus || site.learningContractStatus === 'REJECTED') && 
                       (getAgreementStatus(site).status === 'expired' || 
                        getAgreementStatus(site).status === 'unknown' ||
                        (site.agreementExpirationDate && isExpiringSoon(new Date(site.agreementExpirationDate)))) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedSiteForLearningContract(site)
                            setShowLearningContractModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                          title="Send agency application"
                        >
                          <EnvelopeIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {site.agreementExpirationDate && !isNaN(new Date(site.agreementExpirationDate).getTime()) && (
                      <div className="text-xs text-gray-500 mt-1">
                        {getAgreementStatus(site).status === 'expired' ? 'Expired:' : 'Expires:'} {new Date(site.agreementExpirationDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => handleEditClick(e, site)}
                        className="text-primary hover:text-accent"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      {site.active ? (
                        <button
                          onClick={(e) => handleDeactivateClick(e, site)}
                          className="text-red-600 hover:text-red-900"
                          disabled={deactivateSiteMutation.isPending}
                          title="Deactivate site"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handleReactivateClick(e, site)}
                          className="text-green-600 hover:text-green-900"
                          disabled={reactivateSiteMutation.isPending}
                          title="Reactivate site"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {activeSites.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No active agencies found</p>
          </div>
        )}

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">{startIndex + 1}</span>
                  {' '}to{' '}
                  <span className="font-medium">{Math.min(endIndex, currentSites.length)}</span>
                  {' '}of{' '}
                  <span className="font-medium">{currentSites.length}</span>
                  {' '}results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
                      )
                    }
                    return null
                  })}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Site Form Modal */}
      {showForm && (
        <SiteForm
          site={editingSite}
          onClose={handleFormClose}
        />
      )}

      {/* Confirmation Modal */}
      {modalAction && (
        <ConfirmationModal
          isOpen={showConfirmModal}
          title={modalAction === 'deactivate' ? 'Deactivate Field Site' : 'Reactivate Field Site'}
          message={modalAction === 'deactivate' 
            ? `Are you sure you want to deactivate "${siteToDeactivate?.name}"? It will be moved to the inactive section.`
            : `Are you sure you want to reactivate "${siteToReactivate?.name}"? It will be moved to the active section.`
          }
          confirmText={modalAction === 'deactivate' ? 'Deactivate' : 'Reactivate'}
          cancelText="Cancel"
          onConfirm={modalAction === 'deactivate' ? confirmDeactivate : confirmReactivate}
          onCancel={cancelModal}
          isLoading={modalAction === 'deactivate' ? deactivateSiteMutation.isPending : reactivateSiteMutation.isPending}
          variant={modalAction === 'deactivate' ? 'danger' : 'success'}
        />
      )}

      {/* Email Modal */}
      <ConfirmationModal
        isOpen={showEmailModal}
        title="Email Agreement"
        message="Email functions coming in production. This feature will allow you to send agreement renewal emails to agency contacts."
        confirmText="OK"
        cancelText=""
        onConfirm={cancelEmailModal}
        onCancel={cancelEmailModal}
        isLoading={false}
        variant="info"
      />

      {/* Send Learning Contract Modal */}
      {selectedSiteForLearningContract && (
        <SendLearningContractModal
          site={selectedSiteForLearningContract}
          isOpen={showLearningContractModal}
          onClose={() => {
            setShowLearningContractModal(false)
            setSelectedSiteForLearningContract(null)
          }}
        />
      )}

      {/* Learning Contract Details Modal */}
      {selectedLearningContract && (
        <LearningContractDetailsModal
          contract={selectedLearningContract}
          onClose={() => setSelectedLearningContract(null)}
        />
      )}

      {/* Learning Contract Review Modal */}
      {selectedContractForReview && (
        <LearningContractReviewModal
          contract={selectedContractForReview}
          onClose={() => setSelectedContractForReview(null)}
        />
      )}
    </div>
  )
}








