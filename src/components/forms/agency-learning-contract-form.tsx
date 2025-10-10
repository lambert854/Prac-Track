'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AgencyLearningContract {
  id: string
  siteId: string
  token: string
  status: string
  agencyEmail: string
  agencyName: string
  agencyAddress: string
  agencyCity: string
  agencyState: string
  agencyZip: string
  agencyTelephone: string
  agencyDirector: string
  fieldInstructorName?: string
  fieldInstructorFirstName?: string
  fieldInstructorLastName?: string
  fieldInstructorDegree?: string
  fieldInstructorLicense?: string
  fieldInstructorLicenseType?: string
  fieldInstructorResume?: string
  resourcesAvailable?: string
  servicesProvided?: string
  learningPlan?: string
  learningOpportunities?: string
  supervisionArrangement?: string
  instructionMethods?: string
  orientationArrangements?: string
  specialRequirements?: string
  handicapAccommodations?: string
  handicapAccommodationsDetails?: string
  promotionalMaterials?: string
  comments?: string
  completedByName?: string
  completedByTitle?: string
}

interface Site {
  id: string
  name: string
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

interface AgencyLearningContractFormProps {
  learningContract: AgencyLearningContract
  site: Site
}

export function AgencyLearningContractForm({ learningContract, site }: AgencyLearningContractFormProps) {
  const [formData, setFormData] = useState({
    // Agency Information
    agencyEmail: learningContract.agencyEmail || '',
    agencyName: learningContract.agencyName || '',
    agencyAddress: learningContract.agencyAddress || '',
    agencyCity: learningContract.agencyCity || '',
    agencyState: learningContract.agencyState || '',
    agencyZip: learningContract.agencyZip || '',
    agencyTelephone: learningContract.agencyTelephone || '',
    agencyDirector: learningContract.agencyDirector || '',
    
    // Field Instructor Information
    fieldInstructorName: learningContract.fieldInstructorName || '',
    fieldInstructorFirstName: learningContract.fieldInstructorFirstName || '',
    fieldInstructorLastName: learningContract.fieldInstructorLastName || '',
    fieldInstructorDegree: learningContract.fieldInstructorDegree || '',
    fieldInstructorLicense: learningContract.fieldInstructorLicense || 'NO',
    fieldInstructorLicenseType: learningContract.fieldInstructorLicenseType || '',
    fieldInstructorResume: learningContract.fieldInstructorResume || '',
    
    // Program Information
    resourcesAvailable: learningContract.resourcesAvailable || 'YES',
    servicesProvided: learningContract.servicesProvided || '',
    learningPlan: learningContract.learningPlan || '',
    learningOpportunities: learningContract.learningOpportunities || '',
    supervisionArrangement: learningContract.supervisionArrangement || '',
    instructionMethods: learningContract.instructionMethods || '',
    orientationArrangements: learningContract.orientationArrangements || '',
    specialRequirements: learningContract.specialRequirements || '',
    handicapAccommodations: learningContract.handicapAccommodations || 'YES',
    handicapAccommodationsDetails: learningContract.handicapAccommodationsDetails || '',
    promotionalMaterials: learningContract.promotionalMaterials || '',
    comments: learningContract.comments || '',
    completedByName: learningContract.completedByName || '',
    completedByTitle: learningContract.completedByTitle || '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: File | null }>({})
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    const file = e.target.files?.[0] || null
    setUploadedFiles(prev => ({ ...prev, [fieldName]: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value)
      })

      // Add uploaded files
      Object.entries(uploadedFiles).forEach(([fieldName, file]) => {
        if (file) {
          formDataToSend.append(fieldName, file)
        }
      })

      const response = await fetch(`/api/agency-learning-contract/${learningContract.id}/submit`, {
        method: 'POST',
        body: formDataToSend,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit learning contract')
      }

      // Redirect to success page
      router.refresh()
    } catch (error) {
      console.error('Error submitting learning contract:', error)
      alert('Failed to submit learning contract. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get all available supervisors for the dropdown
  const allSupervisors = [
    ...(site.supervisors || []).map(s => ({ ...s, status: 'approved' })),
    ...(site.pendingSupervisors || []).map(s => ({ ...s, status: 'pending' }))
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Agency Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agency Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valid Agency Email Address *
            </label>
            <input
              type="email"
              name="agencyEmail"
              value={formData.agencyEmail}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name of Agency *
            </label>
            <input
              type="text"
              name="agencyName"
              value={formData.agencyName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency Address *
            </label>
            <input
              type="text"
              name="agencyAddress"
              value={formData.agencyAddress}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency City *
            </label>
            <input
              type="text"
              name="agencyCity"
              value={formData.agencyCity}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency State *
            </label>
            <input
              type="text"
              name="agencyState"
              value={formData.agencyState}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency ZIP *
            </label>
            <input
              type="text"
              name="agencyZip"
              value={formData.agencyZip}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency Telephone *
            </label>
            <input
              type="tel"
              name="agencyTelephone"
              value={formData.agencyTelephone}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency Director *
            </label>
            <input
              type="text"
              name="agencyDirector"
              value={formData.agencyDirector}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Field Instructor Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Field Instructor Information</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name of The Agency Field Instructor
          </label>
          <select
            name="fieldInstructorName"
            value={formData.fieldInstructorName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select existing supervisor or add new below</option>
            {allSupervisors.map((supervisor) => (
              <option key={supervisor.id} value={`${supervisor.firstName} ${supervisor.lastName}`}>
                {supervisor.firstName} {supervisor.lastName} ({supervisor.status === 'approved' ? 'Approved' : 'Pending'})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name of Agency Field Instructor
            </label>
            <input
              type="text"
              name="fieldInstructorFirstName"
              value={formData.fieldInstructorFirstName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name of Agency Field Instructor
            </label>
            <input
              type="text"
              name="fieldInstructorLastName"
              value={formData.fieldInstructorLastName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Does the field instructor hold an MSW, BSW, or another relevant degree? *
            </label>
            <select
              name="fieldInstructorDegree"
              value={formData.fieldInstructorDegree}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select degree</option>
              <option value="MSW">MSW</option>
              <option value="BSW">BSW</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Does the field instructor have an active social work license? *
            </label>
            <select
              name="fieldInstructorLicense"
              value={formData.fieldInstructorLicense}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
          </div>
        </div>

        {formData.fieldInstructorLicense === 'YES' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              License Type *
            </label>
            <select
              name="fieldInstructorLicenseType"
              value={formData.fieldInstructorLicenseType}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select license type</option>
              <option value="LICS">LICS</option>
              <option value="LCSW">LCSW</option>
              <option value="LGSW">LGSW</option>
              <option value="LSW">LSW</option>
              <option value="PROVISIONAL">Provisional License</option>
              <option value="INACTIVE">Inactive License</option>
            </select>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Field Instructor Resume
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleFileUpload(e, 'fieldInstructorResume')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Program Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Program Information</h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Students must have the same access to pertinent records, clerical support, workspace, equipment, telephones, and supplies as other staff members. Will this be available? *
          </label>
          <select
            name="resourcesAvailable"
            value={formData.resourcesAvailable}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What services are provided by the agency? *
          </label>
          <textarea
            name="servicesProvided"
            value={formData.servicesProvided}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe the plan for facilitating the learning of the student. (Relative to your agency, what might the student's responsibilities entail? For example: carry a small caseload, assess community needs, facilitate small groups, participate in the intake process, and follow up on clients who have been served previously) *
          </label>
          <textarea
            name="learningPlan"
            value={formData.learningPlan}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What learning opportunities does the agency offer? (For example, will the student have chance to develop problem-solving and analytical skills; interpersonal skills; knowledge of the dynamics of a specific population; opportunity to work with a group whose values may conflict with those of the student; knowledge and skills in use of community resources for the benefit of the client; understanding how policy is formulated and implemented in your agency?) *
          </label>
          <textarea
            name="learningOpportunities"
            value={formData.learningOpportunities}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            How will supervision be arranged or accomplished? (Weekly conferences, group meetings, a combination of scheduled conference times and conferences upon request, and conferences around specific situations, etc.) *
          </label>
          <textarea
            name="supervisionArrangement"
            value={formData.supervisionArrangement}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What techniques and methods will be used in the instruction of the student? (For example, use of student process recording, role-playing, small group activities, observation of the student's activity, and discussion.) *
          </label>
          <textarea
            name="instructionMethods"
            value={formData.instructionMethods}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Describe briefly the arrangements for the student's orientation to the agency. *
          </label>
          <textarea
            name="orientationArrangements"
            value={formData.orientationArrangements}
            onChange={handleInputChange}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Are there special requirements for the student position? (Automobile, use of specific equipment, days and/or hours of placement preferred. etc.)
          </label>
          <textarea
            name="specialRequirements"
            value={formData.specialRequirements}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Are there accommodations for handicapped students? *
          </label>
          <select
            name="handicapAccommodations"
            value={formData.handicapAccommodations}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
          </select>
        </div>

        {formData.handicapAccommodations === 'NO' && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Please explain
            </label>
            <textarea
              name="handicapAccommodationsDetails"
              value={formData.handicapAccommodationsDetails}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Please include any promotional material that describes the services of your agency.
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            multiple
            onChange={(e) => handleFileUpload(e, 'promotionalMaterials')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments?
          </label>
          <textarea
            name="comments"
            value={formData.comments}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Application Completion */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Completion</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Application completed by? (Name) *
            </label>
            <input
              type="text"
              name="completedByName"
              value={formData.completedByName}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="completedByTitle"
              value={formData.completedByTitle}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Learning Contract'}
        </button>
      </div>
    </form>
  )
}
