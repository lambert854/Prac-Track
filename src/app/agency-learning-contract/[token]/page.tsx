import { AgencyLearningContractForm } from '@/components/forms/agency-learning-contract-form'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function AgencyLearningContractPage({ params }: PageProps) {
  const { token } = await params

  // Find the learning contract by token
  const learningContract = await prisma.agencyLearningContract.findUnique({
    where: { token },
    include: {
      site: {
        include: {
          supervisors: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  })

  // Check if token is valid and not expired
  if (!learningContract || learningContract.tokenExpiry < new Date()) {
    notFound()
  }

  // Check if already submitted
  if (learningContract.status === 'SUBMITTED' || learningContract.status === 'APPROVED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-600">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Agency Application {learningContract.status === 'APPROVED' ? 'Approved' : 'Submitted'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Thank you for submitting the agency application for {learningContract.site.name}.
              {learningContract.status === 'SUBMITTED' && ' It is currently under review.'}
              {learningContract.status === 'APPROVED' && ' It has been approved and the agency is now active.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900">
                WVSU Department of Social Work
              </h1>
              <h2 className="text-xl font-semibold text-gray-700 mt-2">
                Agency Application
              </h2>
              <p className="text-gray-600 mt-4">
                Upon completion of the application and acceptance as a Field Placement Site for a WVSU Department of Social Work Field Student
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                The Agency Agrees To:
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Assign as Agency Field Instructor a qualified staff member with sufficient time and expertise for student instruction, permit time for the Field Instructor and student to confer weekly at an agreed-upon time (unless otherwise arranged) to provide instruction and necessary feedback, and allow the Field Instructor time to attend periodic conferences/meetings with the Faculty Field Director.</li>
                <li>Recognize the student&apos;s primary role is that of learner and design the field experiences to ensure learning opportunities. Field learning activities are to be designed in compliance with the objectives of the Field Instruction program and the student&apos;s learning contract.</li>
                <li>Interview prospective field instruction candidates and consider placement without regard to gender, race, color, age, religious beliefs, national origin, sexual orientation, or disability.</li>
                <li>Provide necessary resources for the student to perform the student&apos;s responsibilities (provision of space, telephone, materials, and access to records and technology available within the agency)</li>
                <li>Orient the student to the staff and facilities and designate a staff member available to the student in the absence of the Agency Field Instructor.</li>
                <li>Develop a contract with the student specifying learning objectives, work assignments, supervision plans, and evaluation procedures.</li>
                <li>Maintain records to ensure that the student meets the required number of hours in placement.</li>
                <li>Submit the required written evaluations of the student&apos;s performance to the Social Work Program.</li>
                <li>Immediately inform the Faculty Field Director of any changes that affect the student in placement, such as programmatic or staff changes.</li>
              </ol>
            </div>

            <AgencyLearningContractForm 
              learningContract={learningContract}
              site={learningContract.site}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
