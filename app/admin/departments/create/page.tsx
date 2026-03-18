'use client'

import { useRouter } from 'next/navigation'

export default function CreateDepartmentPage() {
  const router = useRouter()
  
  // Redirect to departments page where creation form exists
  router.replace('/admin/departments')
  
  return <div>Redirecting...</div>
}
