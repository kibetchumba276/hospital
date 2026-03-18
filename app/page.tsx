import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Activity, Calendar, FileText, Users, Heart, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-primary-700">MediCare HMS</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Modern Healthcare Management
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Streamline your hospital operations with our comprehensive management system.
          Secure, efficient, and patient-focused.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg">
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-lg">
              Staff Login
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Comprehensive Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Calendar className="h-10 w-10 text-primary-600" />}
            title="Appointment Management"
            description="Easy online booking with real-time availability and automated reminders"
          />
          <FeatureCard
            icon={<FileText className="h-10 w-10 text-primary-600" />}
            title="Electronic Medical Records"
            description="Secure digital health records accessible to authorized personnel"
          />
          <FeatureCard
            icon={<Activity className="h-10 w-10 text-primary-600" />}
            title="e-Prescribing"
            description="Digital prescription management with pharmacy integration"
          />
          <FeatureCard
            icon={<Users className="h-10 w-10 text-primary-600" />}
            title="Patient Portal"
            description="Patients can view records, book appointments, and manage bills"
          />
          <FeatureCard
            icon={<Shield className="h-10 w-10 text-primary-600" />}
            title="HIPAA Compliant"
            description="Enterprise-grade security with role-based access control"
          />
          <FeatureCard
            icon={<Heart className="h-10 w-10 text-primary-600" />}
            title="Patient Care"
            description="Comprehensive tools for better patient outcomes"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2026 MediCare Hospital Management System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
