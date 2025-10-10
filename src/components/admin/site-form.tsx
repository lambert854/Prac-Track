'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

const siteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip: z.string().min(1, 'ZIP code is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid email is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  practiceAreas: z.string().min(1, 'Practice areas are required'),
  // Practicum Placement Agreement fields - all optional, handle empty strings
  agreementStartMonth: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : Number(val),
    z.number().min(1).max(12).optional()
  ),
  agreementStartYear: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : Number(val),
    z.number().min(2020).max(2030).optional()
  ),
  staffHasActiveLicense: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : val,
    z.enum(['YES', 'NO']).optional()
  ),
  supervisorTraining: z.preprocess(
    (val) => val === '' || val === undefined ? undefined : val,
    z.enum(['YES', 'NO']).optional()
  ),
})

type SiteFormData = {
  name: string
  address: string
  city: string
  state: string
  zip: string
  contactName: string
  contactEmail: string
  contactPhone: string
  practiceAreas: string
  agreementStartMonth?: number
  agreementStartYear?: number
  staffHasActiveLicense?: 'YES' | 'NO'
  supervisorTraining?: 'YES' | 'NO'
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
  // Practicum Placement Agreement fields
  agreementStartMonth?: number | null
  agreementStartYear?: number | null
  agreementExpirationDate?: string | null
  staffHasActiveLicense?: string | null
  supervisorTraining?: string | null
}

interface SiteFormProps {
  site?: Site | null
  onClose: () => void
}

