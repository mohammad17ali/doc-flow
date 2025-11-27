'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Settings, Shield, LogOut, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { logout as logoutApi } from '@/lib/api'

export function UserMenu() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const isAdmin = user?.groups?.some(g => g.toLowerCase() === 'admin') || false

  const handleLogout = async () => {
    try {
      await logoutApi()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      logout()
      router.push('/login')
    }
  }

  const menuItems = [
    {
      label: 'Settings',
      icon: Settings,
      href: '/settings',
      show: true, // All users can see settings
    },
    {
      label: 'Admin Panel',
      icon: Shield,
      href: '/admin',
      show: isAdmin, // Only admins can see this
    },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors"
      >
        <div className="text-right hidden md:block">
          <p className="text-xs font-medium">{user?.fullName || user?.username}</p>
          <p className="text-[10px] text-muted-foreground">{user?.groups?.join(', ') || 'No groups'}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="w-4 h-4 text-primary-foreground" />
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden"
            >
              {/* User Info Section */}
              <div className="px-4 py-3 border-b border-border bg-secondary/30">
                <p className="text-sm font-medium">{user?.fullName || user?.username}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user?.groups?.map((group) => (
                    <span
                      key={group}
                      className={`px-2 py-0.5 text-xs rounded-full ${
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

              {/* Menu Items */}
              <div className="py-1">
                {menuItems
                  .filter(item => item.show)
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  ))}
              </div>

              {/* Logout Section */}
              <div className="border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 transition-colors w-full text-left"
                >
                  <LogOut className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium text-destructive">Logout</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
