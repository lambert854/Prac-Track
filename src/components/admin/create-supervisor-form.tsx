'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const createSupervisorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  siteId: z.string().min(1, 'Site is required'),
  title: z.string().optional(),
})

type CreateSupervisorFormInputs = z.infer<typeof createSupervisorSchema>

interface CreateSupervisorFormProps {
  onClose: () => void
}

export function CreateSupervisorForm({ onClose }: CreateSupervisorFormProps) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateSupervisorFormInputs>({
    resolver: zodResolver(createSupervisorSchema),
  })

  // Fetch sites for selection
  const { data: sites } = useQuery({
    queryKey: ['sites'],
    queryFn: async () => {
      const response = await fetch('/api/sites')
      if (!response.ok) throw new Error('Failed to fetch sites')
      return response.json()
    },
  })

  const createSupervisorMutation = useMutation({
    mutationFn: async (data: CreateSupervisorFormInputs) => {
      const response = await fetch('/api/admin/supervisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create supervisor')
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

  const onSubmit = (data: CreateSupervisorFormInputs) => {
    createSupervisorMutation.mutate(data)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Create New Supervisor</h3>
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
            <label htmlFor="password" className="form-label">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="form-input"
            />
            {errors.password && <p className="form-error">{errors.password.message}</p>}
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
            <label htmlFor="siteId" className="form-label">
              Site <span className="text-red-500">*</span>
            </label>
            <select
              id="siteId"
              {...register('siteId')}
              className="form-select"
            >
              <option value="">Select a site</option>
              {sites?.map((site: any) => (
                <option key={site.id} value={site.id}>
                  {site.name}
                </option>
              ))}
            </select>
            {errors.siteId && <p className="form-error">{errors.siteId.message}</p>}
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

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={createSupervisorMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createSupervisorMutation.isPending}
            >
              {createSupervisorMutation.isPending ? 'Creating...' : 'Create Supervisor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
