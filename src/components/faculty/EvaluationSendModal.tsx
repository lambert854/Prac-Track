'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/providers/toast-provider'

interface EvaluationSendModalProps {
  type: 'MIDTERM' | 'FINAL'
  isOpen: boolean
  onClose: () => void
}

export function EvaluationSendModal({ type, isOpen, onClose }: EvaluationSendModalProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [studentMsg, setStudentMsg] = useState('')
  const [supervisorMsg, setSupervisorMsg] = useState('')

  const sendMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/evaluations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          studentMsg: studentMsg.trim() || undefined,
          supervisorMsg: supervisorMsg.trim() || undefined,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send evaluations')
      }
      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['faculty-placements'] })
      queryClient.invalidateQueries({ queryKey: ['faculty-students'] })
      
      // Show success toast
      const reusedText = data.reused.students > 0 || data.reused.supervisors > 0 
        ? ` Reused ${data.reused.students} student and ${data.reused.supervisors} supervisor evaluations that were already in progress.`
        : ''
      
      toast({
        title: 'Evaluations Sent Successfully!',
        description: `Sent to ${data.created.students} students and ${data.created.supervisors} supervisors.${reusedText}`,
        type: 'success',
        duration: 6000
      })
      
      // Reset form and close
      setStudentMsg('')
      setSupervisorMsg('')
      onClose()
    },
    onError: (error) => {
      console.error('Failed to send evaluations:', error)
      toast({
        title: 'Failed to Send Evaluations',
        description: error.message || 'An error occurred while sending evaluations.',
        type: 'error',
        duration: 6000
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMutation.mutate()
  }

  if (!isOpen) return null

  const typeName = type === 'MIDTERM' ? 'Mid-Term' : 'Final'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Send {typeName} Evaluations
          </h2>
          <button
            onClick={onClose}
            disabled={sendMutation.isPending}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Description */}
        <p className="text-gray-600 mb-6">
          This will send {typeName.toLowerCase()} evaluations to all students and supervisors in your active placements. 
          You can include optional messages that will be shown to recipients.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Message */}
          <div>
            <label htmlFor="studentMsg" className="block text-sm font-medium text-gray-700 mb-2">
              Message to Students (optional)
            </label>
            <textarea
              id="studentMsg"
              value={studentMsg}
              onChange={(e) => setStudentMsg(e.target.value)}
              disabled={sendMutation.isPending}
              rows={4}
              maxLength={500}
              placeholder="Enter a message that will be displayed to students when they open their self-evaluation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {studentMsg.length} / 500 characters
            </p>
          </div>

          {/* Supervisor Message */}
          <div>
            <label htmlFor="supervisorMsg" className="block text-sm font-medium text-gray-700 mb-2">
              Message to Supervisors (optional)
            </label>
            <textarea
              id="supervisorMsg"
              value={supervisorMsg}
              onChange={(e) => setSupervisorMsg(e.target.value)}
              disabled={sendMutation.isPending}
              rows={4}
              maxLength={500}
              placeholder="Enter a message that will be displayed to supervisors when they open their evaluation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {supervisorMsg.length} / 500 characters
            </p>
          </div>

          {/* Error Display */}
          {sendMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                {(sendMutation.error as Error).message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={sendMutation.isPending}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sendMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {sendMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                  Send Evaluations
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
