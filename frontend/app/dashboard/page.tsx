'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, FileText, ChevronDown, ChevronRight, Menu, X, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { UserMenu } from '@/components/UserMenu'
import { getAllDocuments } from '@/lib/api'
import { DocumentMetadata } from '@/types/document'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

const filterCategories = {
  tags: ['Engineering', 'Research', 'AI', 'Product', 'Planning', 'Design', 'Business', 'UX'],
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    tags: true
  })
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({
    tags: [],
  })
  const [documents, setDocuments] = useState<DocumentMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = user?.groups?.some(g => g.toLowerCase() === 'admin') || false;

  // Fetch documents from the backend
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true)
        const data = await getAllDocuments()
        setDocuments(data)
        setError(null)
      } catch (err) {
        console.error('Failed to fetch documents:', err)
        setError('Failed to load documents. Please ensure you have proper permissions.')
      } finally {
        setLoading(false)
      }
    }

    fetchDocuments()
  }, [])

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      return { ...prev, [category]: updated }
    })
  }

  // Extract unique tags from documents for filtering
  const allTags = Array.from(new Set(documents.flatMap(doc => 
    doc.hasOutputTree ? ['Processed'] : ['Unprocessed']
  )))

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    const docTags = doc.hasOutputTree ? ['Processed'] : ['Unprocessed']
    const matchesTags = selectedFilters.tags.length === 0 || docTags.some(tag => selectedFilters.tags.includes(tag))
    return matchesSearch && matchesTags
  })

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-lg font-bold tracking-tight">DocuStructure</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-96 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-border focus-visible:ring-primary"
              />
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-72 border-r border-border bg-background h-[calc(100vh-73px)] overflow-y-auto sticky top-[73px]"
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-8">
                  <Filter className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filters</h2>
                </div>

                {/* Tags Filter */}
                <FilterCategory
                  title="Tags"
                  items={allTags}
                  expanded={expandedCategories.tags}
                  onToggle={() => toggleCategory('tags')}
                  selectedItems={selectedFilters.tags}
                  onItemToggle={(item) => toggleFilter('tags', item)}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Document Library</h2>
              <p className="text-muted-foreground">
                Manage and analyze your document structure.
              </p>
            </div>
            <div className="text-sm text-muted-foreground border px-3 py-1 rounded-full border-border">
              {filteredDocuments.length} results
            </div>
          </div>

          {/* Mobile Search */}
          <div className="relative mb-6 md:hidden">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary border-border"
            />
          </div>

          {/* Document List */}
          <div className="space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground animate-pulse">Loading documents...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-destructive text-sm text-center">{error}</div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => window.location.reload()} 
                    variant="outline"
                    size="sm"
                  >
                    Retry
                  </Button>
                  {isAdmin && (
                    <Link href="/admin">
                      <Button variant="outline" size="sm">
                        Manage Permissions
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground text-sm">No documents found</div>
              </div>
            ) : (
              filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/view?id=${doc.id}`}>
                    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-[0_0_20px_-8px_rgba(0,104,181,0.3)] transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center group-hover:bg-primary transition-colors shrink-0">
                          <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary-foreground" />
                        </div>
                        
                        {/* Title and ID */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-0.5 truncate">{doc.name}</h3>
                          <p className="text-xs text-muted-foreground font-mono">{doc.id}</p>
                        </div>
                        
                        {/* Tags */}
                        <div className="hidden md:flex flex-wrap gap-2 max-w-xs">
                          <span 
                            className={`px-2 py-0.5 border text-[10px] uppercase tracking-wide rounded whitespace-nowrap ${
                              doc.hasOutputTree 
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {doc.hasOutputTree ? 'Processed' : 'Unprocessed'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function FilterCategory({
  title,
  items,
  expanded,
  onToggle,
  selectedItems,
  onItemToggle,
}: {
  title: string
  items: string[]
  expanded: boolean
  onToggle: () => void
  selectedItems: string[]
  onItemToggle: (item: string) => void
}) {
  return (
    <div className="mb-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors group"
      >
        <span className="font-semibold">{title}</span>
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-2 pl-3">
              {items.map(item => (
                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox
                    checked={selectedItems.includes(item)}
                    onCheckedChange={() => onItemToggle(item)}
                    className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
