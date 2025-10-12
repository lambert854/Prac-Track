'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useSession } from 'next-auth/react'

const placementRequestSchema = z.object({
  // Site submission fields (when site is null)
  siteName: z.string().optional(),
  siteAddress: z.string().optional(),
  siteCity: z.string().optional(),
  siteState: z.string().optional(),
  siteZip: z.string().optional(),
  siteContactName: z.string().optional(),
  siteContactEmail: z.string().email().optional(),
  siteContactPhone: z.string().optional(),
  sitePracticeAreas: z.string().optional(),
  // Placement request fields
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  classId: z.string().min(1, 'Class is required'),
  supervisorOption: z.enum(['existing', 'new']),
  supervisorId: z.string().optional(),
  supervisorFirstName: z.string().optional(),
  supervisorLastName: z.string().optional(),
  supervisorEmail: z.string().email().optional(),
  supervisorPhone: z.string().optional(),
  supervisorTitle: z.string().optional(),
  // New supervisor fields
  supervisorLicensedSW: z.enum(['YES', 'NO']).optional(),
  supervisorLicenseNumber: z.string().optional(),
  supervisorHighestDegree: z.enum(['BSW', 'MSW', 'OTHER']).optional(),
  supervisorOtherDegree: z.string().optional(),
}).refine((data) => {
  // Validate supervisor fields based on option
  if (data.supervisorOption === 'existing') {
    if (!data.supervisorId) return false
  } else if (data.supervisorOption === 'new' || !data.supervisorOption) {
    if (!data.supervisorFirstName || !data.supervisorLastName || !data.supervisorEmail) return false
    if (!data.supervisorLicensedSW || !['YES', 'NO'].includes(data.supervisorLicensedSW)) return false
    if (!data.supervisorHighestDegree || !['BSW', 'MSW', 'OTHER'].includes(data.supervisorHighestDegree)) return false
    if (data.supervisorLicensedSW === 'YES' && !data.supervisorLicenseNumber) return false
    if (data.supervisorHighestDegree === 'OTHER' && !data.supervisorOtherDegree) return false
  }
  return true
}, {
  message: "Please complete all required supervisor fields",
  path: ["supervisorFirstName"]
})

type PlacementRequestData = z.infer<typeof placementRequestSchema>

interface Supervisor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  supervisorProfile: {
    title: string | null
  }
}

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


interface PlacementRequestModalProps {
  site: Site | null // null indicates new site submission
  onClose: () => void
}

