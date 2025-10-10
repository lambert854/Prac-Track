'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface JournalViewerProps {
  placementId: string
  startDate: string
  endDate: string
  isOpen: boolean
  onClose: () => void
}

interface JournalEntry {
  id: string
  placementId: string
  startDate: string
  endDate: string
  tasksSummary: string
  highLowPoints?: string
  competencies: string // JSON array
  practiceBehaviors: string // JSON array
  reaction: string
  otherComments?: string
  submittedAt: string
}

export function JournalViewer({ placementId, startDate, endDate, isOpen, onClose }: JournalViewerProps) {
  const { data: journalEntry, isLoading } = useQuery({
    queryKey: ['journal-entry', placementId, startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/placements/${placementId}/timesheets/journal?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) throw new Error('Failed to fetch journal entry')
      return response.json()
    },
    enabled: isOpen && !!placementId && !!startDate && !!endDate,
  })

  if (!isOpen) return null

  const competencies = journalEntry?.competencies ? JSON.parse(journalEntry.competencies) : []
  const practiceBehaviors = journalEntry?.practiceBehaviors ? JSON.parse(journalEntry.practiceBehaviors) : []

  // Competency mappings
  const competencyMap: { [key: string]: string } = {
    "2.1.1": "2.1.1 Demonstrate ethical and professional behavior",
    "2.1.2": "2.1.2 Advance Human Rights and Social, Racial, Economic, and Environmental Justice",
    "2.1.3": "2.1.3 Engage Anti-Racism, Diversity, Equity, and Inclusion (ADEI) in Practice",
    "2.1.4": "2.1.4 Engage in practice-informed research and research-informed practice",
    "2.1.5": "2.1.5 Engage in policy practice",
    "2.1.6": "2.1.6 Engage with individuals, families, groups, organizations, and communities",
    "2.1.7": "2.1.7 Assess individuals, families, groups, organizations, and communities",
    "2.1.8": "2.1.8 Intervene with individuals, families, groups, organizations, and communities",
    "2.1.9": "2.1.9 Evaluate practices with individuals, families, groups, organizations, and communities"
  }

  // Practice behavior mappings
  const practiceBehaviorMap: { [key: string]: string } = {
    "pb1": "Make ethical decisions by applying the standards of the NASW Code of Ethics, relevant laws and regulations, models for ethical decision-making, ethical conduct of research, and additional codes of ethics as appropriate to the context.",
    "pb2": "Demonstrate professional demeanor in behavior, appearance, and oral, written, and electronic communication",
    "pb3": "Use technology ethically and appropriately to facilitate practice outcomes",
    "pb4": "Use supervision and consultation to guide professional judgement and behavior",
    "pb5": "Advocate for human rights at the individual, family, group, organizational, and community system levels",
    "pb6": "Engage in practices that advance human rights to promote social, racial, economic, and environmental justice",
    "pb7": "Demonstrate anti-racist and anti-oppressive social work practice at the individual, family, group, organizational, community, research, and policy levels",
    "pb8": "Demonstrate cultural humility by applying critical reflection, self-awareness, and self-regulation to manage the influence of bias, power, privilege, and values in working with clients and constituencies, acknowledging them as experts of their own lived experiences",
    "pb9": "Apply research findings to inform and improve practice, policy, and programs",
    "pb10": "Identify ethical culturally informed, anti-racist, and anti-oppressive strategies that address inherent biases for use in quantitative and qualitative research methods to advance the purposes of social work",
    "pb11": "Use social justice, anti-racist, and anti-oppressive lenses to assess how social welfare policies affect the delivery of an access to social services",
    "pb12": "Apply critical thinking to analyze, formulate, and advocate for policies that advance human rights and social, economic, and environmental justice",
    "pb13": "Apply knowledge of human behavior and person-in-environment, as well as interprofessional conceptual frameworks, to engage with clients and constituencies",
    "pb14": "Use empathy, reflection, and interpersonal skills to engage in culturally responsive practice with clients and constituencies",
    "pb15": "Apply theories of human behavior and person-in-environment, as well as other culturally responsive and interprofessional conceptual frameworks, when assessing clients and constituencies",
    "pb16": "Demonstrate respect for client self-determination during the assessment process by collaborating with clients and constituencies in developing a mutually agreed-upon plan",
    "pb17": "Engage with clients and constituencies to critically choose and implement culturally responsive, evidence-informed interventions to achieve client and constituency goals",
    "pb18": "Incorporate culturally responsive methods to negotiate, mediate, and advocate with and on behalf of clients and constituencies",
    "pb19": "Select and use culturally responsive methods for evaluation of outcomes",
    "pb20": "Critically analyze outcomes and apply evaluation findings to improve practice effectiveness with individuals, families, groups, organizations, and communities"
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00') // Force local timezone
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Weekly Journal Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : journalEntry ? (
            <div className="space-y-6">
              {/* Week Range */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Week of</h3>
                <p className="text-gray-700">
                  {formatDate(startDate)} - {formatDate(endDate)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Submitted on {formatDate(journalEntry.submittedAt)}
                </p>
              </div>

              {/* Tasks Summary */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Tasks and Activities Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{journalEntry.tasksSummary}</p>
                </div>
              </div>

              {/* High/Low Points */}
              {journalEntry.highLowPoints && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">High and Low Points</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{journalEntry.highLowPoints}</p>
                  </div>
                </div>
              )}

              {/* Competencies */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Competencies Used</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {competencies.map((competency: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">
                          {competencyMap[competency] || competency}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Practice Behaviors */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Practice Behaviors Engaged</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <ul className="space-y-2">
                    {practiceBehaviors.map((behavior: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span className="text-gray-700">
                          {practiceBehaviorMap[behavior] || behavior}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Reaction */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Reaction and Reflection</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{journalEntry.reaction}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Word count: {journalEntry.reaction.trim().split(/\s+/).filter(word => word.length > 0).length} words
                  </p>
                </div>
              </div>

              {/* Other Comments */}
              {journalEntry.otherComments && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Additional Comments</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{journalEntry.otherComments}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No journal entry found for this week</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
