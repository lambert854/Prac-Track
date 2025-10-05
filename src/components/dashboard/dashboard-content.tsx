'use client'

import { UserRole } from '@prisma/client'
import { StudentDashboard } from './student-dashboard'
import { SupervisorDashboard } from './supervisor-dashboard'
import { FacultyDashboard } from './faculty-dashboard'
import { AdminDashboard } from './admin-dashboard'

interface DashboardContentProps {
  user: {
    id: string
    role: UserRole
    name: string
    studentProfile?: any
    facultyProfile?: any
    supervisorProfile?: any
  }
}

export function DashboardContent({ user }: DashboardContentProps) {
  switch (user.role) {
    case UserRole.STUDENT:
      return <StudentDashboard user={user} />
    case UserRole.SUPERVISOR:
      return <SupervisorDashboard user={user} />
    case UserRole.FACULTY:
      return <FacultyDashboard user={user} />
    case UserRole.ADMIN:
      return <AdminDashboard user={user} />
    default:
      return (
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to Prac-Track</h1>
          <p className="text-gray-600 mt-2">Your role is not recognized. Please contact support.</p>
        </div>
      )
  }
}