export function PlacementRequestModal({ site, onClose }: PlacementRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { data: session } = useSession()

  // Check if student has faculty assignment
  const { data: facultyAssignmentData, isLoading: checkingFaculty } = useQuery({
    queryKey: ['student-faculty-assignment', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null
      const response = await fetch(`/api/students/${session.user.id}/faculty-assignment`)
      if (!response.ok) throw new Error('Failed to check faculty assignment')
      return response.json()
    },
    enabled: !!session?.user?.id
  })


  // Fetch classes for dropdown
  const { data: classes = [] } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await fetch('/api/classes')
      if (!response.ok) throw new Error('Failed to fetch classes')
      return response.json()
    }
  })

  // Fetch supervisors for existing site
  const { data: supervisors = [], isLoading: loadingSupervisors } = useQuery<Supervisor[]>({
    queryKey: ['supervisors', site?.id],
    queryFn: async () => {
      if (!site?.id) return []
      const response = await fetch(`/api/sites/${site.id}/supervisors`)
      if (!response.ok) throw new Error('Failed to fetch supervisors')
      return response.json()
    },
    enabled: !!site?.id
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<PlacementRequestData>({
    resolver: zodResolver(placementRequestSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      classId: '',
      supervisorOption: 'existing',
    },
  })

  const createPlacementMutation = useMutation({
    mutationFn: async (data: PlacementRequestData) => {
      if (site) {
        // Existing site - create placement request
        const payload: any = {
          siteId: site.id,
          startDate: data.startDate,
          endDate: data.endDate,
          classId: data.classId,
          requiredHours: requiredHours,
          supervisorOption: data.supervisorOption,
        }

        if (data.supervisorOption === 'existing') {
          payload.supervisorId = data.supervisorId
        } else {
          payload.supervisorFirstName = data.supervisorFirstName
          payload.supervisorLastName = data.supervisorLastName
          payload.supervisorEmail = data.supervisorEmail
          payload.supervisorPhone = data.supervisorPhone
          payload.supervisorTitle = data.supervisorTitle
          payload.supervisorLicensedSW = data.supervisorLicensedSW
          payload.supervisorLicenseNumber = data.supervisorLicenseNumber
          payload.supervisorHighestDegree = data.supervisorHighestDegree
          payload.supervisorOtherDegree = data.supervisorOtherDegree
        }

        const response = await fetch('/api/placements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to create placement request')
        }
        return response.json()
      } else {
        // New site submission
        const response = await fetch('/api/sites/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            siteData: {
              name: data.siteName,
              address: data.siteAddress,
              city: data.siteCity,
              state: data.siteState,
              zip: data.siteZip,
              contactName: data.siteContactName,
              contactEmail: data.siteContactEmail,
              contactPhone: data.siteContactPhone,
              practiceAreas: data.sitePracticeAreas,
            },
            placementData: {
              startDate: data.startDate,
              endDate: data.endDate,
              classId: data.classId,
              requiredHours: requiredHours,
              supervisorOption: data.supervisorOption,
              supervisorId: data.supervisorId,
              supervisorFirstName: data.supervisorFirstName,
              supervisorLastName: data.supervisorLastName,
              supervisorEmail: data.supervisorEmail,
              supervisorPhone: data.supervisorPhone,
              supervisorTitle: data.supervisorTitle,
            }
          }),
        })
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to submit site for approval')
        }
        return response.json()
      }
    },
    onSuccess: (data) => {
      console.log('Placement request success data:', data)
      queryClient.invalidateQueries({ queryKey: ['placements'] })
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      // Redirect to pending application page
      // For site submissions, the placement ID is in data.placement.id
      // For regular placement requests, it&apos;s in data.id
      const placementId = data.placement?.id || data.id
      console.log('Extracted placement ID:', placementId)
      if (!placementId) {
        console.error('No placement ID found in response:', data)
        return
      }
      window.location.href = `/placements/pending/${placementId}`
    },
  })

  const onSubmit = async (data: PlacementRequestData) => {
    setIsSubmitting(true)
    setError(null) // Clear any previous errors
    try {
      await createPlacementMutation.mutateAsync(data)
    } catch (error: any) {
      console.error('Placement request error:', error)
      setError(error.message || 'An error occurred while submitting your placement request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const selectedClassId = watch('classId')
  const supervisorOption = watch('supervisorOption')

  // Calculate required hours based on class selection
  const getRequiredHours = (classId: string) => {
    const selectedClass = classes.find((c: any) => c.id === classId)
    return selectedClass ? selectedClass.hours : 0
  }

  const requiredHours = getRequiredHours(selectedClassId)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {site ? `Request Placement at ${site.name}` : 'Submit New Agency for Approval'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Unable to Submit Placement Request</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Site Information */}
          {site ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Site Information</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Address:</strong> {site.address}, {site.city}, {site.state} {site.zip}</p>
                <p><strong>Contact:</strong> {site.contactName}</p>
                <p><strong>Email:</strong> {site.contactEmail}</p>
                <p><strong>Phone:</strong> {site.contactPhone}</p>
                <p><strong>Practice Areas:</strong> {site.practiceAreas}</p>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">New Agency Information</h3>
              <p className="text-sm text-gray-600 mb-4">
                Complete the following information about your selected field agency. Please note that the field instructor is the same as your field supervisor. Your supervisor serves as a field instructor.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Agency Name *</label>
                  <input
                    {...register('siteName')}
                    type="text"
                    className="form-input"
                    placeholder="Agency name"
                  />
                  {errors.siteName && <p className="text-red-500 text-sm mt-1">{errors.siteName.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">Contact Person *</label>
                  <input
                    {...register('siteContactName')}
                    type="text"
                    className="form-input"
                    placeholder="Full name"
                  />
                  {errors.siteContactName && <p className="text-red-500 text-sm mt-1">{errors.siteContactName.message}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Address *</label>
                  <input
                    {...register('siteAddress')}
                    type="text"
                    className="form-input"
                    placeholder="Street address"
                  />
                  {errors.siteAddress && <p className="text-red-500 text-sm mt-1">{errors.siteAddress.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">City *</label>
                  <input
                    {...register('siteCity')}
                    type="text"
                    className="form-input"
                    placeholder="City"
                  />
                  {errors.siteCity && <p className="text-red-500 text-sm mt-1">{errors.siteCity.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">State *</label>
                  <input
                    {...register('siteState')}
                    type="text"
                    className="form-input"
                    placeholder="State"
                  />
                  {errors.siteState && <p className="text-red-500 text-sm mt-1">{errors.siteState.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">ZIP Code *</label>
                  <input
                    {...register('siteZip')}
                    type="text"
                    className="form-input"
                    placeholder="ZIP code"
                  />
                  {errors.siteZip && <p className="text-red-500 text-sm mt-1">{errors.siteZip.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">Agency Email *</label>
                  <input
                    {...register('siteContactEmail')}
                    type="email"
                    className="form-input"
                    placeholder="contact@agency.com"
                  />
                  {errors.siteContactEmail && <p className="text-red-500 text-sm mt-1">{errors.siteContactEmail.message}</p>}
                </div>
                
                <div>
                  <label className="form-label">Agency Phone *</label>
                  <input
                    {...register('siteContactPhone')}
                    type="tel"
                    className="form-input"
                    placeholder="Phone number"
                  />
                  {errors.siteContactPhone && <p className="text-red-500 text-sm mt-1">{errors.siteContactPhone.message}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="form-label">Practice Areas *</label>
                  <input
                    {...register('sitePracticeAreas')}
                    type="text"
                    className="form-input"
                    placeholder="e.g., Mental Health, Healthcare, Child Welfare"
                  />
                  {errors.sitePracticeAreas && <p className="text-red-500 text-sm mt-1">{errors.sitePracticeAreas.message}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Faculty Assignment Check */}
          {checkingFaculty ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-gray-600">Checking faculty assignment...</span>
            </div>
          ) : !facultyAssignmentData?.hasFacultyAssignment ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Faculty Assignment Required
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      You must be assigned to a faculty member before you can request a placement.
                      Please contact your program administrator to get assigned to a faculty member.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Placement Request Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="form-label">
                  Start Date *
                </label>
                <input
                  {...register('startDate')}
                  type="date"
                  className="form-input"
                />
                {errors.startDate && (
                  <p className="form-error">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="form-label">
                  End Date *
                </label>
                <input
                  {...register('endDate')}
                  type="date"
                  className="form-input"
                />
                {errors.endDate && (
                  <p className="form-error">{errors.endDate.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">
                  Required Hours
                </label>
                <div className="form-input bg-gray-50 text-gray-700 font-medium">
                  {requiredHours} hours
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Hours are determined by the selected class
                </p>
              </div>
              
              <div>
                <label htmlFor="classId" className="form-label">
                  Class *
                </label>
                <select
                  {...register('classId')}
                  className="form-select"
                >
                  <option value="">Select a class</option>
                  {classes.map((classItem: any) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
                {errors.classId && (
                  <p className="form-error">{errors.classId.message}</p>
                )}
              </div>
            </div>

            {/* Supervisor Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Field Supervisor Information</h3>
              <p className="text-sm text-gray-600">
                {site 
                  ? "Select an existing supervisor or add a new one for this agency."
                  : "Since this is a new agency, please provide information about the field supervisor who will oversee your placement."
                }
              </p>
              
              {site && (
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Supervisor Option *</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          {...register('supervisorOption')}
                          type="radio"
                          value="existing"
                          className="mr-2"
                        />
                        <span className="text-sm">Select existing supervisor</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          {...register('supervisorOption')}
                          type="radio"
                          value="new"
                          className="mr-2"
                        />
                        <span className="text-sm">Create new supervisor</span>
                      </label>
                    </div>
                    {errors.supervisorOption && (
                      <p className="form-error">{errors.supervisorOption.message}</p>
                    )}
                  </div>

                  {supervisorOption === 'existing' && (
                    <div>
                      <label htmlFor="supervisorId" className="form-label">Select Supervisor *</label>
                      <select
                        {...register('supervisorId')}
                        className="form-select"
                        disabled={loadingSupervisors}
                      >
                        <option value="">Select a supervisor</option>
                        {supervisors.map((supervisor) => (
                          <option key={supervisor.id} value={supervisor.id}>
                            {supervisor.firstName} {supervisor.lastName} ({supervisor.email})
                            {supervisor.supervisorProfile?.title && ` - ${supervisor.supervisorProfile.title}`}
                          </option>
                        ))}
                      </select>
                      {errors.supervisorId && (
                        <p className="form-error">{errors.supervisorId.message}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(supervisorOption === 'new' || !site) && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="supervisorFirstName" className="form-label">
                          First Name *
                        </label>
                        <input
                          {...register('supervisorFirstName')}
                          type="text"
                          className="form-input"
                          required
                        />
                        {errors.supervisorFirstName && (
                          <p className="form-error">{errors.supervisorFirstName.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="supervisorLastName" className="form-label">
                          Last Name *
                        </label>
                        <input
                          {...register('supervisorLastName')}
                          type="text"
                          className="form-input"
                          required
                        />
                        {errors.supervisorLastName && (
                          <p className="form-error">{errors.supervisorLastName.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="supervisorEmail" className="form-label">
                          Email *
                        </label>
                        <input
                          {...register('supervisorEmail')}
                          type="email"
                          className="form-input"
                          required
                        />
                        {errors.supervisorEmail && (
                          <p className="form-error">{errors.supervisorEmail.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="supervisorPhone" className="form-label">
                          Phone
                        </label>
                        <input
                          {...register('supervisorPhone')}
                          type="tel"
                          className="form-input"
                        />
                        {errors.supervisorPhone && (
                          <p className="form-error">{errors.supervisorPhone.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="supervisorTitle" className="form-label">
                        Title/Position
                      </label>
                      <input
                        {...register('supervisorTitle')}
                        type="text"
                        className="form-input"
                        placeholder="e.g., Clinical Director, Program Manager"
                      />
                      {errors.supervisorTitle && (
                        <p className="form-error">{errors.supervisorTitle.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="supervisorLicensedSW" className="form-label">
                          Licensed SW? *
                        </label>
                        <select
                          {...register('supervisorLicensedSW')}
                          className="form-select"
                          required
                        >
                          <option value="">Select...</option>
                          <option value="NO">No</option>
                          <option value="YES">Yes</option>
                        </select>
                        {errors.supervisorLicensedSW && (
                          <p className="form-error">{errors.supervisorLicensedSW.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="supervisorHighestDegree" className="form-label">
                          Highest Degree? *
                        </label>
                        <select
                          {...register('supervisorHighestDegree')}
                          className="form-select"
                          required
                        >
                          <option value="">Select...</option>
                          <option value="BSW">BSW</option>
                          <option value="MSW">MSW</option>
                          <option value="OTHER">Other</option>
                        </select>
                        {errors.supervisorHighestDegree && (
                          <p className="form-error">{errors.supervisorHighestDegree.message}</p>
                        )}
                      </div>
                    </div>

                    {watch('supervisorLicensedSW') === 'YES' && (
                      <div>
                        <label htmlFor="supervisorLicenseNumber" className="form-label">
                          License Number *
                        </label>
                        <input
                          {...register('supervisorLicenseNumber')}
                          type="text"
                          className="form-input"
                          placeholder="Enter license number"
                          required={watch('supervisorLicensedSW') === 'YES'}
                        />
                        {errors.supervisorLicenseNumber && (
                          <p className="form-error">{errors.supervisorLicenseNumber.message}</p>
                        )}
                      </div>
                    )}

                    {watch('supervisorHighestDegree') === 'OTHER' && (
                      <div>
                        <label htmlFor="supervisorOtherDegree" className="form-label">
                          Degree *
                        </label>
                        <input
                          {...register('supervisorOtherDegree')}
                          type="text"
                          className="form-input"
                          placeholder="Enter degree name"
                          required={watch('supervisorHighestDegree') === 'OTHER'}
                        />
                        {errors.supervisorOtherDegree && (
                          <p className="form-error">{errors.supervisorOtherDegree.message}</p>
                        )}
                      </div>
                    )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Note:</strong> New Supervisor requests require account approval by faculty. 
                      The supervisor will be associated with this placement, but cannot approve hours until account approval.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {createPlacementMutation.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">
                  {createPlacementMutation.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
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
                className="btn-primary flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Initiating...
                  </>
                ) : (
                  'Initiate Request'
                )}
              </button>
            </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
