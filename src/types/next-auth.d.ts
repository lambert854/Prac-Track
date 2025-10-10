import { UserRole } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      studentProfile?: {
        id: string
        program: string
        cohort: string
        requiredHours: number
        term: string
      }
      facultyProfile?: {
        id: string
        title?: string
        officePhone?: string
        honorific?: string
        roomNumber?: string
      }
      supervisorProfile?: {
        id: string
        organizationName: string
        title?: string
      }
    }
  }

  interface User {
    role: UserRole
    studentProfile?: any
    facultyProfile?: any
    supervisorProfile?: any
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: UserRole
    studentProfile?: any
    facultyProfile?: any
    supervisorProfile?: any
  }
}
