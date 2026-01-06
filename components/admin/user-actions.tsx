'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { 
  MoreVertical, User, Ban, CheckCircle, Loader2, 
  Mail, Phone, Calendar, Building2, Shield, Edit2 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { format, parseISO } from 'date-fns'
import { logAdminAction, AuditActions } from '@/lib/audit'

interface UserActionsProps {
  user: Profile & { tenant?: { name: string; slug: string } | null }
}

const roleColors = {
  super_admin: 'bg-purple-500',
  host: 'bg-indigo-500',
  guest: 'bg-gray-500',
}

const roleIcons = {
  super_admin: Shield,
  host: Building2,
  guest: User,
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [profileDialog, setProfileDialog] = useState(false)
  const [editRoleDialog, setEditRoleDialog] = useState(false)
  const [selectedRole, setSelectedRole] = useState(user.role)

  // Toggle block status
  const handleToggleBlock = async () => {
    setIsLoading(true)
    const newBlockStatus = !user.is_blocked
    const action = newBlockStatus ? AuditActions.USER_BLOCK : AuditActions.USER_UNBLOCK
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: newBlockStatus })
        .eq('id', user.id)
        .select()

      if (error) {
        logAdminAction(action,
          { type: 'user', id: user.id, name: user.full_name || user.email },
          { success: false, errorMessage: error.message }
        )
        alert(`Error: ${error.message}`)
        throw error
      }
      
      // Log successful action
      logAdminAction(action,
        { type: 'user', id: user.id, name: user.full_name || user.email },
        { 
          tenantId: user.tenant_id || undefined,
          oldValue: { is_blocked: user.is_blocked },
          newValue: { is_blocked: newBlockStatus }
        }
      )
      
      router.refresh()
    } catch (error) {
      console.error('Error toggling user block status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Update user role
  const handleUpdateRole = async () => {
    setIsLoading(true)
    const oldRole = user.role
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', user.id)

      if (error) {
        logAdminAction(AuditActions.USER_ROLE_CHANGE,
          { type: 'user', id: user.id, name: user.full_name || user.email },
          { success: false, errorMessage: error.message }
        )
        throw error
      }
      
      // Log successful role change
      logAdminAction(AuditActions.USER_ROLE_CHANGE,
        { type: 'user', id: user.id, name: user.full_name || user.email },
        { 
          tenantId: user.tenant_id || undefined,
          oldValue: { role: oldRole },
          newValue: { role: selectedRole }
        }
      )
      
      setEditRoleDialog(false)
      router.refresh()
    } catch (error) {
      console.error('Error updating user role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white border-gray-200">
          <DropdownMenuItem 
            onClick={() => setProfileDialog(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setEditRoleDialog(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 cursor-pointer"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Change Role
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-100" />
          <DropdownMenuItem 
            onClick={handleToggleBlock}
            disabled={isLoading}
            className={`cursor-pointer ${user.is_blocked ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
          >
            {user.is_blocked ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Unblock User
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Block User
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Profile Dialog */}
      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription className="text-gray-500">
              Detailed information about this user
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {/* User Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.full_name || 'No name'}
                </h3>
                <Badge className={`${roleColors[user.role as keyof typeof roleColors]} text-white gap-1 mt-1`}>
                  <RoleIcon className="h-3 w-3" />
                  {user.role}
                </Badge>
              </div>
            </div>

            <Separator className="bg-gray-100 my-4" />

            {/* User Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Email</Label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Phone</Label>
                  <p className="text-gray-900">{user.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Tenant</Label>
                  <p className="text-gray-900">{user.tenant?.name || 'No tenant assigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <Label className="text-gray-500 text-xs">Joined</Label>
                  <p className="text-gray-900">{format(parseISO(user.created_at), 'MMMM d, yyyy')}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-100 my-4" />

            {/* Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-gray-500 text-xs">Account Status</Label>
                <div className="mt-1">
                  {user.is_blocked ? (
                    <Badge className="bg-red-100 text-red-700 border border-red-200">
                      Blocked
                    </Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border border-green-200">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleBlock}
                disabled={isLoading}
                className={`border-gray-200 ${user.is_blocked ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user.is_blocked ? (
                  'Unblock'
                ) : (
                  'Block'
                )}
              </Button>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setProfileDialog(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={editRoleDialog} onOpenChange={setEditRoleDialog}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription className="text-gray-500">
              Update the role for {user.full_name || user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium">
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900">{user.full_name || 'No name'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="bg-gray-50 border-gray-200 text-gray-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="guest">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Guest
                    </div>
                  </SelectItem>
                  <SelectItem value="host">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Host
                    </div>
                  </SelectItem>
                  <SelectItem value="super_admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Super Admin
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setEditRoleDialog(false)}
              className="border-gray-200 text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdateRole}
              disabled={isLoading || selectedRole === user.role}
              className="bg-gray-900 hover:bg-gray-800 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

