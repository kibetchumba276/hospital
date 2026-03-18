'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Heart, Pill, FileText, LogOut, Package, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PharmacistLayout({ children }: { children: React.ReactNode }) {
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

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError || !userData) {
        console.error('Error fetching user:', userError)
        router.replace('/login')
        return
      }

      if (userData?.role !== 'super_admin' && userData?.role !== 'pharmacist') {
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
            <span className="text-2xl font-bold text-primary-700">MediCare - Pharmacy</span>
          </div>
          <div className="flex items-center gap-4">
            {user?.role === 'super_admin' && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    router.push(e.target.value)
                  }
                }}
                className="px-3 py-2 border rounded-md text-sm"
                defaultValue=""
              >
                <option value="">Switch View...</option>
                <option value="/admin">Admin Dashboard</option>
                <option value="/doctor">Doctor Dashboard</option>
                <option value="/nurse">Nurse Dashboard</option>
                <option value="/receptionist">Receptionist Dashboard</option>
                <option value="/pharmacist">Pharmacist Dashboard</option>
                <option value="/patient">Patient Dashboard</option>
              </select>
            )}
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
          <aside className="md:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4 space-y-1">
              <NavLink href="/pharmacist" icon={<Pill />} label="Dashboard" />
              <NavLink href="/pharmacist/prescriptions" icon={<FileText />} label="Prescriptions" />
              <NavLink href="/pharmacist/inventory" icon={<Package />} label="Inventory" />
              <NavLink href="/pharmacist/dispense" icon={<ShoppingCart />} label="Dispense" />
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
