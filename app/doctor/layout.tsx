'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { 
  Heart, Calendar, Users, FileText, LogOut, Stethoscope,
  Pill, TestTube, Bed, Receipt, ClipboardList, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
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

      if (userData?.role !== 'doctor') {
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
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-primary-700">MediCare HMS</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">
              Dr. {user?.first_name} {user?.last_name}
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
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-1">
              <div className="pb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">Overview</p>
                <NavLink href="/doctor" icon={<Stethoscope />} label="Dashboard" />
              </div>
              
              <div className="pt-2 pb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">Patient Care</p>
                <NavLink href="/doctor/patients" icon={<Users />} label="My Patients" />
                <NavLink href="/doctor/appointments" icon={<Calendar />} label="Appointments" />
              </div>
              
              <div className="pt-2 pb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">Clinical</p>
                <NavLink href="/doctor/diagnose" icon={<ClipboardList />} label="Diagnose" />
                <NavLink href="/doctor/prescriptions" icon={<Pill />} label="Prescriptions" />
                <NavLink href="/doctor/lab-orders" icon={<TestTube />} label="Lab Orders" />
                <NavLink href="/doctor/vitals" icon={<Activity />} label="Vitals" />
                <NavLink href="/doctor/records" icon={<FileText />} label="Medical Records" />
              </div>
              
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">Operations</p>
                <NavLink href="/doctor/admissions" icon={<Bed />} label="Admissions" />
                <NavLink href="/doctor/billing" icon={<Receipt />} label="Billing" />
              </div>
            </nav>
          </aside>

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
      className="flex items-center gap-3 px-4 py-2 rounded-md hover:bg-primary-50 text-gray-700 hover:text-primary-700 transition-colors text-sm"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}
