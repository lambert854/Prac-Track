import { UserRole } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

export async function requireRole(allowedRoles: UserRole[]) {
  const session = await requireAuth()
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/login')
  }
  
  return session
}

export async function requireStudent() {
  return requireRole([UserRole.STUDENT])
}

export async function requireSupervisor() {
  return requireRole([UserRole.SUPERVISOR])
}

export async function requireFaculty() {
  return requireRole([UserRole.FACULTY])
}

export async function requireAdmin() {
  return requireRole([UserRole.ADMIN])
}

export async function requireFacultyOrAdmin() {
  return requireRole([UserRole.FACULTY, UserRole.ADMIN])
}

export async function requireFacultyOrAdminForManagement() {
  return requireRole([UserRole.FACULTY, UserRole.ADMIN])
}

export async function requireStudentFacultyOrAdmin() {
  return requireRole([UserRole.STUDENT, UserRole.FACULTY, UserRole.ADMIN])
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole)
}

export function canAccessStudentData(userRole: UserRole, targetUserId?: string, currentUserId?: string): boolean {
  if (userRole === UserRole.ADMIN || userRole === UserRole.FACULTY) {
    return true
  }
  
  if (userRole === UserRole.STUDENT && targetUserId === currentUserId) {
    return true
  }
  
  return false
}

export function canAccessPlacement(userRole: UserRole, placement: any, userId: string): boolean {
  if (userRole === UserRole.ADMIN || userRole === UserRole.FACULTY) {
    return true
  }
  
  if (userRole === UserRole.STUDENT && placement.studentId === userId) {
    return true
  }
  
  if (userRole === UserRole.SUPERVISOR && placement.supervisorId === userId) {
    return true
  }
  
  return false
}
