import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight">
              <span className="text-blue-600">Peak</span>
              <span className="text-emerald-500">nature</span>
              <span className="text-slate-400 font-normal">.com</span>
            </span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-24 pb-16 px-4 sm:pt-28 sm:pb-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Introduction</h2>
              <p className="text-slate-600 mb-4">
                Welcome to Peaknature (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We value your trust and are committed to 
                protecting your personal information and respecting your privacy. This Privacy Policy explains how we 
                collect, use, and safeguard your information when you use our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. Information We Collect</h2>
              <p className="text-slate-600 mb-4">We collect information that you choose to provide to us, including:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                <li>Account information (name, email, phone number)</li>
                <li>Property information for hosts</li>
                <li>Booking and reservation details</li>
                <li>Payment information</li>
                <li>Messages and communications through our platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-slate-600 mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you helpful updates, tips, and support messages</li>
                <li>Respond to your questions and feedback</li>
                <li>Help maintain a safe and trusted community</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. Information Sharing</h2>
              <p className="text-slate-600 mb-4">
                We respect your privacy and do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                <li>Property hosts (to facilitate your booking)</li>
                <li>Trusted service providers who help us operate</li>
                <li>Authorities when required by applicable law</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. Data Security</h2>
              <p className="text-slate-600 mb-4">
                We take the security of your data seriously. We use appropriate technical and organizational measures 
                to help protect your personal information and keep it safe.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Your Rights</h2>
              <p className="text-slate-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                <li>Access your personal information</li>
                <li>Update or correct your data</li>
                <li>Request deletion of your data</li>
                <li>Choose how your data is used</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Cookies</h2>
              <p className="text-slate-600 mb-4">
                We use cookies to improve your experience on our platform. You can manage your cookie preferences 
                through your browser settings or our cookie consent options.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Contact Us</h2>
              <p className="text-slate-600 mb-4">
                If you have any questions about this Privacy Policy or how we handle your data, 
                we&apos;re happy to help. Please reach out to us at:
              </p>
              <p className="text-slate-600">
                Email: privacy@peaknature.com
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm">© {new Date().getFullYear()} Peaknature. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
