import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { 
  LayoutDashboard, Building2, Users, Settings, 
  BarChart3, Shield, CreditCard, Cookie, FileText
} from 'lucide-react'
import { SignOutButton } from '@/components/admin/sign-out-button'
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav'

interface AdminLayoutProps {
  children: React.ReactNode
}

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return null

  return { user, profile }
}

const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Tenants', href: '/admin/tenants', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Audit Logs', href: '/admin/audit', icon: FileText },
  { name: 'Consent Logs', href: '/admin/consent', icon: Cookie },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const adminData = await getAdminUser()
  
  // If not logged in or not super_admin, show children (for login page) or redirect
  if (!adminData) {
    // Return children directly - this allows login page to render
    // The individual pages will handle their own auth
    return <>{children}</>
  }

  const { profile } = adminData

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 hidden lg:block shadow-sm">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center border-b border-gray-100">
            <Link href="/admin" className="flex items-center gap-3 cursor-pointer">
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
                <Shield className="h-4.5 w-4.5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm tracking-tight">Homestay Admin</div>
                <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Platform Control</div>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150 text-sm font-medium group cursor-pointer"
              >
                <item.icon className="h-[18px] w-[18px] text-gray-400 group-hover:text-gray-600 transition-colors" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="p-3 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-gray-100">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-medium text-xs shadow-sm">
                {(profile.full_name || profile.email).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {profile.full_name || 'Admin'}
                </div>
                <div className="text-[11px] text-gray-400 truncate">
                  {profile.email}
                </div>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Mobile Header & Navigation */}
      <AdminMobileNav profile={{ full_name: profile.full_name, email: profile.email }} />

      {/* Main Content */}
      <main className="lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
