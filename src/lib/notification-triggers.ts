import { emailService } from './email-service'

/**
 * Notification triggers for common application events
 * These functions can be called throughout the application to send notifications
 */

export class NotificationTriggers {
  /**
   * Send notification when a placement is approved
   */
  static async placementApproved(placementId: string, studentId: string, siteName: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'PLACEMENT_APPROVED',
      title: 'Placement Approved',
      message: `Your placement at ${siteName} has been approved by your faculty liaison. You can now proceed with your placement activities.`,
      relatedEntityId: placementId,
      relatedEntityType: 'PLACEMENT',
      priority: 'HIGH',
      metadata: { siteName, placementId }
    })
  }

  /**
   * Send notification when a placement is rejected
   */
  static async placementRejected(placementId: string, studentId: string, siteName: string, reason?: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'PLACEMENT_REJECTED',
      title: 'Placement Rejected',
      message: `Your placement at ${siteName} has been rejected. ${reason ? `Reason: ${reason}` : 'Please contact your faculty liaison for more information.'}`,
      relatedEntityId: placementId,
      relatedEntityType: 'PLACEMENT',
      priority: 'HIGH',
      metadata: { siteName, placementId, reason }
    })
  }

  /**
   * Send notification when a supervisor is approved
   */
  static async supervisorApproved(placementId: string, studentId: string, supervisorName: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'SUPERVISOR_APPROVED',
      title: 'Supervisor Approved',
      message: `Your requested supervisor ${supervisorName} has been approved and can now access the system.`,
      relatedEntityId: placementId,
      relatedEntityType: 'PLACEMENT',
      priority: 'MEDIUM',
      metadata: { supervisorName, placementId }
    })
  }

  /**
   * Send notification when a supervisor is rejected
   */
  static async supervisorRejected(placementId: string, studentId: string, supervisorName: string, reason?: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'SUPERVISOR_REJECTED',
      title: 'Supervisor Rejected',
      message: `Your requested supervisor ${supervisorName} has been rejected. ${reason ? `Reason: ${reason}` : 'Please contact your faculty liaison for more information.'}`,
      relatedEntityId: placementId,
      relatedEntityType: 'PLACEMENT',
      priority: 'HIGH',
      metadata: { supervisorName, placementId, reason }
    })
  }

  /**
   * Send notification when a site is approved
   */
  static async siteApproved(siteId: string, studentId: string, siteName: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'SITE_APPROVED',
      title: 'Site Approved',
      message: `Your submitted site "${siteName}" has been approved and is now available for placement requests.`,
      relatedEntityId: siteId,
      relatedEntityType: 'SITE',
      priority: 'MEDIUM',
      metadata: { siteName, siteId }
    })
  }

  /**
   * Send notification when a site is rejected
   */
  static async siteRejected(siteId: string, studentId: string, siteName: string, reason?: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'SITE_REJECTED',
      title: 'Site Rejected',
      message: `Your submitted site "${siteName}" has been rejected. ${reason ? `Reason: ${reason}` : 'Please contact your program administrator for more information.'}`,
      relatedEntityId: siteId,
      relatedEntityType: 'SITE',
      priority: 'MEDIUM',
      metadata: { siteName, siteId, reason }
    })
  }

  /**
   * Send notification when a document is uploaded
   */
  static async documentUploaded(placementId: string, studentId: string, facultyId: string, documentType: string) {
    // Notify student
    await emailService.sendNotification({
      userId: studentId,
      type: 'DOCUMENT_UPLOADED',
      title: 'Document Uploaded',
      message: `Your ${documentType} has been successfully uploaded and is available for faculty review.`,
      relatedEntityId: placementId,
      relatedEntityType: 'DOCUMENT',
      priority: 'LOW',
      metadata: { documentType, placementId }
    })

    // Notify faculty
    await emailService.sendNotification({
      userId: facultyId,
      type: 'DOCUMENT_UPLOADED',
      title: 'New Document Uploaded',
      message: `A student has uploaded a new ${documentType}. Please review the document when convenient.`,
      relatedEntityId: placementId,
      relatedEntityType: 'DOCUMENT',
      priority: 'MEDIUM',
      metadata: { documentType, placementId }
    })
  }

  /**
   * Send notification when a timesheet is submitted to supervisor
   */
  static async timesheetSubmitted(placementId: string, supervisorId: string, studentName: string, siteName: string, weekRange: string, totalHours: number, entryCount: number) {
    return await emailService.sendNotification({
      userId: supervisorId,
      type: 'DOCUMENT_UPLOADED', // Using existing type as TIMESHEET_SUBMITTED doesn&apos;t exist
      title: 'Timesheet Submitted for Review',
      message: `${studentName} has submitted a timesheet for ${siteName} (${weekRange}). Total: ${totalHours} hours across ${entryCount} entries. Please review and approve.`,
      relatedEntityId: placementId,
      relatedEntityType: 'TIMESHEET',
      priority: 'MEDIUM',
      metadata: { studentName, siteName, weekRange, totalHours, entryCount, placementId }
    })
  }

  /**
   * Send notification when a timesheet is approved by supervisor (to faculty)
   */
  static async timesheetSupervisorApproved(timesheetId: string, facultyId: string, studentName: string, supervisorName: string, hours: number) {
    return await emailService.sendNotification({
      userId: facultyId,
      type: 'TIMESHEET_APPROVED', // Reusing existing type
      title: 'Timesheet Approved by Supervisor',
      message: `${supervisorName} has approved ${studentName}&apos;s timesheet with ${hours} hours. Please review and provide final approval.`,
      relatedEntityId: timesheetId,
      relatedEntityType: 'TIMESHEET',
      priority: 'MEDIUM',
      metadata: { studentName, supervisorName, hours, timesheetId }
    })
  }

  /**
   * Send notification when a timesheet is finally approved by faculty (to student)
   */
  static async timesheetFinalApproved(timesheetId: string, studentId: string, facultyName: string, hours: number) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'TIMESHEET_APPROVED',
      title: 'Timesheet Final Approval',
      message: `Your timesheet with ${hours} hours has been approved by ${facultyName}. Your total hours have been updated.`,
      relatedEntityId: timesheetId,
      relatedEntityType: 'TIMESHEET',
      priority: 'LOW',
      metadata: { facultyName, hours, timesheetId }
    })
  }

  /**
   * Send notification when a timesheet is approved (generic)
   */
  static async timesheetApproved(timesheetId: string, studentId: string, approverName: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'TIMESHEET_APPROVED',
      title: 'Timesheet Approved',
      message: `Your timesheet has been approved by ${approverName}.`,
      relatedEntityId: timesheetId,
      relatedEntityType: 'TIMESHEET',
      priority: 'LOW',
      metadata: { approverName, timesheetId }
    })
  }

  /**
   * Send notification when a timesheet is rejected
   */
  static async timesheetRejected(timesheetId: string, studentId: string, approverName: string, reason?: string) {
    return await emailService.sendNotification({
      userId: studentId,
      type: 'TIMESHEET_REJECTED',
      title: 'Timesheet Rejected',
      message: `Your timesheet has been rejected by ${approverName}. ${reason ? `Reason: ${reason}` : 'Please review and resubmit.'}`,
      relatedEntityId: timesheetId,
      relatedEntityType: 'TIMESHEET',
      priority: 'MEDIUM',
      metadata: { approverName, timesheetId, reason }
    })
  }

  /**
   * Send notification when an agreement is expiring soon
   */
  static async agreementExpiring(siteId: string, adminId: string, siteName: string, daysUntilExpiry: number) {
    return await emailService.sendNotification({
      userId: adminId,
      type: 'AGREEMENT_EXPIRING',
      title: 'Agreement Expiring Soon',
      message: `The agreement for ${siteName} expires in ${daysUntilExpiry} days. Please take action to renew the agreement.`,
      relatedEntityId: siteId,
      relatedEntityType: 'SITE',
      priority: daysUntilExpiry <= 7 ? 'URGENT' : 'HIGH',
      metadata: { siteName, siteId, daysUntilExpiry }
    })
  }

  /**
   * Send notification when an agreement has expired
   */
  static async agreementExpired(siteId: string, adminId: string, siteName: string) {
    return await emailService.sendNotification({
      userId: adminId,
      type: 'AGREEMENT_EXPIRED',
      title: 'Agreement Expired',
      message: `The agreement for ${siteName} has expired. Please renew the agreement immediately to continue using this site.`,
      relatedEntityId: siteId,
      relatedEntityType: 'SITE',
      priority: 'URGENT',
      metadata: { siteName, siteId }
    })
  }
}
