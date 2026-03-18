'use client'

import { useRouter } from 'next/navigation'

export default function CreateUserPage() {
  const router = useRouter()
  
  // Redirect to doctors page for now since that's where user creation happens
  router.replace('/admin/doctors')
  
  return <div>Redirecting...</div>
}
