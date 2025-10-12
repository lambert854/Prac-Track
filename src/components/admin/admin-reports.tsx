'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowDownTrayIcon, 
  ChartBarIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ReportData {
  totalStudents: number
  totalSupervisors: number
  totalSites: number
  totalPlacements: number
  activePlacements: number
  totalHours: number
  approvedHours: number
  pendingHours: number
  missingEvaluations: number
  studentsWithoutPlacements: number
}

interface StudentReport {
  id: string
  firstName: string
  lastName: string
  email: string
  placementCount: number
  totalHours: number
  approvedHours: number
  missingEvaluations: number
}

interface SiteReport {
  id: string
  name: string
  placementCount: number
  totalHours: number
  activeStudents: number
}

export function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<string>('overview')

  const { data: reportData, isLoading: dataLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports')
      if (!response.ok) throw new Error('Failed to fetch report data')
      return response.json()
    },
  })

  const { data: studentReports, isLoading: studentsLoading, error: studentsError } = useQuery({
    queryKey: ['admin-student-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/students')
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Student reports API error:', response.status, errorText)
        throw new Error(`Failed to fetch student reports: ${response.status}`)
      }
      return response.json()
    },
  })

  const { data: siteReports, isLoading: sitesLoading } = useQuery({
    queryKey: ['admin-site-reports'],
    queryFn: async () => {
      const response = await fetch('/api/admin/reports/sites')
      if (!response.ok) throw new Error('Failed to fetch site reports')
      return response.json()
    },
  })

  const handleExportCSV = (type: string) => {
    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'students':
        csvContent = [
          ['Student Name', 'Email', 'Placements', 'Total Hours', 'Approved Hours', 'Missing Evaluations'].join(','),
          ...studentReports.map((student: StudentReport) => [
            `${student.firstName} ${student.lastName}`,
            student.email,
            student.placementCount,
            student.totalHours,
            student.approvedHours,
            student.missingEvaluations
          ].map(field => `"${field}"`).join(','))
        ].join('\n')
        filename = 'student-reports.csv'
        break
      case 'sites':
        csvContent = [
          ['Site Name', 'Placements', 'Total Hours', 'Active Students'].join(','),
          ...siteReports.map((site: SiteReport) => [
            site.name,
            site.placementCount,
            site.totalHours,
            site.activeStudents
          ].map(field => `"${field}"`).join(','))
        ].join('\n')
        filename = 'site-reports.csv'
        break
      case 'hours':
        csvContent = [
          ['Metric', 'Value'].join(','),
          ['Total Hours', reportData?.totalHours || 0].join(','),
          ['Approved Hours', reportData?.approvedHours || 0].join(','),
          ['Pending Hours', reportData?.pendingHours || 0].join(',')
        ].join('\n')
        filename = 'hours-summary.csv'
        break
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (dataLoading || studentsLoading || sitesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (studentsError) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">System-wide analytics and reporting</p>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Reports</h3>
          <p className="text-red-700">Failed to load student reports: {studentsError.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">System-wide analytics and reporting</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportCSV('hours')}
            className="bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export Hours
          </button>
          <button
            onClick={() => handleExportCSV('students')}
            className="bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export Students
          </button>
          <button
            onClick={() => handleExportCSV('sites')}
            className="bg-yellow-400 text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Export Sites
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: ChartBarIcon },
            { id: 'students', name: 'Students', icon: UserGroupIcon },
            { id: 'sites', name: 'Sites', icon: BuildingOfficeIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                selectedReport === tab.id
                  ? 'border-yellow-400 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.totalStudents || 0}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Placement Sites</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.totalSites || 0}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.totalHours || 0}</p>
                </div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Missing Evals</p>
                  <p className="text-2xl font-bold text-gray-900">{reportData?.missingEvaluations || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Hours Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{reportData?.approvedHours || 0}</div>
                <div className="text-sm text-gray-600">Approved Hours</div>
              </div>
            </div>
            <div className="card">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600">{reportData?.pendingHours || 0}</div>
                <div className="text-sm text-gray-600">Pending Hours</div>
              </div>
            </div>
            <div className="card">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{reportData?.activePlacements || 0}</div>
                <div className="text-sm text-gray-600">Active Placements</div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h3>
            <div className="space-y-3">
              {reportData?.studentsWithoutPlacements > 0 && (
                <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {reportData.studentsWithoutPlacements} students without active placements
                    </p>
                  </div>
                </div>
              )}
              {reportData?.missingEvaluations > 0 && (
                <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {reportData.missingEvaluations} missing evaluations
                    </p>
                  </div>
                </div>
              )}
              {(!reportData?.studentsWithoutPlacements && !reportData?.missingEvaluations) && (
                <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="h-5 w-5 bg-green-600 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      All systems running smoothly
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Students Tab */}
      {selectedReport === 'students' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Reports</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Approved Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Missing Evals
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentReports && studentReports.length > 0 ? (
                  studentReports.map((student: StudentReport) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.placementCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.totalHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.approvedHours}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.missingEvaluations > 0 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {student.missingEvaluations}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {studentReports === undefined ? 'Loading student data...' : 'No student data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sites Tab */}
      {selectedReport === 'sites' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Site Reports</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Site Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Students
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {siteReports?.map((site: SiteReport) => (
                  <tr key={site.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {site.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {site.placementCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {site.totalHours}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {site.activeStudents}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
