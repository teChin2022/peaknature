'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Menu, X, LogOut, Loader2,
  LayoutDashboard, Building2, Users, Settings, 
  BarChart3, Shield, CreditCard, Cookie
} from 'lucide-react'

// Define nav items inside the client component
const navItems = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Tenants', href: '/admin/tenants', icon: Building2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Consent Logs', href: '/admin/consent', icon: Cookie },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

interface AdminMobileNavProps {
  profile: {
    full_name?: string | null
    email: string
  }
}

export function AdminMobileNav({ profile }: AdminMobileNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = () => {
    setIsSigningOut(true)
    // Use server-side sign out route for proper session clearing
    window.location.href = '/admin/signout'
  }

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5 cursor-pointer">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold text-gray-900 block">Admin Panel</span>
              <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Platform Control</span>
            </div>
          </Link>
          
          {/* Hamburger Menu Button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-gray-100 px-3 py-2 flex-shrink-0 shadow-lg sticky top-[60px] z-30">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            
            <hr className="border-gray-100 my-2" />
            
            {/* User Info */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100">
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
            
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

