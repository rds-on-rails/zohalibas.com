import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import ClientGuard from './ClientGuard'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientGuard>{children}</ClientGuard>
        </AuthProvider>
      </body>
    </html>
  )
}


