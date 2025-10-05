'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { PlacementRequestModal } from './placement-request-modal'

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
}

export function BrowseSites() {
  const [searchQuery, setSearchQuery] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [practiceFilter, setPracticeFilter] = useState('')
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [showRequestModal, setShowRequestModal] = useState(false)

  const { data: sites, isLoading, error } = useQuery({
    queryKey: ['sites', searchQuery, cityFilter, practiceFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.append('query', searchQuery)
      if (cityFilter) params.append('city', cityFilter)
      if (practiceFilter) params.append('practice', practiceFilter)
      
      const response = await fetch(`/api/sites?${params}`)
      if (!response.ok) throw new Error('Failed to fetch sites')
      return response.json()
    },
  })

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Placement Sites</h1>
        <p className="text-gray-600">Find and request practicum placement opportunities</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search sites by name, contact, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="form-label">
                Filter by City
              </label>
              <input
                id="city"
                type="text"
                placeholder="Enter city name"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="form-input"
              />
            </div>
            <div>
              <label htmlFor="practice" className="form-label">
                Filter by Practice Area
              </label>
              <input
                id="practice"
                type="text"
                placeholder="e.g., Mental Health, Healthcare"
                value={practiceFilter}
                onChange={(e) => setPracticeFilter(e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* My Site Not Listed Button */}
      <div className="card">
        <div className="text-center py-6">
          <p className="text-gray-600 mb-4">Don't see your preferred placement site?</p>
          <button 
            onClick={() => {
              setSelectedSite(null) // Use null to indicate this is a new site submission
              setShowRequestModal(true)
            }}
            className="btn-secondary"
          >
            My Site Not Listed
          </button>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites?.map((site: Site) => (
          <div key={site.id} className="card card-hover">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {site.city}, {site.state}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  {site.contactEmail}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  {site.contactPhone}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Practice Areas</h4>
                <p className="text-sm text-gray-600">{site.practiceAreas}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Contact Person</h4>
                <p className="text-sm text-gray-600">{site.contactName}</p>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button 
                  onClick={() => {
                    setSelectedSite(site)
                    setShowRequestModal(true)
                  }}
                  className="btn-primary w-full"
                >
                  Request Placement
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sites?.length === 0 && (
        <div className="card">
          <div className="text-center py-8">
            <p className="text-gray-500">No sites found matching your criteria</p>
          </div>
        </div>
      )}

      {/* Placement Request Modal */}
      {showRequestModal && (
        <PlacementRequestModal
          site={selectedSite}
          onClose={() => {
            setShowRequestModal(false)
            setSelectedSite(null)
          }}
        />
      )}
    </div>
  )
}
