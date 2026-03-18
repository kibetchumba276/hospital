'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Heart, Calendar, FileText, CreditCard, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!checking) {
      checkUser()
    }
  }, [])

  async function checkUser() {
    if (checking) return
    setChecking(true)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userData?.role !== 'patient') {
        router.replace('/login')
        return
      }

      setUser(userData)
    } catch (error) {
      console.error('Auth error:', error)
      router.replace('/login')
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-primary-700">MediCare</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              {user?.first_name} {user?.last_name}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              <NavLink href="/patient" icon={<User />} label="Dashboard" />
              <NavLink href="/patient/appointments" icon={<Calendar />} label="Appointments" />
              <NavLink href="/patient/records" icon={<FileText />} label="Medical Records" />
              <NavLink href="/patient/billing" icon={<CreditCard />} label="Billing" />
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
