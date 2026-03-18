'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Package, Plus, AlertTriangle } from 'lucide-react'

export default function PharmacistInventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    medication_name: '',
    quantity: '',
    unit: '',
    expiry_date: '',
    reorder_level: ''
  })

  useEffect(() => {
    loadInventory()
  }, [])

  async function loadInventory() {
    try {
      const { data, error } = await supabase
        .from('pharmacy_inventory')
        .select('*')
        .order('medication_name', { ascending: true })

      if (error) throw error
      setInventory(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    try {
      const { error } = await supabase
        .from('pharmacy_inventory')
        .insert(newItem)

      if (error) throw error
      
      setNewItem({
        medication_name: '',
        quantity: '',
        unit: '',
        expiry_date: '',
        reorder_level: ''
      })
      setShowAddForm(false)
      await loadInventory()
    } catch (error: any) {
      alert('Error: ' + error.message)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage pharmacy stock</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addItem} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Medication Name</label>
                  <input
                    type="text"
                    required
                    value={newItem.medication_name}
                    onChange={(e) => setNewItem({...newItem, medication_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    required
                    value={newItem.unit}
                    onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="tablets, ml, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={newItem.expiry_date}
                    onChange={(e) => setNewItem({...newItem, expiry_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    value={newItem.reorder_level}
                    onChange={(e) => setNewItem({...newItem, reorder_level: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Item</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {inventory.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No inventory items
            </CardContent>
          </Card>
        ) : (
          inventory.map((item) => {
            const isLowStock = parseInt(item.quantity) <= parseInt(item.reorder_level)
            const isExpiringSoon = new Date(item.expiry_date) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

            return (
              <Card key={item.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Package className="h-5 w-5 text-primary-600 mt-1" />
                      <div>
                        <h3 className="font-semibold text-lg">{item.medication_name}</h3>
                        <p className="text-sm text-gray-600">
                          Stock: {item.quantity} {item.unit}
                        </p>
                        <p className="text-sm text-gray-600">
                          Expiry: {new Date(item.expiry_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Reorder at: {item.reorder_level} {item.unit}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {isLowStock && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          LOW STOCK
                        </span>
                      )}
                      {isExpiringSoon && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          EXPIRING SOON
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
