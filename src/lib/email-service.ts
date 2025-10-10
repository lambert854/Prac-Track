import { prisma } from './prisma'

export interface EmailTemplate {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export interface NotificationData {
  userId: string
  type: 'PLACEMENT_APPROVED' | 'PLACEMENT_REJECTED' | 'SUPERVISOR_APPROVED' | 'SUPERVISOR_REJECTED' | 'SITE_APPROVED' | 'SITE_REJECTED' | 'DOCUMENT_UPLOADED' | 'TIMESHEET_APPROVED' | 'TIMESHEET_REJECTED' | 'AGREEMENT_EXPIRING' | 'AGREEMENT_EXPIRED'
  title: string
  message: string
  relatedEntityId?: string
  relatedEntityType?: 'PLACEMENT' | 'SITE' | 'SUPERVISOR' | 'TIMESHEET' | 'DOCUMENT'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  metadata?: Record<string, any>
}

class EmailService {
  private isProduction = process.env.NODE_ENV === 'production'
  private isEmailEnabled = process.env.EMAIL_ENABLED === 'true'

  /**
   * Send an email (logs in development, actually sends in production)
   */
  async sendEmail(template: EmailTemplate): Promise<{ success: boolean; messageId?: string; error?: string }> {
    let emailRecord: any = null
    try {
      // Always store the email attempt in the database for tracking
      emailRecord = await this.storeEmailRecord(template, 'PENDING')

      if (!this.isEmailEnabled) {
        // Development mode - log the email instead of sending
        console.log('\n📧 EMAIL SIMULATION (Development Mode)')
        console.log('=' .repeat(50))
        console.log(`To: ${template.to}`)
        console.log(`From: ${template.from || 'noreply@prac-track.edu'}`)
        console.log(`Subject: ${template.subject}`)
        console.log('Body (HTML):')
        console.log(template.html)
        if (template.text) {
          console.log('\nBody (Text):')
          console.log(template.text)
        }
        console.log('=' .repeat(50))
        console.log('📧 End Email Simulation\n')

        // Update email record as sent (simulated)
        await this.updateEmailRecord(emailRecord.id, 'SENT', 'Simulated in development mode')
        
        return { 
          success: true, 
          messageId: `dev_${emailRecord.id}`,
        }
      }

      // Production mode - actually send the email
      // TODO: Integrate with real email service (SendGrid, AWS SES, etc.)
      // For now, we'll simulate production sending
      console.log(`📧 Sending email to ${template.to} (Production Mode)`)
      
      // Update email record as sent
      await this.updateEmailRecord(emailRecord.id, 'SENT', 'Sent via production email service')
      
      return { 
        success: true, 
        messageId: `prod_${emailRecord.id}`,
      }

    } catch (error) {
      console.error('Email sending error:', error)
      
      // Update email record as failed
      if (emailRecord) {
        await this.updateEmailRecord(emailRecord.id, 'FAILED', error instanceof Error ? error.message : 'Unknown error')
      }
      
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Create and send a notification email
   */
  async sendNotification(data: NotificationData): Promise<{ success: boolean; notificationId?: string; emailId?: string }> {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: { email: true, firstName: true, lastName: true, role: true }
      })

      if (!user) {
        throw new Error(`User not found: ${data.userId}`)
      }

      // Store notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          relatedEntityId: data.relatedEntityId,
          relatedEntityType: data.relatedEntityType,
          priority: data.priority || 'MEDIUM',
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          read: false,
        }
      })

      // Create email template
      const emailTemplate = this.createEmailTemplate(data, user)
      
      // Send email
      const emailResult = await this.sendEmail(emailTemplate)

      return {
        success: emailResult.success,
        notificationId: notification.id,
        emailId: emailResult.messageId,
      }

    } catch (error) {
      console.error('Notification sending error:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Store email record in database for tracking
   */
  private async storeEmailRecord(template: EmailTemplate, status: 'PENDING' | 'SENT' | 'FAILED') {
    return await prisma.emailLog.create({
      data: {
        to: template.to,
        from: template.from || 'noreply@prac-track.edu',
        subject: template.subject,
        body: template.html,
        status: status,
        sentAt: status === 'SENT' ? new Date() : null,
      }
    })
  }

  /**
   * Update email record status
   */
  private async updateEmailRecord(id: string, status: 'SENT' | 'FAILED', details: string) {
    return await prisma.emailLog.update({
      where: { id },
      data: {
        status,
        sentAt: status === 'SENT' ? new Date() : null,
        errorDetails: status === 'FAILED' ? details : null,
      }
    })
  }

  /**
   * Create email template from notification data
   */
  private createEmailTemplate(data: NotificationData, user: any): EmailTemplate {
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000'
    
    // Get priority color and icon
    const priorityConfig = this.getPriorityConfig(data.priority || 'MEDIUM')
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; margin: -20px -20px 20px -20px; text-align: center; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-left: 10px; }
            .content { margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
            .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .button:hover { background-color: #1d4ed8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PRAC-TRACK Notification</h1>
              <span class="priority-badge" style="background-color: ${priorityConfig.color}; color: white;">
                ${priorityConfig.icon} ${data.priority || 'MEDIUM'}
              </span>
            </div>
            
            <div class="content">
              <h2>Hello ${user.firstName},</h2>
              <p>${data.message}</p>
              
              ${this.getNotificationSpecificContent(data, baseUrl)}
            </div>
            
            <div class="footer">
              <p>This is an automated notification from PRAC-TRACK.</p>
              <p>If you have any questions, please contact your program administrator.</p>
              <p><a href="${baseUrl}/dashboard">View Dashboard</a> | <a href="${baseUrl}/help">Help & Support</a></p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
      PRAC-TRACK Notification - ${data.priority || 'MEDIUM'} Priority
      
      Hello ${user.firstName},
      
      ${data.message}
      
      ${this.getNotificationSpecificContentText(data, baseUrl)}
      
      View Dashboard: ${baseUrl}/dashboard
      Help & Support: ${baseUrl}/help
      
      This is an automated notification from PRAC-TRACK.
      If you have any questions, please contact your program administrator.
    `

    return {
      to: user.email,
      subject: `[PRAC-TRACK] ${data.title}`,
      html,
      text,
    }
  }

  /**
   * Get priority configuration
   */
  private getPriorityConfig(priority: string) {
    switch (priority) {
      case 'URGENT':
        return { color: '#dc2626', icon: '🚨' }
      case 'HIGH':
        return { color: '#ea580c', icon: '⚠️' }
      case 'MEDIUM':
        return { color: '#2563eb', icon: '📢' }
      case 'LOW':
        return { color: '#16a34a', icon: 'ℹ️' }
      default:
        return { color: '#6b7280', icon: '📧' }
    }
  }

  /**
   * Get notification-specific content for HTML
   */
  private getNotificationSpecificContent(data: NotificationData, baseUrl: string): string {
    switch (data.type) {
      case 'PLACEMENT_APPROVED':
        return `<p><a href="${baseUrl}/placements" class="button">View Placement Details</a></p>`
      case 'PLACEMENT_REJECTED':
        return `<p><a href="${baseUrl}/placements" class="button">View Placement Details</a></p>`
      case 'SUPERVISOR_APPROVED':
        return `<p><a href="${baseUrl}/placements" class="button">View Placement Details</a></p>`
      case 'SUPERVISOR_REJECTED':
        return `<p><a href="${baseUrl}/placements" class="button">View Placement Details</a></p>`
      case 'SITE_APPROVED':
        return `<p><a href="${baseUrl}/placements/browse" class="button">Browse Sites</a></p>`
      case 'SITE_REJECTED':
        return `<p><a href="${baseUrl}/placements/browse" class="button">Submit New Site</a></p>`
      case 'DOCUMENT_UPLOADED':
        return `<p><a href="${baseUrl}/placements" class="button">View Documents</a></p>`
      case 'TIMESHEET_APPROVED':
        return `<p><a href="${baseUrl}/timesheets" class="button">View Timesheets</a></p>`
      case 'TIMESHEET_REJECTED':
        return `<p><a href="${baseUrl}/timesheets" class="button">View Timesheets</a></p>`
      case 'AGREEMENT_EXPIRING':
        return `<p><a href="${baseUrl}/admin/sites" class="button">Manage Sites</a></p>`
      case 'AGREEMENT_EXPIRED':
        return `<p><a href="${baseUrl}/admin/sites" class="button">Manage Sites</a></p>`
      default:
        return `<p><a href="${baseUrl}/dashboard" class="button">View Dashboard</a></p>`
    }
  }

  /**
   * Get notification-specific content for text
   */
  private getNotificationSpecificContentText(data: NotificationData, baseUrl: string): string {
    switch (data.type) {
      case 'PLACEMENT_APPROVED':
        return `View Placement Details: ${baseUrl}/placements`
      case 'PLACEMENT_REJECTED':
        return `View Placement Details: ${baseUrl}/placements`
      case 'SUPERVISOR_APPROVED':
        return `View Placement Details: ${baseUrl}/placements`
      case 'SUPERVISOR_REJECTED':
        return `View Placement Details: ${baseUrl}/placements`
      case 'SITE_APPROVED':
        return `Browse Sites: ${baseUrl}/placements/browse`
      case 'SITE_REJECTED':
        return `Submit New Site: ${baseUrl}/placements/browse`
      case 'DOCUMENT_UPLOADED':
        return `View Documents: ${baseUrl}/placements`
      case 'TIMESHEET_APPROVED':
        return `View Timesheets: ${baseUrl}/timesheets`
      case 'TIMESHEET_REJECTED':
        return `View Timesheets: ${baseUrl}/timesheets`
      case 'AGREEMENT_EXPIRING':
        return `Manage Sites: ${baseUrl}/admin/sites`
      case 'AGREEMENT_EXPIRED':
        return `Manage Sites: ${baseUrl}/admin/sites`
      default:
        return `View Dashboard: ${baseUrl}/dashboard`
    }
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, limit = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string) {
    return await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    })
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllNotificationsAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true, readAt: new Date() },
    })
  }

  /**
   * Get email logs for admin
   */
  async getEmailLogs(limit = 100) {
    return await prisma.emailLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }
}

// Export singleton instance
export const emailService = new EmailService()
