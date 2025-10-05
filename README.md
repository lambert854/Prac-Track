# The Prac-Track - Social Work Practicum Education Management System

The Prac-Track is a comprehensive web application designed to manage Practicum Education placements for social work programs. It provides tools for students, supervisors, faculty, and administrators to track placements, timesheets, evaluations, and generate reports.

## ðŸŽ¯ Features

### Core Modules
- **Sites & Placements**: Browse and request field placement sites
- **Timesheets**: Weekly hour logging with supervisor approval workflow
- **Learning Contracts & Evaluations**: Digital forms with PDF generation
- **Notifications**: Email and in-app notifications for key events
- **Reporting**: CSV exports and competency tracking
- **Role-Based Access Control**: Secure access based on user roles

### User Roles
- **STUDENT**: Log hours, submit evaluations, view progress
- **SUPERVISOR**: Approve timesheets, complete evaluations
- **FACULTY**: Manage sites, approve placements, view reports
- **ADMIN**: Full system access and user management

### Mobile-First Design
- Responsive UI optimized for mobile devices
- Touch-friendly interface with large buttons
- Fast "Add Hours" functionality for quick logging

## ðŸ› ï¸ Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS with custom Prac-Track theme
- **Database**: SQLite (development) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js with credentials provider
- **State Management**: TanStack Query
- **Forms**: React Hook Form + Zod validation
- **PDF Generation**: @react-pdf/renderer
- **Email**: Resend (with console fallback)
- **Testing**: Vitest (unit) + Playwright (E2E)

## ðŸ“‹ Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

## ðŸš€ Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd Prac-Track
npm install
```

### 2. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env.local
```

Update the following variables in `.env.local`:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (Optional - will fallback to console logging)
RESEND_API_KEY="your-resend-api-key"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access The Prac-Track.

## ðŸ‘¥ Demo Credentials

The system comes with pre-seeded demo accounts:

- **Admin**: `admin@demo.edu` / `Passw0rd!`
- **Faculty**: `faculty1@demo.edu` / `Passw0rd!`
- **Supervisor**: `supervisor1@demo.edu` / `Passw0rd!`
- **Student**: `student1@demo.edu` / `Passw0rd!`

## ðŸŽ¨ Branding

The Prac-Track features a distinctive logo with:
- **Dark blue circular icon** with white symbols
- **Location pin** representing field placements
- **Person figure** representing students and professionals
- **Open book** representing education and learning
- **Clean typography** with "The Prac-Track" branding

## ðŸ“± Mobile Experience

The Prac-Track is designed with mobile-first principles:
- Responsive design that works on all screen sizes
- Touch-friendly interface with appropriately sized buttons
- Optimized forms for mobile data entry
- Fast loading and smooth interactions

## ðŸ”§ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run db:studio    # Open Prisma Studio
```

### Database Management

```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database
```

## ðŸš€ Deployment

### Option 1: Vercel + Neon (Recommended)

1. **Deploy to Vercel**:
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard
   - Deploy automatically on push

2. **Set up Neon Database**:
   - Create a Neon account and database
   - Update `DATABASE_URL` in Vercel environment variables
   - Run migrations: `npm run db:migrate`

### Option 2: Cloudflare Pages + Workers

1. **Deploy to Cloudflare Pages**:
   - Connect repository to Cloudflare Pages
   - Set build command: `npm run build`
   - Set output directory: `.next`

2. **Configure Workers**:
   - Set up Cloudflare Workers for API routes
   - Configure environment variables

## ðŸ§ª Testing

The Prac-Track includes comprehensive testing:

- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright for user flow testing

Run tests with:
```bash
npm run test         # Unit tests
npm run test:e2e     # End-to-end tests
```

## ðŸ“Š Features Overview

### For Students
- Browse available field placement sites
- Request placements and track approval status
- Log weekly hours with detailed descriptions
- Complete learning contracts and evaluations
- View progress reports and hour summaries

### For Supervisors
- Review and approve student timesheets
- Complete midterm and final evaluations
- Track student progress and performance
- Access placement information and requirements

### For Faculty
- Manage field placement sites
- Approve or decline placement requests
- Assign students to faculty advisors
- Generate reports and track program outcomes
- Oversee the entire Practicum Education process

### For Administrators
- Full system access and user management
- Create and manage user accounts
- Configure system settings
- Access comprehensive reporting tools
- Monitor system usage and performance

## ðŸ”’ Security

The Prac-Track implements several security measures:
- Role-based access control (RBAC)
- Secure authentication with NextAuth.js
- Password hashing with bcrypt
- Input validation with Zod schemas
- SQL injection protection with Prisma
- HTTPS enforcement in production

## ðŸ¤ Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## ðŸ“„ License

This project is licensed under the MIT License - see the LICENSE file for details.

## ðŸ†˜ Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the demo credentials for testing

---

**The Prac-Track** - Empowering Social Work Practicum Education Management
