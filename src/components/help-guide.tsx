'use client'

import { useState } from 'react'
import { UserRole } from '@prisma/client'
import { 
  ChevronRightIcon, 
  ChevronDownIcon,
  HomeIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CogIcon
} from '@heroicons/react/24/outline'

interface HelpGuideProps {
  user: {
    id: string
    role: UserRole
    name?: string | null
  }
}

interface HelpSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  content: {
    title: string
    description: string
    steps?: string[]
  }[]
}

const helpSections: Record<UserRole, HelpSection[]> = {
  [UserRole.STUDENT]: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: HomeIcon,
      content: [
        {
          title: 'Understanding Your Dashboard',
          description: 'Your dashboard provides an overview of your practicum placement progress and important tasks.',
          steps: [
            'View your current placement status and progress',
            'Check required hours completion',
            'Access quick links to log hours, complete forms, and view reports',
            'Monitor pending tasks and deadlines'
          ]
        }
      ]
    },
    {
      id: 'browse-sites',
      title: 'Browse Sites',
      icon: BuildingOfficeIcon,
      content: [
        {
          title: 'Finding Placement Sites',
          description: 'Browse available field placement sites and request placements.',
          steps: [
            'Search sites by name, contact, or email',
            'Filter by city or practice area',
            'View site details including contact information',
            'Submit placement requests for sites of interest'
          ]
        }
      ]
    },
    {
      id: 'placements',
      title: 'My Placements',
      icon: BuildingOfficeIcon,
      content: [
        {
          title: 'Managing Your Placements',
          description: 'View and manage your current and past practicum placements.',
          steps: [
            'View placement details including site, supervisor, and faculty information',
            'Check placement status and important dates',
            'Access placement-related documents and agreements',
            'Track placement progress and milestones'
          ]
        }
      ]
    },
    {
      id: 'timesheets',
      title: 'Timesheets',
      icon: ClipboardDocumentListIcon,
      content: [
        {
          title: 'Logging Your Hours',
          description: 'Record and manage your field placement hours.',
          steps: [
            'Enter daily hours worked at your placement site',
            'Categorize hours by activity type',
            'Submit timesheets for supervisor approval',
            'Track approved vs. pending hours'
          ]
        }
      ]
    },
    {
      id: 'forms',
      title: 'Forms',
      icon: DocumentTextIcon,
      content: [
        {
          title: 'Completing Required Forms',
          description: 'Access and complete evaluation forms and other required documentation.',
          steps: [
            'View pending forms and deadlines',
            'Complete midterm and final evaluations',
            'Submit forms for supervisor and faculty review',
            'Track form completion status'
          ]
        }
      ]
    },
    {
      id: 'reports',
      title: 'My Reports',
      icon: ChartBarIcon,
      content: [
        {
          title: 'Viewing Your Progress',
          description: 'Generate reports on your hours and placement progress.',
          steps: [
            'View detailed breakdown of logged hours',
            'Export timesheet data for records',
            'Track progress toward required hours',
            'Monitor placement completion status'
          ]
        }
      ]
    }
  ],
  [UserRole.FACULTY]: [
    {
      id: 'dashboard',
      title: 'Faculty Dashboard',
      icon: HomeIcon,
      content: [
        {
          title: 'Faculty Overview',
          description: 'Monitor your assigned students and their placement progress.',
          steps: [
            'View assigned students and their current placements',
            'Track student progress and hours completion',
            'Access pending evaluations and forms',
            'Monitor placement status and issues'
          ]
        }
      ]
    },
    {
      id: 'students',
      title: 'Student Management',
      icon: UserGroupIcon,
      content: [
        {
          title: 'Managing Students',
          description: 'View and manage student information and assignments.',
          steps: [
            'Search and filter students by various criteria',
            'View detailed student profiles and placement history',
            'Edit student information as needed',
            'Track student progress and performance'
          ]
        }
      ]
    },
    {
      id: 'placements',
      title: 'Placement Management',
      icon: BuildingOfficeIcon,
      content: [
        {
          title: 'Overseeing Placements',
          description: 'Monitor and manage student placements.',
          steps: [
            'View all student placements and their status',
            'Approve or modify placement requests',
            'Track placement progress and issues',
            'Manage placement assignments and changes'
          ]
        }
      ]
    },
    {
      id: 'faculty',
      title: 'Faculty Management',
      icon: AcademicCapIcon,
      content: [
        {
          title: 'Faculty Administration',
          description: 'Manage faculty accounts and assignments.',
          steps: [
            'Create and manage faculty accounts',
            'Assign faculty to students',
            'View faculty profiles and contact information',
            'Manage faculty permissions and roles'
          ]
        }
      ]
    },
    {
      id: 'assignments',
      title: 'Faculty Assignments',
      icon: UserGroupIcon,
      content: [
        {
          title: 'Student-Faculty Assignments',
          description: 'Manage the assignment of students to faculty advisors.',
          steps: [
            'View current student-faculty assignments',
            'Create new assignments or modify existing ones',
            'Track assignment history and changes',
            'Ensure proper faculty coverage for all students'
          ]
        }
      ]
    },
    {
      id: 'supervisors',
      title: 'Supervisor Management',
      icon: UserGroupIcon,
      content: [
        {
          title: 'Field Supervisor Management',
          description: 'Manage field supervisors and their site assignments.',
          steps: [
            'View and manage supervisor accounts',
            'Assign supervisors to placement sites',
            'Track supervisor credentials and contact information',
            'Monitor supervisor-student relationships'
          ]
        }
      ]
    },
    {
      id: 'sites',
      title: 'Site Management',
      icon: BuildingOfficeIcon,
      content: [
        {
          title: 'Field Site Administration',
          description: 'Manage placement sites and their agreements.',
          steps: [
            'Add and edit placement sites',
            'Manage site agreements and expiration dates',
            'Track site contact information and details',
            'Monitor site capacity and availability'
          ]
        }
      ]
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: ChartBarIcon,
      content: [
        {
          title: 'Generating Reports',
          description: 'Create reports on student progress and placement data.',
          steps: [
            'Generate student progress reports',
            'Create placement statistics and summaries',
            'Export data for administrative purposes',
            'Monitor program outcomes and metrics'
          ]
        }
      ]
    }
  ],
  [UserRole.SUPERVISOR]: [
    {
      id: 'dashboard',
      title: 'Supervisor Dashboard',
      icon: HomeIcon,
      content: [
        {
          title: 'Supervisor Overview',
          description: 'Monitor your assigned students and manage their field placement experience.',
          steps: [
            'View students assigned to your site',
            'Track student progress and hours',
            'Review and approve timesheet entries',
            'Complete required evaluations and forms'
          ]
        }
      ]
    },
    {
      id: 'students',
      title: 'Student Management',
      icon: UserGroupIcon,
      content: [
        {
          title: 'Managing Assigned Students',
          description: 'Oversee students placed at your field site.',
          steps: [
            'View detailed student profiles and placement information',
            'Monitor student progress and performance',
            'Track student hours and activities',
            'Communicate with faculty advisors about student progress'
          ]
        }
      ]
    },
    {
      id: 'timesheets',
      title: 'Timesheet Approval',
      icon: ClipboardDocumentListIcon,
      content: [
        {
          title: 'Reviewing Student Hours',
          description: 'Review and approve student timesheet entries.',
          steps: [
            'View submitted timesheet entries',
            'Verify hours and activities reported',
            'Approve or request revisions to timesheets',
            'Track approval history and patterns'
          ]
        }
      ]
    },
    {
      id: 'evaluations',
      title: 'Student Evaluations',
      icon: DocumentTextIcon,
      content: [
        {
          title: 'Completing Evaluations',
          description: 'Complete required student evaluations and assessments.',
          steps: [
            'Access midterm and final evaluation forms',
            'Complete comprehensive student assessments',
            'Submit evaluations for faculty review',
            'Track evaluation completion status'
          ]
        }
      ]
    }
  ],
  [UserRole.ADMIN]: [
    {
      id: 'dashboard',
      title: 'Admin Dashboard',
      icon: HomeIcon,
      content: [
        {
          title: 'System Administration',
          description: 'Comprehensive overview of the entire system and user management.',
          steps: [
            'Monitor system-wide statistics and metrics',
            'Manage all user accounts and roles',
            'Oversee placement operations and issues',
            'Access system settings and configuration'
          ]
        }
      ]
    },
    {
      id: 'students',
      title: 'Student Administration',
      icon: UserGroupIcon,
      content: [
        {
          title: 'Complete Student Management',
          description: 'Full administrative control over all student accounts and data.',
          steps: [
            'Create, edit, and manage all student accounts',
            'View comprehensive student placement history',
            'Manage student-faculty assignments',
            'Generate detailed student reports and analytics'
          ]
        }
      ]
    },
    {
      id: 'placements',
      title: 'Placement Administration',
      icon: BuildingOfficeIcon,
      content: [
        {
          title: 'System-wide Placement Management',
          description: 'Oversee all placements across the entire program.',
          steps: [
            'View and manage all student placements',
            'Approve placement requests and modifications',
            'Track placement statistics and outcomes',
            'Manage placement agreements and contracts'
          ]
        }
      ]
    },
    {
      id: 'faculty',
      title: 'Faculty Administration',
      icon: AcademicCapIcon,
      content: [
        {
          title: 'Complete Faculty Management',
          description: 'Administrative control over all faculty accounts and assignments.',
          steps: [
            'Create and manage all faculty accounts',
            'Assign faculty to students and programs',
            'Manage faculty permissions and access levels',
            'Track faculty workload and assignments'
          ]
        }
      ]
    },
    {
      id: 'assignments',
      title: 'Assignment Management',
      icon: UserGroupIcon,
      content: [
        {
          title: 'System-wide Assignment Control',
          description: 'Manage all student-faculty and supervisor assignments.',
          steps: [
            'View all assignment relationships across the system',
            'Create and modify assignments as needed',
            'Track assignment history and changes',
            'Ensure proper coverage and load balancing'
          ]
        }
      ]
    },
    {
      id: 'supervisors',
      title: 'Supervisor Administration',
      icon: UserGroupIcon,
      content: [
        {
          title: 'Complete Supervisor Management',
          description: 'Administrative control over all field supervisors.',
          steps: [
            'Create and manage all supervisor accounts',
            'Assign supervisors to sites and students',
            'Track supervisor credentials and compliance',
            'Monitor supervisor performance and feedback'
          ]
        }
      ]
    },
    {
      id: 'sites',
      title: 'Site Administration',
      icon: BuildingOfficeIcon,
      content: [
        {
          title: 'Complete Site Management',
          description: 'Administrative control over all placement sites.',
          steps: [
            'Create and manage all placement sites',
            'Oversee site agreements and compliance',
            'Track site capacity and utilization',
            'Manage site contacts and relationships'
          ]
        }
      ]
    },
    {
      id: 'reports',
      title: 'System Reports',
      icon: ChartBarIcon,
      content: [
        {
          title: 'Comprehensive Reporting',
          description: 'Generate detailed reports on all aspects of the program.',
          steps: [
            'Create system-wide analytics and reports',
            'Generate compliance and accreditation reports',
            'Export data for external reporting requirements',
            'Monitor program outcomes and effectiveness'
          ]
        }
      ]
    },
    {
      id: 'settings',
      title: 'System Settings',
      icon: CogIcon,
      content: [
        {
          title: 'System Configuration',
          description: 'Configure system-wide settings and user management.',
          steps: [
            'Manage user accounts and permissions',
            'Configure system settings and preferences',
            'Monitor system performance and usage',
            'Manage data security and backup procedures'
          ]
        }
      ]
    }
  ]
}

