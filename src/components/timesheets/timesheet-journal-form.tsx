'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const journalFormSchema = z.object({
  tasksSummary: z.string().min(1, 'Tasks summary is required'),
  highLowPoints: z.string().optional(),
  competencies: z.array(z.string()).min(1, 'At least one competency must be selected'),
  practiceBehaviors: z.array(z.string()).min(1, 'At least one practice behavior must be selected'),
  reaction: z.string().refine((val) => {
    const wordCount = val.trim().split(/\s+/).filter(word => word.length > 0).length
    return wordCount >= 150
  }, {
    message: 'Reaction must be at least 150 words'
  }),
  otherComments: z.string().optional(),
})

type JournalFormData = z.infer<typeof journalFormSchema>

interface TimesheetJournalFormProps {
  studentName: string
  onSubmit: (data: JournalFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

const competencies = [
  { id: '2.1.1', label: '2.1.1 Demonstrate ethical and professional behavior' },
  { id: '2.1.2', label: '2.1.2 Advance Human Rights and Social, Racial, Economic, and Environmental Justice' },
  { id: '2.1.3', label: '2.1.3 Engage Anti-Racism, Diversity, Equity, and Inclusion (ADEI) in Practice' },
  { id: '2.1.4', label: '2.1.4 Engage in practice-informed research and research-informed practice' },
  { id: '2.1.5', label: '2.1.5 Engage in policy practice' },
  { id: '2.1.6', label: '2.1.6 Engage with individuals, families, groups, organizations, and communities' },
  { id: '2.1.7', label: '2.1.7 Assess individuals, families, groups, organizations, and communities' },
  { id: '2.1.8', label: '2.1.8 Intervene with individuals, families, groups, organizations, and communities' },
  { id: '2.1.9', label: '2.1.9 Evaluate practices with individuals, families, groups, organizations, and communities' },
]

const practiceBehaviors = [
  { id: 'pb1', label: 'Make ethical decisions by applying the standards of the NASW Code of Ethics, relevant laws and regulations, models for ethical decision-making, ethical conduct of research, and additional codes of ethics as appropriate to the context.' },
  { id: 'pb2', label: 'Demonstrate professional demeanor in behavior, appearance, and oral, written, and electronic communication' },
  { id: 'pb3', label: 'Use technology ethically and appropriately to facilitate practice outcomes' },
  { id: 'pb4', label: 'Use supervision and consultation to guide professional judgement and behavior' },
  { id: 'pb5', label: 'Advocate for human rights at the individual, family, group, organizational, and community system levels' },
  { id: 'pb6', label: 'Engage in practices that advance human rights to promote social, racial, economic, and environmental justice' },
  { id: 'pb7', label: 'Demonstrate anti-racist and anti-oppressive social work practice at the individual, family, group, organizational, community, research, and policy levels' },
  { id: 'pb8', label: 'Demonstrate cultural humility by applying critical reflection, self-awareness, and self-regulation to manage the influence of bias, power, privilege, and values in working with clients and constituencies, acknowledging them as experts of their own lived experiences' },
  { id: 'pb9', label: 'Apply research findings to inform and improve practice, policy, and programs' },
  { id: 'pb10', label: 'Identify ethical culturally informed, anti-racist, and anti-oppressive strategies that address inherent biases for use in quantitative and qualitative research methods to advance the purposes of social work' },
  { id: 'pb11', label: 'Use social justice, anti-racist, and anti-oppressive lenses to assess how social welfare policies affect the delivery of an access to social services' },
  { id: 'pb12', label: 'Apply critical thinking to analyze, formulate, and advocate for policies that advance human rights and social, economic, and environmental justice' },
  { id: 'pb13', label: 'Apply knowledge of human behavior and person-in-environment, as well as interprofessional conceptual frameworks, to engage with clients and constituencies' },
  { id: 'pb14', label: 'Use empathy, reflection, and interpersonal skills to engage in culturally responsive practice with clients and constituencies' },
  { id: 'pb15', label: 'Apply theories of human behavior and person-in-environment, as well as other culturally responsive and interprofessional conceptual frameworks, when assessing clients and constituencies' },
  { id: 'pb16', label: 'Demonstrate respect for client self-determination during the assessment process by collaborating with clients and constituencies in developing a mutually agreed-upon plan' },
  { id: 'pb17', label: 'Engage with clients and constituencies to critically choose and implement culturally responsive, evidence-informed interventions to achieve client and constituency goals' },
  { id: 'pb18', label: 'Incorporate culturally responsive methods to negotiate, mediate, and advocate with and on behalf of clients and constituencies' },
  { id: 'pb19', label: 'Select and use culturally responsive methods for evaluation of outcomes' },
  { id: 'pb20', label: 'Critically analyze outcomes and apply evaluation findings to improve practice effectiveness with individuals, families, groups, organizations, and communities' },
]

export function TimesheetJournalForm({ studentName, onSubmit, onCancel, isSubmitting }: TimesheetJournalFormProps) {
  const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>([])
  const [selectedPracticeBehaviors, setSelectedPracticeBehaviors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<JournalFormData>({
    resolver: zodResolver(journalFormSchema),
    defaultValues: {
      competencies: [],
      practiceBehaviors: [],
    },
  })

  const reactionText = watch('reaction', '')
  const wordCount = reactionText.trim().split(/\s+/).filter(word => word.length > 0).length

  // Sync form values with state
  useEffect(() => {
    setValue('competencies', selectedCompetencies)
  }, [selectedCompetencies, setValue])

  useEffect(() => {
    setValue('practiceBehaviors', selectedPracticeBehaviors)
  }, [selectedPracticeBehaviors, setValue])

  const handleCompetencyChange = (competencyId: string, checked: boolean) => {
    let newCompetencies
    if (checked) {
      newCompetencies = [...selectedCompetencies, competencyId]
    } else {
      newCompetencies = selectedCompetencies.filter(id => id !== competencyId)
    }
    setSelectedCompetencies(newCompetencies)
    setValue('competencies', newCompetencies)
  }

  const handlePracticeBehaviorChange = (behaviorId: string, checked: boolean) => {
    let newBehaviors
    if (checked) {
      newBehaviors = [...selectedPracticeBehaviors, behaviorId]
    } else {
      newBehaviors = selectedPracticeBehaviors.filter(id => id !== behaviorId)
    }
    setSelectedPracticeBehaviors(newBehaviors)
    setValue('practiceBehaviors', newBehaviors)
  }

  const onFormSubmit = (data: JournalFormData) => {
    onSubmit(data)
  }

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Weekly Journal</h3>
        <p className="text-sm text-gray-600 mb-4">
          Please complete the journal. Briefly describe the high and low points of your experience for the week. 
          Identify what you need to talk about further and with whom. Journals should identify reactions to practicum 
          experience and raise questions and issues. The journals are a way for students to reflect on their experience 
          and discuss their reactions, feelings, and the meaning of the experience. It should include a compilation of 
          the "thinking, feeling, and doing" generated by the field experience. The student is to explain how classroom 
          learning is applied in the field experience.
        </p>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Tasks Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Summarize your tasks and activities for the week *
          </label>
          <textarea
            {...register('tasksSummary')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Describe the tasks and activities you completed during this week..."
          />
          {errors.tasksSummary && (
            <p className="mt-1 text-sm text-red-600">{errors.tasksSummary.message}</p>
          )}
        </div>

        {/* High/Low Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Summarize any high or low points of the week
          </label>
          <textarea
            {...register('highLowPoints')}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Describe any significant high or low points from your week..."
          />
        </div>

        {/* Competencies */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            The social work program utilizes the nine performance-based competencies and practice behaviors as specified by the Council on Social Work Education (CSWE) accreditation standards. Please check off which competencies you used during your field practicum this week. *
          </label>
          <div className="space-y-2">
            {competencies.map((competency) => (
              <label key={competency.id} className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedCompetencies.includes(competency.id)}
                  onChange={(e) => handleCompetencyChange(competency.id, e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">{competency.label}</span>
              </label>
            ))}
          </div>
          {errors.competencies && (
            <p className="mt-1 text-sm text-red-600">{errors.competencies.message}</p>
          )}
        </div>

        {/* Practice Behaviors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            The social work program utilizes 20 practice behaviors to reflect the above competencies. Please identify the practice behaviors you engaged in during this week. *
          </label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {practiceBehaviors.map((behavior) => (
              <label key={behavior.id} className="flex items-start">
                <input
                  type="checkbox"
                  checked={selectedPracticeBehaviors.includes(behavior.id)}
                  onChange={(e) => handlePracticeBehaviorChange(behavior.id, e.target.checked)}
                  className="mt-1 mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded flex-shrink-0"
                />
                <span className="text-sm text-gray-700">{behavior.label}</span>
              </label>
            ))}
          </div>
          {errors.practiceBehaviors && (
            <p className="mt-1 text-sm text-red-600">{errors.practiceBehaviors.message}</p>
          )}
        </div>

        {/* Reaction */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reaction: Please indicate how you felt about this week&apos;s activities/experiences/practice behaviors. This should be a MINIMUM of 150 words. *
          </label>
          <textarea
            {...register('reaction')}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Share your thoughts and feelings about this week&apos;s experiences..."
          />
          <div className="mt-1 flex justify-between">
            <div className="text-sm text-gray-500">
              Word count: {wordCount} / 150 minimum
            </div>
            {wordCount < 150 && (
              <div className="text-sm text-red-600">
                {150 - wordCount} more words required
              </div>
            )}
          </div>
          {errors.reaction && (
            <p className="mt-1 text-sm text-red-600">{errors.reaction.message}</p>
          )}
        </div>

        {/* Other Comments */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Any other comments?
          </label>
          <textarea
            {...register('otherComments')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Any additional thoughts or comments..."
          />
        </div>

        {/* Certification */}
        <div className="border-t pt-4">
          <p className="text-sm text-gray-700 mb-4">
            I, <strong>{studentName}</strong>, certify that I have reviewed my time entries for this period and that they are accurate to the best of my knowledge.
          </p>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Week'}
          </button>
        </div>
      </form>
    </div>
  )
}
