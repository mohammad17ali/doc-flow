'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  User,
  Lock,
  Palette,
  Shield,
  Database,
  Settings as SettingsIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { ModeToggle } from '@/components/mode-toggle'
import { UserMenu } from '@/components/UserMenu'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'

type SettingsTab = 'profile' | 'security' | 'appearance' | 'admin'

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { user, refreshUser } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const isAdmin = user?.groups?.some(g => g.toLowerCase() === 'admin') || false

  const tabs = [
    {
      id: 'profile' as SettingsTab,
      label: 'Profile',
      icon: User,
      show: true,
    },
    {
      id: 'security' as SettingsTab,
      label: 'Security',
      icon: Lock,
      show: true,
    },
    {
      id: 'appearance' as SettingsTab,
      label: 'Appearance',
      icon: Palette,
      show: true,
    },
    {
      id: 'admin' as SettingsTab,
      label: 'Admin Settings',
      icon: Shield,
      show: isAdmin, // Only show for admins
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Settings</h1>
                <p className="text-xs text-muted-foreground">Manage your account and preferences</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className="w-64 border-r border-border bg-background min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            {tabs
              .filter(tab => tab.show)
              .map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                      activeTab === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r"
                      />
                    )}
                  </button>
                )
              })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-8 max-w-4xl">
          {activeTab === 'profile' && <ProfileSettings user={user} refreshUser={refreshUser} />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
          {activeTab === 'admin' && isAdmin && <AdminSettings />}
        </main>
      </div>
    </div>
  )
}

// Profile Settings Component
function ProfileSettings({ user, refreshUser }: { user: any; refreshUser: () => Promise<void> }) {
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [email, setEmail] = useState(user?.email || '')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSave = async () => {
    try {
      setLoading(true)
      setMessage(null)
      
      const response = await fetch(`${API_BASE_URL}/api/auth/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
        },
        body: JSON.stringify({ fullName, email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile')
      }

      // Refresh user data in context
      await refreshUser()

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFullName(user?.fullName || '')
    setEmail(user?.email || '')
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Profile Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4 bg-card border border-border rounded-lg p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Username</label>
          <Input value={user?.username || ''} disabled />
          <p className="text-xs text-muted-foreground">Username cannot be changed</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Full Name</label>
          <Input 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Groups</label>
          <div className="flex flex-wrap gap-2">
            {user?.groups?.map((group: string) => (
              <span
                key={group}
                className={`px-3 py-1 text-sm rounded-full ${
                  group.toLowerCase() === 'admin'
                    ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                    : 'bg-primary/10 text-primary border border-primary/30'
                }`}
              >
                {group}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// Security Settings Component
function SecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleUpdatePassword = async () => {
    try {
      setLoading(true)
      setMessage(null)

      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error('All fields are required')
      }

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match')
      }

      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters')
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('sessionToken')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password')
      }

      setMessage({ type: 'success', text: 'Password updated successfully!' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Security Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your password and security preferences
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300'
            : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-4 bg-card border border-border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Change Password</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Current Password</label>
          <Input 
            type="password" 
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">New Password</label>
          <Input 
            type="password" 
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password" 
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Confirm New Password</label>
          <Input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password" 
          />
        </div>

        <div className="pt-4 flex gap-3">
          <Button onClick={handleUpdatePassword} disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>Cancel</Button>
        </div>
      </div>
    </div>
  )
}

// Appearance Settings Component
function AppearanceSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Appearance Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize how the application looks
        </p>
      </div>

      <div className="space-y-4 bg-card border border-border rounded-lg p-6">
        <div>
          <h3 className="font-semibold mb-4">Theme</h3>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <p className="text-sm text-muted-foreground">Toggle between light and dark mode</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Admin Settings Component (Only visible to admins)
function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Admin Settings</h2>
        <p className="text-sm text-muted-foreground">
          Advanced settings for administrators
        </p>
      </div>

      <div className="space-y-4 bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-3 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <Shield className="w-5 h-5 text-purple-500" />
          <div>
            <p className="font-medium text-purple-700 dark:text-purple-300">Administrator Access</p>
            <p className="text-sm text-purple-600/80 dark:text-purple-400/80">
              You have elevated privileges in this application
            </p>
          </div>
        </div>

        need to add actual admin settings controls

        {/* <div className="space-y-3 pt-4">
          <h3 className="font-semibold">System Configuration</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-scan Documents</p>
              <p className="text-sm text-muted-foreground">Automatically scan for new documents daily</p>
            </div>
            <Checkbox defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Require Admin Approval</p>
              <p className="text-sm text-muted-foreground">New users require admin approval to access</p>
            </div>
            <Checkbox />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Audit Logging</p>
              <p className="text-sm text-muted-foreground">Track all user actions in the system</p>
            </div>
            <Checkbox defaultChecked />
          </div>
        </div>
  
        <div className="pt-4 border-t border-border">
          <h3 className="font-semibold mb-3">Database Management</h3>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <Database className="w-4 h-4" />
              Backup Database
            </Button>
            <Button variant="outline" className="gap-2">
              <Database className="w-4 h-4" />
              View System Logs
            </Button>
          </div>
        </div> */}

        <div className="pt-4 flex gap-3">
          <Button>Save Settings</Button>
          <Button variant="outline">Reset to Defaults</Button>
        </div>
      </div>

      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
        <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These actions can have serious consequences. Use with caution.
        </p>
        <div className="flex gap-3">
          <Button variant="destructive" size="sm">Clear All Cache</Button>
          <Button variant="destructive" size="sm">Reset All Permissions</Button>
        </div>
      </div>
    </div>
  )
}
