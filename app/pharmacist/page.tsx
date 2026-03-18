'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Pill, Package, ShoppingCart, AlertTriangle } from 'lucide-react'

export default function PharmacistDashboard() {
  const [stats, setStats] = useState({
    pendingPrescriptions: 0,
    dispensedToday: 0,
    lowStock: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      // Get pending prescriptions count
      const { count: prescriptionsCount } = await supabase
        .from('prescriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      setStats((prev) => ({ ...prev, pendingPrescriptions: prescriptionsCount || 0 }))
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Pharmacist Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Manage prescriptions and inventory.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <StatCard
          icon={<Pill className="h-8 w-8 text-primary-600" />}
          title="Pending Prescriptions"
          value={stats.pendingPrescriptions}
        />
        <StatCard
          icon={<ShoppingCart className="h-8 w-8 text-green-600" />}
          title="Dispensed Today"
          value={stats.dispensedToday}
        />
        <StatCard
          icon={<AlertTriangle className="h-8 w-8 text-orange-600" />}
          title="Low Stock Items"
          value={stats.lowStock}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <a href="/pharmacist/prescriptions" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Pill className="h-6 w-6 text-primary-600 mb-2" />
              <h3 className="font-semibold">View Prescriptions</h3>
              <p className="text-sm text-gray-600">Process pending prescriptions</p>
            </a>
            <a href="/pharmacist/inventory" className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <Package className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold">Manage Inventory</h3>
              <p className="text-sm text-gray-600">Update stock levels</p>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, title, value }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}