export function HelpGuide({ user }: HelpGuideProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId)
  }

  const sections = helpSections[user.role] || []

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Help Guide
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Welcome to PRAC-TRACK! This guide will help you navigate and use all the features available to your role as a {user.role.toLowerCase()}.
          </p>
        </div>

        {/* Help Sections */}
        <div className="space-y-4">
          {sections.map((section) => {
            const isExpanded = expandedSection === section.id
            const Icon = section.icon

            return (
              <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <Icon className="h-6 w-6 text-gray-600 mr-3" />
                    <h2 className="text-lg font-semibold text-gray-900">
                      {section.title}
                    </h2>
                  </div>
                  {isExpanded ? (
                    <ChevronDownIcon className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="space-y-6 pt-4">
                      {section.content.map((item, index) => (
                        <div key={index}>
                          <h3 className="text-md font-medium text-gray-900 mb-2">
                            {item.title}
                          </h3>
                          <p className="text-gray-600 mb-3">
                            {item.description}
                          </p>
                          {item.steps && (
                            <ul className="space-y-2">
                              {item.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="flex items-start">
                                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                                    {stepIndex + 1}
                                  </span>
                                  <span className="text-gray-600">{step}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Contact Information */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Need Additional Help?
          </h2>
          <p className="text-gray-600 mb-4">
            If you can't find the information you're looking for in this guide, please contact your system administrator or program coordinator for assistance.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Note:</strong> This help guide will be updated as new features are added to the system. 
              Check back regularly for the latest information and updates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