export function SiteForm({ site, onClose }: SiteFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const queryClient = useQueryClient()

  // Calculate expiration date (3 years from start date)
  const calculateExpirationDate = (month: number | undefined, year: number | undefined) => {
    if (!month || !year || isNaN(month) || isNaN(year)) return null
    const startDate = new Date(year, month - 1, 1) // month is 0-indexed
    if (isNaN(startDate.getTime())) return null
    const expirationDate = new Date(startDate)
    expirationDate.setFullYear(startDate.getFullYear() + 3)
    return isNaN(expirationDate.getTime()) ? null : expirationDate
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SiteFormData>({
    resolver: zodResolver(siteSchema),
    defaultValues: site ? {
      name: site.name,
      address: site.address,
      city: site.city,
      state: site.state,
      zip: site.zip,
      contactName: site.contactName,
      contactEmail: site.contactEmail,
      contactPhone: site.contactPhone,
      practiceAreas: site.practiceAreas,
      agreementStartMonth: site.agreementStartMonth || undefined,
      agreementStartYear: site.agreementStartYear || undefined,
      staffHasActiveLicense: (site.staffHasActiveLicense === 'YES' || site.staffHasActiveLicense === 'NO') ? site.staffHasActiveLicense : undefined,
      supervisorTraining: (site.supervisorTraining === 'YES' || site.supervisorTraining === 'NO') ? site.supervisorTraining : undefined,
    } : {
      name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      practiceAreas: '',
      agreementStartMonth: undefined,
      agreementStartYear: undefined,
      staffHasActiveLicense: undefined,
      supervisorTraining: undefined,
    },
  })

  // Watch for changes in start month/year to calculate expiration date
  const startMonth = watch('agreementStartMonth')
  const startYear = watch('agreementStartYear')

  const createSiteMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create site')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      onClose()
    },
  })

  const updateSiteMutation = useMutation({
    mutationFn: async (data: SiteFormData) => {
      const response = await fetch(`/api/sites/${site!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update site error:', response.status, errorText)
        throw new Error(`Failed to update site: ${response.status} - ${errorText}`)
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sites'] })
      queryClient.invalidateQueries({ queryKey: ['site', site!.id] })
      onClose()
    },
  })

  const onSubmit = async (data: SiteFormData) => {
    setIsSubmitting(true)
    try {
      // Calculate expiration date if start date is provided
      const expirationDate = calculateExpirationDate(data.agreementStartMonth, data.agreementStartYear)
      
      // Clean up the data - remove undefined values and convert empty strings to null
      const submitData = {
        ...data,
        agreementExpirationDate: expirationDate?.toISOString() || null,
        agreementStartMonth: data.agreementStartMonth || null,
        agreementStartYear: data.agreementStartYear || null,
        staffHasActiveLicense: data.staffHasActiveLicense || null,
        supervisorTraining: data.supervisorTraining || null,
      }

      console.log('Submitting site data:', submitData)

      if (site) {
        await updateSiteMutation.mutateAsync(submitData)
      } else {
        await createSiteMutation.mutateAsync(submitData)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {site ? 'Edit Field Placement Site' : 'Add New Field Placement Site'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="name" className="form-label">
                Site Name *
              </label>
              <input
                {...register('name')}
                type="text"
                className="form-input"
                placeholder="Enter site name"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="form-label">
                Address *
              </label>
              <input
                {...register('address')}
                type="text"
                className="form-input"
                placeholder="Enter street address"
              />
              {errors.address && (
                <p className="form-error">{errors.address.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="city" className="form-label">
                City *
              </label>
              <input
                {...register('city')}
                type="text"
                className="form-input"
                placeholder="Enter city"
              />
              {errors.city && (
                <p className="form-error">{errors.city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="form-label">
                State *
              </label>
              <input
                {...register('state')}
                type="text"
                className="form-input"
                placeholder="Enter state"
              />
              {errors.state && (
                <p className="form-error">{errors.state.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="zip" className="form-label">
                ZIP Code *
              </label>
              <input
                {...register('zip')}
                type="text"
                className="form-input"
                placeholder="Enter ZIP code"
              />
              {errors.zip && (
                <p className="form-error">{errors.zip.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactName" className="form-label">
                Site Contact Name *
              </label>
              <input
                {...register('contactName')}
                type="text"
                className="form-input"
                placeholder="Enter contact name"
              />
              {errors.contactName && (
                <p className="form-error">{errors.contactName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactEmail" className="form-label">
                Site Contact Email *
              </label>
              <input
                {...register('contactEmail')}
                type="email"
                className="form-input"
                placeholder="Enter contact email"
              />
              {errors.contactEmail && (
                <p className="form-error">{errors.contactEmail.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="contactPhone" className="form-label">
                Site Contact Phone *
              </label>
              <input
                {...register('contactPhone')}
                type="tel"
                className="form-input"
                placeholder="Enter contact phone"
              />
              {errors.contactPhone && (
                <p className="form-error">{errors.contactPhone.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="practiceAreas" className="form-label">
                Practice Areas *
              </label>
              <textarea
                {...register('practiceAreas')}
                rows={3}
                className="form-input"
                placeholder="Enter practice areas (comma-separated)"
              />
              {errors.practiceAreas && (
                <p className="form-error">{errors.practiceAreas.message}</p>
              )}
            </div>
          </div>

          {/* Practicum Placement Agreement Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Practicum Placement Agreement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="agreementStartMonth" className="form-label">
                  Start Month
                </label>
                <select
                  {...register('agreementStartMonth')}
                  className="form-input"
                >
                  <option value="">Select month</option>
                  <option value={1}>January</option>
                  <option value={2}>February</option>
                  <option value={3}>March</option>
                  <option value={4}>April</option>
                  <option value={5}>May</option>
                  <option value={6}>June</option>
                  <option value={7}>July</option>
                  <option value={8}>August</option>
                  <option value={9}>September</option>
                  <option value={10}>October</option>
                  <option value={11}>November</option>
                  <option value={12}>December</option>
                </select>
                {errors.agreementStartMonth && (
                  <p className="form-error">{errors.agreementStartMonth.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="agreementStartYear" className="form-label">
                  Start Year
                </label>
                <select
                  {...register('agreementStartYear')}
                  className="form-input"
                >
                  <option value="">Select year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - 6 + i
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    )
                  })}
                </select>
                {errors.agreementStartYear && (
                  <p className="form-error">{errors.agreementStartYear.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="staffHasActiveLicense" className="form-label">
                  Staff with Active SW License
                </label>
                <select
                  {...register('staffHasActiveLicense')}
                  className="form-input"
                >
                  <option value="">Select option</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
                {errors.staffHasActiveLicense && (
                  <p className="form-error">{errors.staffHasActiveLicense.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="supervisorTraining" className="form-label">
                  Field Supervisor Training
                </label>
                <select
                  {...register('supervisorTraining')}
                  className="form-input"
                >
                  <option value="">Select option</option>
                  <option value="YES">Yes</option>
                  <option value="NO">No</option>
                </select>
                {errors.supervisorTraining && (
                  <p className="form-error">{errors.supervisorTraining.message}</p>
                )}
              </div>
            </div>
            
            {/* Agreement Expiration - only show when BOTH month AND year are valid numbers */}
            {(() => {
              // Check if both values are valid numbers (not default text)
              const monthNum = parseInt(startMonth?.toString() || '');
              const yearNum = parseInt(startYear?.toString() || '');
              
              // Only show if both are valid numbers and not NaN
              if (isNaN(monthNum) || isNaN(yearNum) || 
                  monthNum < 1 || monthNum > 12 || 
                  yearNum < 1900 || yearNum > 2100) {
                return null;
              }
              
              try {
                const startDate = new Date(yearNum, monthNum - 1, 1);
                const expirationDate = new Date(startDate);
                expirationDate.setFullYear(startDate.getFullYear() + 3);
                
                return (
                  <div className="mt-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        <strong>Agreement Expiration:</strong> {expirationDate.toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                  </div>
                );
              } catch (error) {
                return null;
              }
            })()}
          </div>

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
                  {site ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                site ? 'Update Field Site' : 'Create Field Site'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
