import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { StaffProvider } from '@/contexts/StaffContext'
import ClientGuard from './ClientGuard'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <StaffProvider>
            <ClientGuard>{children}</ClientGuard>
          </StaffProvider>
        </AuthProvider>
      </body>
    </html>
  )
}


