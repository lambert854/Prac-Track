'use client'

import { useState } from 'react'
import { XMarkIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

interface FAQItem {
  id: string
  question: string
  answer: string | JSX.Element
  category: string
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: 'getting-started',
    question: 'How do I get started with Prac-Track?',
    answer: 'Prac-Track is designed for managing practicum placement programs. Start by exploring the main navigation menu to access different sections like Students, Sites, Placements, and Reports. Each section has specific functions for managing your program data.',
    category: 'Getting Started'
  },
  {
    id: 'navigation',
    question: 'How do I navigate the application?',
    answer: 'Use the sidebar navigation menu on the left to access different sections. The main areas include: Students (manage student information), Sites (practicum placement sites), Placements (student-site assignments), Supervisors (field supervisors), Faculty (program faculty), and Reports (program analytics).',
    category: 'Getting Started'
  },

  // Student Management
  {
    id: 'add-student',
    question: 'How do I add a new student?',
    answer: 'Go to the Students section and click the "Add Student" button. Fill in the required information including name, email, student ID, program details, and contact information. Click "Create Student" to save.',
    category: 'Student Management'
  },
  {
    id: 'edit-student',
    question: 'How do I edit student information?',
    answer: 'In the Students section, find the student you want to edit and click the edit (pencil) icon next to their name. Make your changes and click "Update Student" to save.',
    category: 'Student Management'
  },
  {
    id: 'student-status',
    question: 'What do the different student statuses mean?',
    answer: (
      <div>
        <p><strong>Active:</strong> Currently enrolled in the program</p>
        <p><strong>Graduated:</strong> Successfully completed the program</p>
        <p><strong>Withdrawn:</strong> Left the program before completion</p>
        <p><strong>Inactive:</strong> Temporarily not participating in placements</p>
      </div>
    ),
    category: 'Student Management'
  },

  // Site Management
  {
    id: 'add-site',
    question: 'How do I add a new practicum placement site?',
    answer: 'Go to the Sites section and click "Add Site". Fill in the site information including name, address, contact details, and practice areas. You can also set up practicum placement agreement details including start date, staff license status, and supervisor training.',
    category: 'Site Management'
  },
  {
    id: 'site-agreement',
    question: 'What is the practicum placement Agreement section?',
    answer: 'The practicum placement Agreement tracks your formal agreements with field sites. It includes the agreement start date (expiration is automatically calculated as 3 years from start), whether staff have active social work licenses, and whether field supervisor training has been completed.',
    category: 'Site Management'
  },
  {
    id: 'site-status',
    question: 'How do I activate or deactivate a site?',
    answer: 'In the Sites section, find the site and click the edit button. Check or uncheck the "Active" checkbox to change the site status. Deactivated sites will appear in the "Inactive Sites" section.',
    category: 'Site Management'
  },

  // Placement Management
  {
    id: 'create-placement',
    question: 'How do I create a new placement?',
    answer: 'Go to the Placements section and click "Add Placement". Select the student, site, and supervisor. Set the start and end dates, and choose the placement status. Click "Create Placement" to save.',
    category: 'Placement Management'
  },
  {
    id: 'placement-status',
    question: 'What do the different placement statuses mean?',
    answer: (
      <div>
        <p><strong>Planned:</strong> Placement is scheduled but hasn&apos;t started</p>
        <p><strong>Active:</strong> Student is currently at the placement site</p>
        <p><strong>Completed:</strong> Placement has finished successfully</p>
        <p><strong>Terminated:</strong> Placement ended early</p>
        <p><strong>On Hold:</strong> Placement is temporarily paused</p>
      </div>
    ),
    category: 'Placement Management'
  },
  {
    id: 'edit-placement',
    question: 'How do I modify an existing placement?',
    answer: 'Find the placement in the Placements section and click the edit button. You can change dates, status, supervisor assignment, or any other details. Click "Update Placement" to save changes.',
    category: 'Placement Management'
  },

  // Supervisor Management
  {
    id: 'add-supervisor',
    question: 'How do I add a new field supervisor?',
    answer: 'Go to the Supervisors section and click "Add Supervisor". Fill in the supervisor\'s information and assign them to specific sites. You can also set their credentials and contact preferences.',
    category: 'Supervisor Management'
  },
  {
    id: 'assign-supervisor',
    question: 'How do I assign a supervisor to a site?',
    answer: 'You can assign supervisors in two ways: 1) When editing a site, use the "Add Supervisor" button in the Supervisors section, or 2) When adding a supervisor, select the sites they will supervise in the site assignment section.',
    category: 'Supervisor Management'
  },

  // Faculty Management
  {
    id: 'faculty-roles',
    question: 'What are the different faculty roles?',
    answer: (
      <div>
        <p><strong>Admin:</strong> Full system access including user management</p>
        <p><strong>Faculty:</strong> Can manage students, placements, and view reports</p>
        <p><strong>Coordinator:</strong> Can manage placements and view student information</p>
        <p><strong>Viewer:</strong> Read-only access to reports and student information</p>
      </div>
    ),
    category: 'Faculty Management'
  },
  {
    id: 'faculty-assignments',
    question: 'How do I assign faculty to students?',
    answer: 'Go to the Faculty Assignments section. Use the "Assign Faculty" button to link faculty members with specific students. This helps track which faculty member is responsible for each student\'s practicum placement.',
    category: 'Faculty Management'
  },

  // Reports and Analytics
  {
    id: 'reports-overview',
    question: 'What reports are available?',
    answer: 'Prac-Track provides several reports including: Site reports (active/inactive sites, agreement status), Student reports (enrollment, placement history), Placement reports (current placements, completion rates), and Program analytics (overall program statistics).',
    category: 'Reports & Analytics'
  },
  {
    id: 'export-data',
    question: 'Can I export data from the system?',
    answer: 'Yes, most reports and data tables have export functionality. Look for "Export" or "Download" buttons in the reports sections. Data can typically be exported as CSV or PDF formats.',
    category: 'Reports & Analytics'
  },

  // practicum placement Agreements
  {
    id: 'agreement-tracking',
    question: 'How does the system track practicum placement agreements?',
    answer: 'The system automatically tracks agreement status based on start and expiration dates. Agreements show as "Active" if current date is within the agreement period, "Expired" if past the expiration date, or "Unknown" if no dates are set.',
    category: 'practicum placement Agreements'
  },
  {
    id: 'agreement-expiration',
    question: 'How are agreement expiration dates calculated?',
    answer: 'Expiration dates are automatically calculated as exactly 3 years from the agreement start date. For example, if an agreement starts in August 2021, it will expire in August 2024.',
    category: 'practicum placement Agreements'
  },
  {
    id: 'license-training',
    question: 'What do the Staff License and Supervisor Training fields mean?',
    answer: 'These fields track important compliance information: "Staff with Active SW License" indicates if site staff have current social work licenses, and "Field Supervisor Training" tracks whether supervisors have completed required training programs.',
    category: 'practicum placement Agreements'
  },

  // Troubleshooting
  {
    id: 'login-issues',
    question: 'I can\'t log in to the system. What should I do?',
    answer: 'Check that you\'re using the correct email and password. If you\'ve forgotten your password, contact your system administrator to reset it. Make sure you have the correct role permissions assigned to your account.',
    category: 'Troubleshooting'
  },
  {
    id: 'data-not-saving',
    question: 'My data isn\'t saving when I make changes. What\'s wrong?',
    answer: 'Check your internet connection and try refreshing the page. Make sure all required fields are filled out (marked with asterisks). If the problem persists, contact your system administrator.',
    category: 'Troubleshooting'
  },
  {
    id: 'slow-performance',
    question: 'The application is running slowly. What can I do?',
    answer: 'Try refreshing your browser and clearing your browser cache. Close other browser tabs that might be using memory. If the issue continues, contact your system administrator as there may be server-side issues.',
    category: 'Troubleshooting'
  }
]

const categories = ['Getting Started', 'Student Management', 'Site Management', 'Placement Management', 'Supervisor Management', 'Faculty Management', 'Reports & Analytics', 'practicum placement Agreements', 'Troubleshooting']

interface HelpFAQProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpFAQ({ isOpen, onClose }: HelpFAQProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Getting Started')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const filteredFAQs = faqData.filter(faq => faq.category === selectedCategory)

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedItems(newExpanded)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <QuestionMarkCircleIcon className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Help & FAQ</h2>
              <p className="text-gray-600">Get help with using Prac-Track</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Categories</h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{selectedCategory}</h3>
                <p className="text-gray-600">
                  Find answers to common questions about {selectedCategory.toLowerCase()}
                </p>
              </div>

              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleExpanded(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      {expandedItems.has(faq.id) ? (
                        <ChevronUpIcon className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    {expandedItems.has(faq.id) && (
                      <div className="px-6 pb-4 border-t border-gray-100">
                        <div className="pt-4 text-gray-700 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <QuestionMarkCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
                  <p className="text-gray-600">Try selecting a different category</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Need more help? Contact your system administrator.
            </p>
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
