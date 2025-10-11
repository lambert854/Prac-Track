'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { UserRole } from '@prisma/client'
import { 
  HomeIcon, 
  BuildingOfficeIcon, 
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline'
import { Logo, LogoCompact } from '@/components/ui/logo'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const navigation: NavItem[] = [
  // Student navigation
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: [UserRole.STUDENT, UserRole.SUPERVISOR, UserRole.ADMIN] },
  { name: 'Browse Field Sites', href: '/placements/browse', icon: BuildingOfficeIcon, roles: [UserRole.STUDENT] },
  { name: 'My Placements', href: '/placements', icon: BuildingOfficeIcon, roles: [UserRole.STUDENT] },
  { name: 'Timesheets', href: '/timesheets', icon: ClipboardDocumentListIcon, roles: [UserRole.STUDENT] },
  { name: 'Forms', href: '/forms', icon: DocumentTextIcon, roles: [UserRole.STUDENT] },
  { name: 'My Reports', href: '/reports/my-hours', icon: ChartBarIcon, roles: [UserRole.STUDENT] },
  
  // Supervisor navigation
  { name: 'Supervisor Dashboard', href: '/supervisor', icon: UserGroupIcon, roles: [UserRole.SUPERVISOR] },
  
  // Faculty navigation
  { name: 'Faculty Dashboard', href: '/faculty', icon: HomeIcon, roles: [UserRole.FACULTY] },
  { name: 'Students', href: '/admin/students', icon: UserGroupIcon, roles: [UserRole.FACULTY, UserRole.ADMIN] },
  { name: 'Placements', href: '/admin/placements', icon: ClipboardDocumentListIcon, roles: [UserRole.FACULTY, UserRole.ADMIN] },
  { name: 'Faculty', href: '/admin/faculty', icon: AcademicCapIcon, roles: [UserRole.FACULTY, UserRole.ADMIN] },
  { name: 'Faculty Assignments', href: '/admin/faculty-assignments', icon: UserGroupIcon, roles: [UserRole.FACULTY, UserRole.ADMIN] },
  { name: 'Supervisor Management', href: '/admin/supervisors', icon: UserGroupIcon, roles: [UserRole.FACULTY, UserRole.ADMIN] },
  { name: 'Site Management', href: '/admin/sites', icon: BuildingOfficeIcon, roles: [UserRole.FACULTY, UserRole.ADMIN] },
  { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon, roles: [UserRole.FACULTY, UserRole.ADMIN] },
  
  // Admin-only navigation
  { name: 'Class Management', href: '/admin/classes', icon: AcademicCapIcon, roles: [UserRole.ADMIN] },
  { name: 'User Management', href: '/admin/users', icon: UserGroupIcon, roles: [UserRole.ADMIN] },
  
  // Help - available to all roles
  { name: 'Help', href: '/help', icon: QuestionMarkCircleIcon, roles: [UserRole.STUDENT, UserRole.FACULTY, UserRole.SUPERVISOR, UserRole.ADMIN] },
]

