import { UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔐 Authorize function called with credentials:', credentials?.email)
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          },
          include: {
            studentProfile: true,
            facultyProfile: true,
            supervisorProfile: true,
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        // Update lastLogin timestamp
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          })
          console.log(`✅ Updated lastLogin for user: ${user.email}`)
        } catch (error) {
          console.error(`❌ Failed to update lastLogin for user ${user.email}:`, error)
        }

        // Debug logging
        console.log('Auth - User found:', {
          id: user.id,
          email: user.email,
          role: user.role,
          hasStudentProfile: !!user.studentProfile,
          studentProfile: user.studentProfile
        })

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          studentProfile: user.studentProfile,
          facultyProfile: user.facultyProfile,
          supervisorProfile: user.supervisorProfile,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.studentProfile = user.studentProfile
        token.facultyProfile = user.facultyProfile
        token.supervisorProfile = user.supervisorProfile
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as UserRole
        session.user.studentProfile = token.studentProfile
        session.user.facultyProfile = token.facultyProfile
        session.user.supervisorProfile = token.supervisorProfile
        
        // Debug logging
        console.log('Session - Token data:', {
          userId: token.sub,
          role: token.role,
          hasStudentProfile: !!token.studentProfile,
          studentProfile: token.studentProfile
        })
      }
      return session
    }
  },
  // Configure for mobile development
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}
