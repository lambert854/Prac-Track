import { describe, it, expect } from 'vitest'
import { UserRole } from '@prisma/client'
import { hasRole, canAccessStudentData, canAccessPlacement } from './auth-helpers'

describe('Auth Helpers', () => {
  describe('hasRole', () => {
    it('should return true when user has required role', () => {
      expect(hasRole(UserRole.ADMIN, [UserRole.ADMIN, UserRole.FACULTY])).toBe(true)
      expect(hasRole(UserRole.STUDENT, [UserRole.STUDENT])).toBe(true)
    })

    it('should return false when user does not have required role', () => {
      expect(hasRole(UserRole.STUDENT, [UserRole.ADMIN, UserRole.FACULTY])).toBe(false)
      expect(hasRole(UserRole.SUPERVISOR, [UserRole.STUDENT])).toBe(false)
    })
  })

  describe('canAccessStudentData', () => {
    it('should allow admin and faculty to access any student data', () => {
      expect(canAccessStudentData(UserRole.ADMIN, 'student1', 'admin1')).toBe(true)
      expect(canAccessStudentData(UserRole.FACULTY, 'student1', 'faculty1')).toBe(true)
    })

    it('should allow students to access their own data', () => {
      expect(canAccessStudentData(UserRole.STUDENT, 'student1', 'student1')).toBe(true)
    })

    it('should deny students access to other students data', () => {
      expect(canAccessStudentData(UserRole.STUDENT, 'student1', 'student2')).toBe(false)
    })
  })

  describe('canAccessPlacement', () => {
    const mockPlacement = {
      studentId: 'student1',
      supervisorId: 'supervisor1',
      facultyId: 'faculty1',
    }

    it('should allow admin and faculty to access any placement', () => {
      expect(canAccessPlacement(UserRole.ADMIN, mockPlacement, 'admin1')).toBe(true)
      expect(canAccessPlacement(UserRole.FACULTY, mockPlacement, 'faculty1')).toBe(true)
    })

    it('should allow students to access their own placements', () => {
      expect(canAccessPlacement(UserRole.STUDENT, mockPlacement, 'student1')).toBe(true)
    })

    it('should allow supervisors to access their assigned placements', () => {
      expect(canAccessPlacement(UserRole.SUPERVISOR, mockPlacement, 'supervisor1')).toBe(true)
    })

    it('should deny access to unauthorized users', () => {
      expect(canAccessPlacement(UserRole.STUDENT, mockPlacement, 'student2')).toBe(false)
      expect(canAccessPlacement(UserRole.SUPERVISOR, mockPlacement, 'supervisor2')).toBe(false)
    })
  })
})
