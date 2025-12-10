'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Filter, FileText, ChevronDown, ChevronRight, Menu, X, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { UserMenu } from '@/components/UserMenu'
import { getAllDocuments, fetchBatchJobs } from '@/lib/api'
import { DocumentMetadata } from '@/types/document'
import { BatchJob, BatchJobStatus } from '@/types/batch'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'

const filterCategories = {
  tags: ['Engineering', 'Research', 'AI', 'Product', 'Planning', 'Design', 'Business', 'UX'],
}

const statusBadgeClasses: Record<BatchJobStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-700 border-amber-500/30',
  processing: 'bg-sky-500/20 text-sky-700 border-sky-500/30',
  completed: 'bg-emerald-500/20 text-emerald-700 border-emerald-500/30',
  failed: 'bg-rose-500/20 text-rose-700 border-rose-500/30',
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
  const [viewMode, setViewMode] = useState<'single' | 'batch'>('single')
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([])
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)
  const [batchRetryCount, setBatchRetryCount] = useState(0)
  const [expandedBatchJob, setExpandedBatchJob] = useState<string | null>(null)

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

  useEffect(() => {
    if (viewMode === 'single') {
      setExpandedBatchJob(null)
    }
  }, [viewMode])

  const loadBatchJobs = useCallback(async () => {
    setBatchLoading(true)
    setBatchError(null)
    try {
      const data = await fetchBatchJobs()
      setBatchJobs(data)
      setBatchRetryCount(0)
    } catch (err) {
      setBatchRetryCount(prev => prev + 1)
      setBatchError(err instanceof Error ? err.message : 'Failed to load batch jobs')
    } finally {
      setBatchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (
      viewMode !== 'batch' ||
      batchJobs.length > 0 ||
      batchLoading ||
      batchRetryCount >= 5
    ) {
      return
    }

    loadBatchJobs()
  }, [viewMode, batchJobs.length, batchLoading, batchRetryCount, loadBatchJobs])

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

  const isSingleView = viewMode === 'single'
  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString()
    } catch (err) {
      return timestamp
    }
  }

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
              <div className="p-6 space-y-6">
                <div className="space-y-3">
                  <div className="w-full bg-secondary border border-border rounded-lg p-1 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setViewMode('single')}
                      aria-pressed={viewMode === 'single'}
                      className={`flex-1 text-sm font-semibold rounded-lg transition px-3 py-2 ${
                        viewMode === 'single'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      Single File
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('batch')}
                      aria-pressed={viewMode === 'batch'}
                      className={`flex-1 text-sm font-semibold rounded-lg transition px-3 py-2 ${
                        viewMode === 'batch'
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      Batch Processing
                    </button>
                  </div>
                <div className="p-3 rounded-2xl border border-primary/30 bg-primary/10 text-primary flex items-center justify-center gap-2 font-semibold transition hover:bg-primary hover:text-primary-foreground/90">
                  <span className="text-lg leading-none">+</span>
                  <span>New Task</span>
                </div>
                </div>

                <div className="flex items-center gap-2">
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
              <h2 className="text-3xl font-bold mb-2">
                {isSingleView ? 'Document Library' : 'Batch Processing Tasks'}
              </h2>
              <p className="text-muted-foreground">
                {isSingleView
                  ? 'Manage and analyze your document structure.'
                  : 'Track batch jobs and inspect the files they produced.'}
              </p>
            </div>
            <div className="text-sm text-muted-foreground border px-3 py-1 rounded-full border-border">
              {isSingleView ? `${filteredDocuments.length} results` : `${batchJobs.length} jobs`}
            </div>
          </div>

          {/* Mobile Search */}
          {isSingleView && (
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
          )}

          {/* Document List */}
          {isSingleView ? (
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
          ) : (
            <div className="space-y-4">
              {batchLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-muted-foreground text-sm animate-pulse">Loading batch jobs...</div>
                </div>
              ) : batchError ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="text-destructive text-sm text-center">{batchError}</div>
                  <Button variant="outline" size="sm" onClick={loadBatchJobs}>
                    Retry
                  </Button>
                </div>
              ) : batchJobs.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-muted-foreground text-sm">No batch processing jobs yet.</div>
                </div>
              ) : (
                batchJobs.map((job) => (
                  <div key={job.batch_job_id} className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedBatchJob(prev => prev === job.batch_job_id ? null : job.batch_job_id)
                      }
                      className="w-full px-4 py-3 flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground truncate">{job.batch_job_id}</p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          Created {formatTimestamp(job.created_at)}
                          {' • '}
                          Updated {formatTimestamp(job.updated_at)}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClasses[job.status]}`}>
                        {job.status.toUpperCase()}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          expandedBatchJob === job.batch_job_id ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedBatchJob === job.batch_job_id && (
                      <div className="border-t border-border/60 bg-background/50">
                        {job.files.map(file => (
                          <Link
                            key={file.batch_job_file_id}
                            href={`/view?id=${encodeURIComponent(file.batch_job_file_id)}`}
                          >
                            <div className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-secondary/60 transition-colors border-b border-border/60 last:border-0">
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-sm font-semibold text-foreground truncate">
                                  {file.original_filename}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-mono truncate">
                                  {file.batch_job_file_id}
                                </p>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClasses[file.status]}`}>
                                {file.status}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
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
