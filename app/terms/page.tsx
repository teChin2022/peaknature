import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TermsOfServicePage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-slate-600 mb-6">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">1. Welcome to Peaknature</h2>
              <p className="text-slate-600 mb-4">
                By using Peaknature (&quot;the Platform&quot;), you agree to these Terms of Service. 
                We encourage you to read them carefully. If you have any questions, please feel free to contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">2. About Our Service</h2>
              <p className="text-slate-600 mb-4">
                Peaknature is a platform that helps property owners (&quot;Hosts&quot;) showcase their accommodations 
                and enables travelers (&quot;Guests&quot;) to discover, book, and enjoy unique stays.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">3. Your Account</h2>
              <p className="text-slate-600 mb-4">To get the most out of our Platform, we ask that you:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                <li>Create an account with accurate information</li>
                <li>Keep your login credentials secure</li>
                <li>Be at least 18 years old</li>
                <li>Take care of your account activity</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">4. For Hosts</h2>
              <p className="text-slate-600 mb-4">As a Host, we appreciate your commitment to:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                <li>Provide accurate and honest property listings</li>
                <li>Keep your property welcoming, safe, and clean</li>
                <li>Welcome guests for confirmed bookings</li>
                <li>Follow applicable local laws and regulations</li>
                <li>Pay applicable platform fees</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">5. For Guests</h2>
              <p className="text-slate-600 mb-4">As a Guest, we kindly ask that you:</p>
              <ul className="list-disc pl-6 text-slate-600 space-y-2 mb-4">
                <li>Provide accurate booking information</li>
                <li>Treat the property with care and follow house rules</li>
                <li>Complete payment as agreed</li>
                <li>Communicate respectfully with Hosts</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">6. Payments and Fees</h2>
              <p className="text-slate-600 mb-4">
                All payments are processed securely through our platform. Hosts pay platform fees as 
                outlined in their subscription plan. Guests pay the booking amount at the time of reservation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">7. Cancellation Policy</h2>
              <p className="text-slate-600 mb-4">
                Each Host sets their own cancellation policy, which is displayed on the listing. 
                We recommend reviewing the cancellation terms before booking to ensure they work for you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">8. Our Role</h2>
              <p className="text-slate-600 mb-4">
                Peaknature serves as a platform to connect Hosts and Guests. While we work hard to maintain 
                a trusted community, the relationship between Hosts and Guests is independent of us. 
                We encourage both parties to communicate clearly and review listings carefully.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">9. Account Status</h2>
              <p className="text-slate-600 mb-4">
                To keep our community safe and trusted, we may need to review accounts that appear to 
                violate these Terms. We&apos;ll always try to work with you to resolve any issues first.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">10. Updates to These Terms</h2>
              <p className="text-slate-600 mb-4">
                We may update these Terms from time to time to improve our service. We&apos;ll let you know 
                about any significant changes. Your continued use of the Platform means you&apos;re okay 
                with the updated terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">11. Questions?</h2>
              <p className="text-slate-600 mb-4">
                If you have any questions about these Terms of Service, we&apos;re here to help. 
                Please reach out to us at:
              </p>
              <p className="text-slate-600">
                Email: support@peaknature.com
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
