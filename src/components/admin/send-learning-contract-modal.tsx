'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon, UserIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface Site {
  id: string
  name: string
  contactName: string
  contactEmail: string
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
  }>
}

interface SendLearningContractModalProps {
  site: Site
  isOpen: boolean
  onClose: () => void
}

export function SendLearningContractModal({ site, isOpen, onClose }: SendLearningContractModalProps) {
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [customEmail, setCustomEmail] = useState('')
  const [customName, setCustomName] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const queryClient = useQueryClient()

  const sendLearningContractMutation = useMutation({
    mutationFn: async (data: { siteId: string; email: string; name?: string }) => {
      const response = await fetch('/api/sites/send-learning-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send learning contract')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      onClose()
      setSelectedContact('')
      setCustomEmail('')
      setCustomName('')
      setShowCustomInput(false)
    },
  })

  const handleSubmit = () => {
    let email = ''
    let name = ''

    if (selectedContact === 'custom') {
      email = customEmail
      name = customName
    } else if (selectedContact === 'agency-contact') {
      email = site.contactEmail
      name = site.contactName
    } else {
      // Find the selected supervisor
      const allSupervisors = [
        ...(site.supervisors || []),
        ...(site.pendingSupervisors || [])
      ]
      const supervisor = allSupervisors.find(s => s.id === selectedContact)
      if (supervisor) {
        email = supervisor.email
        name = `${supervisor.firstName} ${supervisor.lastName}`
      }
    }

    if (!email) {
      alert('Please select a contact or enter a custom email')
      return
    }

    sendLearningContractMutation.mutate({
      siteId: site.id,
      email,
      name,
    })
  }

  if (!isOpen) return null

  // Collect all available contacts
  const allContacts = []
  
  // Add agency contact
  allContacts.push({
    id: 'agency-contact',
    name: `${site.contactName} (Agency Contact)`,
    email: site.contactEmail,
    type: 'agency-contact'
  })

  // Add supervisors
  if (site.supervisors) {
    site.supervisors.forEach(supervisor => {
      allContacts.push({
        id: supervisor.id,
        name: `${supervisor.firstName} ${supervisor.lastName} (Supervisor)`,
        email: supervisor.email,
        type: 'supervisor'
      })
    })
  }

  // Add pending supervisors
  if (site.pendingSupervisors) {
    site.pendingSupervisors.forEach(supervisor => {
      allContacts.push({
        id: supervisor.id,
        name: `${supervisor.firstName} ${supervisor.lastName} (Pending Supervisor)`,
        email: supervisor.email,
        type: 'pending-supervisor'
      })
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Send Learning Contract
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={sendLearningContractMutation.isPending}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Site Info */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Agency:</strong> {site.name}
            </p>
          </div>

          {/* Contact Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Contact to Send Learning Contract To
            </label>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {allContacts.map((contact) => (
                <label key={contact.id} className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="contact"
                    value={contact.id}
                    checked={selectedContact === contact.id}
                    onChange={(e) => setSelectedContact(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <UserIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.email}</p>
                  </div>
                </label>
              ))}
              
              {/* Custom Contact Option */}
              <label className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="contact"
                  value="custom"
                  checked={selectedContact === 'custom'}
                  onChange={(e) => {
                    setSelectedContact(e.target.value)
                    setShowCustomInput(e.target.checked)
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Custom Contact</p>
                  <p className="text-xs text-gray-500">Enter a different email address</p>
                </div>
              </label>
            </div>

            {/* Custom Input Fields */}
            {showCustomInput && (
              <div className="mt-4 space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={sendLearningContractMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={sendLearningContractMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendLearningContractMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <LoadingSpinner size="sm" />
                  <span>Sending...</span>
                </div>
              ) : (
                'Send Learning Contract'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