export function Navigation() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const userRole = session.user.role
  
  // Get display name with honorific for faculty users
  const getDisplayName = () => {
    if (userRole === 'FACULTY' && session.user.facultyProfile?.honorific) {
      return `${session.user.facultyProfile.honorific} ${session.user.name}`
    }
    return session.user.name
  }
  const filteredNavigation = navigation.filter(item => item.roles.includes(userRole))

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }

  // Group navigation items for different roles
  const getGroupedNavigation = () => {
    if (userRole === UserRole.ADMIN) {
      return [
        { name: 'Admin Dashboard', href: '/admin', icon: HomeIcon },
        { type: 'separator' },
        { name: 'Students', href: '/admin/students', icon: UserGroupIcon },
        { name: 'Placements', href: '/admin/placements', icon: ClipboardDocumentListIcon },
        { type: 'separator' },
        { name: 'Faculty Management', href: '/admin/faculty', icon: AcademicCapIcon },
        { name: 'Faculty Assignments', href: '/admin/faculty-assignments', icon: UserGroupIcon },
        { type: 'separator' },
        { name: 'Supervisor Management', href: '/admin/supervisors', icon: UserGroupIcon },
        { name: 'Site Management', href: '/admin/sites', icon: BuildingOfficeIcon },
        { type: 'separator' },
        { name: 'Class Management', href: '/admin/classes', icon: AcademicCapIcon },
        { name: 'User Management', href: '/admin/users', icon: UserGroupIcon },
        { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
      ]
    } else if (userRole === UserRole.FACULTY) {
      return [
        { name: 'Faculty Dashboard', href: '/faculty', icon: HomeIcon },
        { type: 'separator' },
        { name: 'My Students', href: '/faculty/students', icon: UserGroupIcon },
        { name: 'My Timesheets', href: '/faculty/timesheets', icon: ClipboardDocumentListIcon },
        { type: 'separator' },
        { name: 'All Students', href: '/admin/students', icon: UserGroupIcon },
        { name: 'All Placements', href: '/admin/placements', icon: ClipboardDocumentListIcon },
        { type: 'separator' },
        { name: 'Faculty Assignments', href: '/admin/faculty-assignments', icon: UserGroupIcon },
        { type: 'separator' },
        { name: 'Supervisor Management', href: '/admin/supervisors', icon: UserGroupIcon },
        { name: 'Site Management', href: '/admin/sites', icon: BuildingOfficeIcon },
        { type: 'separator' },
        { name: 'Reports', href: '/admin/reports', icon: ChartBarIcon },
      ]
    } else if (userRole === UserRole.SUPERVISOR) {
      return [
        { name: 'Supervisor Dashboard', href: '/supervisor', icon: HomeIcon },
        { type: 'separator' },
        { name: 'Students', href: '/supervisor/students', icon: UserGroupIcon },
        { name: 'Timesheets', href: '/supervisor/timesheets', icon: ClipboardDocumentListIcon },
        { name: 'Forms', href: '/supervisor/forms', icon: DocumentTextIcon },
      ]
    } else {
      // For students, use the original filtered navigation but update dashboard name
      return filteredNavigation.map(item => ({
        name: item.name === 'Dashboard' ? 'Student Dashboard' : item.name,
        href: item.href,
        icon: item.icon
      }))
    }
  }

  const groupedNavigation = getGroupedNavigation()

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-50 flex">
          <div className="sidebar-mobile flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <Logo size="md" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {groupedNavigation.map((item, index) => {
                if ('type' in item && item.type === 'separator') {
                  return <hr key={`separator-${index}`} className="border-gray-200 my-2" />
                }
                
                if (!item.href) return null
                
                // Check if this is the dashboard item and if we're on the dashboard page
                const isDashboardItem = item.href === '/dashboard' || 
                                      item.href === '/faculty' || 
                                      item.href === '/supervisor' || 
                                      item.href === '/admin'
                
                const isActive = pathname === item.href || 
                                (pathname === '/dashboard' && isDashboardItem && (
                                  (userRole === UserRole.STUDENT && item.href === '/dashboard') ||
                                  (userRole === UserRole.FACULTY && item.href === '/faculty') ||
                                  (userRole === UserRole.SUPERVISOR && item.href === '/supervisor') ||
                                  (userRole === UserRole.ADMIN && item.href === '/admin')
                                ))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 capitalize">
                  {getDisplayName()}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {userRole.toLowerCase()}
                </p>
              </div>
            </div>
              <button
                onClick={handleSignOut}
                className="nav-item nav-item-inactive w-full"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="sidebar">
          {/* Logo Section - Fixed at top */}
          <div className="flex justify-center px-6 pt-6 pb-4 border-b border-gray-200">
            <Logo size="md" />
          </div>
          
          {/* Navigation Section - Separated from logo */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {groupedNavigation.map((item, index) => {
              if ('type' in item && item.type === 'separator') {
                return <hr key={`separator-${index}`} className="border-gray-200 my-2" />
              }
              
              if (!item.href) return null
              
              // Check if this is the dashboard item and if we're on the dashboard page
              const isDashboardItem = item.href === '/dashboard' || 
                                    item.href === '/faculty' || 
                                    item.href === '/supervisor' || 
                                    item.href === '/admin'
              
              const isActive = pathname === item.href || 
                              (pathname === '/dashboard' && isDashboardItem && (
                                (userRole === UserRole.STUDENT && item.href === '/dashboard') ||
                                (userRole === UserRole.FACULTY && item.href === '/faculty') ||
                                (userRole === UserRole.SUPERVISOR && item.href === '/supervisor') ||
                                (userRole === UserRole.ADMIN && item.href === '/admin')
                              ))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`nav-item ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <p 
                  className="text-sm font-medium capitalize"
                  style={{ 
                    color: userRole === 'FACULTY' ? '#2563eb' : 
                           userRole === 'ADMIN' ? '#dc2626' : 
                           userRole === 'STUDENT' ? '#ca8a04' : '#6b7280'
                  }}
                >
                  {getDisplayName()}
                </p>
                <p 
                  className="text-xs capitalize"
                  style={{ 
                    color: userRole === 'FACULTY' ? '#2563eb' : 
                           userRole === 'ADMIN' ? '#dc2626' : 
                           userRole === 'STUDENT' ? '#ca8a04' : '#6b7280'
                  }}
                >
                  {userRole.toLowerCase()}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="nav-item nav-item-inactive w-full"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <LogoCompact size="md" />
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>
    </>
  )
}
