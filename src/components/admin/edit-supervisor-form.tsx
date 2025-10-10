'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

interface Supervisor {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  supervisorProfile?: {
    id: string
    title?: string | null
    licensedSW?: string | null
    licenseNumber?: string | null
    highestDegree?: string | null
    otherDegree?: string | null
    site: {
      id: string
      name: string
      active: boolean
    }
  }
}

const editSupervisorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  licensedSW: z.enum(['YES', 'NO']).optional(),
  licenseNumber: z.string().optional(),
  highestDegree: z.enum(['BSW', 'MSW', 'OTHER']).optional(),
  otherDegree: z.string().optional(),
}).refine((data) => {
  // If licensedSW is YES, licenseNumber is required
  if (data.licensedSW === 'YES' && !data.licenseNumber) return false
  // If highestDegree is OTHER, otherDegree is required
  if (data.highestDegree === 'OTHER' && !data.otherDegree) return false
  return true
}, {
  message: "Please fill in all required fields",
  path: ["licensedSW"]
})

type EditSupervisorFormInputs = z.infer<typeof editSupervisorSchema>

interface EditSupervisorFormProps {
  supervisor: Supervisor
  onClose: () => void
}

export function EditSupervisorForm({ supervisor, onClose }: EditSupervisorFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<EditSupervisorFormInputs>({
    resolver: zodResolver(editSupervisorSchema),
    defaultValues: {
      firstName: supervisor.firstName,
      lastName: supervisor.lastName,
      email: supervisor.email,
      phone: supervisor.phone,
      title: supervisor.supervisorProfile?.title,
      password: '',
      licensedSW: supervisor.supervisorProfile?.licensedSW as 'YES' | 'NO' | undefined,
      licenseNumber: supervisor.supervisorProfile?.licenseNumber || '',
      highestDegree: supervisor.supervisorProfile?.highestDegree as 'BSW' | 'MSW' | 'OTHER' | undefined,
      otherDegree: supervisor.supervisorProfile?.otherDegree || '',
    },
  })

  const updateSupervisorMutation = useMutation({
    mutationFn: async (data: EditSupervisorFormInputs) => {
      const response = await fetch(`/api/admin/supervisors/${supervisor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update supervisor')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-supervisors'] })
      onClose()
      reset()
    },
    onError: (error) => {
      alert(error.message)
    },
  })

  const onSubmit = (data: EditSupervisorFormInputs) => {
    updateSupervisorMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Supervisor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="firstName" className="form-label">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              className="form-input"
            />
            {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
          </div>
          <div>
            <label htmlFor="lastName" className="form-label">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className="form-input"
            />
            {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
          </div>
          <div>
            <label htmlFor="email" className="form-label">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="form-input"
            />
            {errors.email && <p className="form-error">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="phone" className="form-label">
              Phone
            </label>
            <input
              id="phone"
              type="text"
              {...register('phone')}
              className="form-input"
            />
            {errors.phone && <p className="form-error">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="form-label">
              Site (Cannot be changed)
            </label>
            <input
              type="text"
              value={supervisor.supervisorProfile?.site.name || ''}
              className="form-input bg-gray-100 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              To change the site, delete this supervisor and create a new one from the site details page.
            </p>
          </div>
          <div>
            <label htmlFor="title" className="form-label">
              Title (e.g., Field Supervisor)
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className="form-input"
            />
            {errors.title && <p className="form-error">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="licensedSW" className="form-label">
                Licensed SW?
              </label>
              <select
                {...register('licensedSW')}
                className="form-select"
              >
                <option value="">Select...</option>
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
              {errors.licensedSW && <p className="form-error">{errors.licensedSW.message}</p>}
            </div>
            
            <div>
              <label htmlFor="highestDegree" className="form-label">
                Highest Degree?
              </label>
              <select
                {...register('highestDegree')}
                className="form-select"
              >
                <option value="">Select...</option>
                <option value="BSW">BSW</option>
                <option value="MSW">MSW</option>
                <option value="OTHER">Other</option>
              </select>
              {errors.highestDegree && <p className="form-error">{errors.highestDegree.message}</p>}
            </div>
          </div>

          {watch('licensedSW') === 'YES' && (
            <div>
              <label htmlFor="licenseNumber" className="form-label">
                License Number
              </label>
              <input
                {...register('licenseNumber')}
                type="text"
                className="form-input"
                placeholder="Enter license number"
                required={watch('licensedSW') === 'YES'}
              />
              {errors.licenseNumber && <p className="form-error">{errors.licenseNumber.message}</p>}
            </div>
          )}

          {watch('highestDegree') === 'OTHER' && (
            <div>
              <label htmlFor="otherDegree" className="form-label">
                Degree
              </label>
              <input
                {...register('otherDegree')}
                type="text"
                className="form-input"
                placeholder="Enter degree name"
                required={watch('highestDegree') === 'OTHER'}
              />
              {errors.otherDegree && <p className="form-error">{errors.otherDegree.message}</p>}
            </div>
          )}

          <div>
            <label htmlFor="password" className="form-label">
              New Password (leave blank to keep current)
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="form-input"
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={updateSupervisorMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateSupervisorMutation.isPending}
            >
              {updateSupervisorMutation.isPending ? 'Updating...' : 'Update Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
