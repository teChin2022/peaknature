'use client'

import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function SignOutButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    // Use server-side sign out route for proper session clearing
    window.location.href = '/admin/signout'
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50/80 transition-all duration-150 mt-2 disabled:opacity-50 text-sm font-medium cursor-pointer"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      {isLoading ? 'Signing out...' : 'Sign Out'}
    </button>
  )
}

