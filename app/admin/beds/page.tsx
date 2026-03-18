'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bed, Plus } from 'lucide-react'

type Ward = {
  id: string
  name: string
  floor_number: number
  total_beds: number
}

type BedType = {
  id: string
  ward_id: string
  bed_number: string
  bed_type: string
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  daily_rate: number
}

type BedAssignment = {
  id: string
  bed_id: string
  patient_id: string
  admitted_at: string
  discharged_at: string | null
  patients: {
    user_id: string
    users: {
      first_name: string
      last_name: string
    }
  }
}

export default function BedManagementPage() {
  const [wards, setWards] = useState<Ward[]>([])
  const [beds, setBeds] = useState<BedType[]>([])
  const [assignments, setAssignments] = useState<BedAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddWard, setShowAddWard] = useState(false)
  const [showAddBed, setShowAddBed] = useState(false)
  const [newWard, setNewWard] = useState({ name: '', floor_number: 1, total_beds: 10 })
  const [newBed, setNewBed] = useState({ ward_id: '', bed_number: '', bed_type: 'General', daily_rate: 100 })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [wardsRes, bedsRes, assignmentsRes] = await Promise.all([
        supabase.from('wards').select('*').order('floor_number'),
        supabase.from('beds').select('*').order('bed_number'),
        supabase.from('bed_assignments').select(`
          *,
          patients (
            user_id,
            users (first_name, last_name)
          )
        `).is('discharged_at', null)
      ])

      if (wardsRes.error) throw wardsRes.error
      if (bedsRes.error) throw bedsRes.error
      if (assignmentsRes.error) throw assignmentsRes.error

      setWards(wardsRes.data || [])
      setBeds(bedsRes.data || [])
      setAssignments(assignmentsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addWard() {
    try {
      const { error } = await supabase.from('wards').insert([newWard])
      if (error) throw error
      
      alert('Ward added successfully!')
      setShowAddWard(false)
      setNewWard({ name: '', floor_number: 1, total_beds: 10 })
      loadData()
    } catch (error: any) {
      alert('Error adding ward: ' + error.message)
    }
  }

  async function addBed() {
    try {
      const { error } = await supabase.from('beds').insert([{
        ...newBed,
        status: 'available'
      }])
      if (error) throw error
      
      alert('Bed added successfully!')
      setShowAddBed(false)
      setNewBed({ ward_id: '', bed_number: '', bed_type: 'General', daily_rate: 100 })
      loadData()
    } catch (error: any) {
      alert('Error adding bed: ' + error.message)
    }
  }

  async function updateBedStatus(bedId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('beds')
        .update({ status: newStatus })
        .eq('id', bedId)

      if (error) throw error
      
      alert('Bed status updated!')
      loadData()
    } catch (error: any) {
      alert('Error updating bed: ' + error.message)
    }
  }

  async function dischargeBed(assignmentId: string, bedId: string) {
    try {
      const now = new Date().toISOString()
      
      const [assignmentRes, bedRes] = await Promise.all([
        supabase.from('bed_assignments').update({ discharged_at: now }).eq('id', assignmentId),
        supabase.from('beds').update({ status: 'available' }).eq('id', bedId)
      ])

      if (assignmentRes.error) throw assignmentRes.error
      if (bedRes.error) throw bedRes.error
      
      alert('Patient discharged successfully!')
      loadData()
    } catch (error: any) {
      alert('Error discharging patient: ' + error.message)
    }
  }

  if (loading) {
    return <div className="p-6">Loading bed management...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bed Management</h1>
          <p className="text-gray-600 mt-1">Manage hospital wards and beds</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddWard(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ward
          </Button>
          <Button onClick={() => setShowAddBed(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bed
          </Button>
        </div>
      </div>

      {showAddWard && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Ward</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                placeholder="Ward Name"
                value={newWard.name}
                onChange={(e) => setNewWard({ ...newWard, name: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Floor Number"
                value={newWard.floor_number}
                onChange={(e) => setNewWard({ ...newWard, floor_number: parseInt(e.target.value) })}
              />
              <Input
                type="number"
                placeholder="Total Beds"
                value={newWard.total_beds}
                onChange={(e) => setNewWard({ ...newWard, total_beds: parseInt(e.target.value) })}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addWard}>Save Ward</Button>
              <Button variant="outline" onClick={() => setShowAddWard(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddBed && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Bed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <select
                value={newBed.ward_id}
                onChange={(e) => setNewBed({ ...newBed, ward_id: e.target.value })}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">Select Ward</option>
                {wards.map(ward => (
                  <option key={ward.id} value={ward.id}>{ward.name}</option>
                ))}
              </select>
              <Input
                placeholder="Bed Number"
                value={newBed.bed_number}
                onChange={(e) => setNewBed({ ...newBed, bed_number: e.target.value })}
              />
              <Input
                placeholder="Bed Type"
                value={newBed.bed_type}
                onChange={(e) => setNewBed({ ...newBed, bed_type: e.target.value })}
              />
              <Input
                type="number"
                placeholder="Daily Rate"
                value={newBed.daily_rate}
                onChange={(e) => setNewBed({ ...newBed, daily_rate: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addBed}>Save Bed</Button>
              <Button variant="outline" onClick={() => setShowAddBed(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {wards.map(ward => {
        const wardBeds = beds.filter(b => b.ward_id === ward.id)
        const availableCount = wardBeds.filter(b => b.status === 'available').length
        const occupiedCount = wardBeds.filter(b => b.status === 'occupied').length

        return (
          <Card key={ward.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>{ward.name}</CardTitle>
                  <p className="text-sm text-gray-600">Floor {ward.floor_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {availableCount} Available / {occupiedCount} Occupied / {wardBeds.length} Total
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                {wardBeds.map(bed => {
                  const assignment = assignments.find(a => a.bed_id === bed.id)
                  
                  return (
                    <div
                      key={bed.id}
                      className={`p-4 border-2 rounded-lg ${
                        bed.status === 'available' ? 'border-green-500 bg-green-50' :
                        bed.status === 'occupied' ? 'border-red-500 bg-red-50' :
                        bed.status === 'maintenance' ? 'border-yellow-500 bg-yellow-50' :
                        'border-blue-500 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Bed className="h-5 w-5" />
                        <span className="font-semibold">{bed.bed_number}</span>
                      </div>
                      <p className="text-sm text-gray-600">{bed.bed_type}</p>
                      <p className="text-sm font-semibold mt-1">${bed.daily_rate}/day</p>
                      <p className="text-xs mt-2 font-semibold uppercase">{bed.status}</p>
                      
                      {assignment && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-semibold">Patient:</p>
                          <p className="text-xs">
                            {assignment.patients?.users?.first_name} {assignment.patients?.users?.last_name}
                          </p>
                          <Button
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => dischargeBed(assignment.id, bed.id)}
                          >
                            Discharge
                          </Button>
                        </div>
                      )}
                      
                      {!assignment && bed.status !== 'available' && (
                        <select
                          onChange={(e) => updateBedStatus(bed.id, e.target.value)}
                          className="mt-2 w-full text-xs px-2 py-1 border rounded"
                          defaultValue={bed.status}
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="reserved">Reserved</option>
                        </select>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
