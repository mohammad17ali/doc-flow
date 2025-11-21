'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Layers, ChevronDown, Download, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Document, Page, pdfjs } from 'react-pdf'
import * as Accordion from '@radix-ui/react-accordion'
import { ModeToggle } from '@/components/mode-toggle'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getDocumentById } from '@/lib/api'
import { DocumentStructure } from '@/types/document'
import 'react-pdf/dist/esm/Page/AnnotationLayer.css'
import 'react-pdf/dist/esm/Page/TextLayer.css'

// Polyfill for Promise.withResolvers if not available
if (typeof Promise !== 'undefined' && !Promise.withResolvers) {
  Promise.withResolvers = function <T>() {
    let resolve: (value: T | PromiseLike<T>) => void;
    let reject: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve: resolve!, reject: reject! };
  };
}

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type ContentType = 'text' | 'table' | 'image'

interface ContentItem {
  type: ContentType
  content: string
}

interface DocumentNode {
  content: ContentItem[]
  children: Array<Record<string, DocumentNode>>
}

interface DocumentStructure {
  root: DocumentNode
}

export default function ViewPage() {
  const searchParams = useSearchParams()
  const documentId = searchParams.get('id')
  
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const pdfContainerRef = useRef<HTMLDivElement>(null)
  const jsonContainerRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [leftWidth, setLeftWidth] = useState(50)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [documentData, setDocumentData] = useState<DocumentStructure | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string>('')

  useEffect(() => {
    // Fetch the document structure from the backend
    const fetchDocument = async () => {
      if (!documentId) {
        setError('No document ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getDocumentById(documentId)
        setDocumentData(data)
        
        // Set the PDF URL based on the document ID
        setPdfUrl(`/pdfs/${documentId}.pdf`)
        
        setError(null)
      } catch (err) {
        console.error('Failed to load document structure:', err)
        setError('Failed to load document. Please ensure the backend server is running.')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [documentId])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
  }

  const handleExport = () => {
    if (!documentData) return
    const dataStr = JSON.stringify(documentData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'document-structure.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
      
      // Constrain between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftWidth(newLeftWidth)
      }
    }

    const handleMouseUp = () => {
      isDragging.current = false
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    const pdfContainer = pdfContainerRef.current
    const jsonContainer = jsonContainerRef.current

    if (!pdfContainer || !jsonContainer) return

    let scrollTimeout: NodeJS.Timeout

    const handlePdfScroll = () => {
      if (isScrolling) return
      setIsScrolling(true)

      const pdfScrollPercentage = pdfContainer.scrollTop / (pdfContainer.scrollHeight - pdfContainer.clientHeight)
      const jsonScrollTarget = pdfScrollPercentage * (jsonContainer.scrollHeight - jsonContainer.clientHeight)
      
      jsonContainer.scrollTop = jsonScrollTarget

      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150)
    }

    const handleJsonScroll = () => {
      if (isScrolling) return
      setIsScrolling(true)

      const jsonScrollPercentage = jsonContainer.scrollTop / (jsonContainer.scrollHeight - jsonContainer.clientHeight)
      const pdfScrollTarget = jsonScrollPercentage * (pdfContainer.scrollHeight - pdfContainer.clientHeight)
      
      pdfContainer.scrollTop = pdfScrollTarget

      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150)
    }

    pdfContainer.addEventListener('scroll', handlePdfScroll)
    jsonContainer.addEventListener('scroll', handleJsonScroll)

    return () => {
      pdfContainer.removeEventListener('scroll', handlePdfScroll)
      jsonContainer.removeEventListener('scroll', handleJsonScroll)
      clearTimeout(scrollTimeout)
    }
  }, [isScrolling])

  return (
    <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="hover:bg-secondary">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="h-6 w-px bg-border mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <Layers className="w-3 h-3 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">
                {documentId || 'Document Viewer'}
              </h1>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <ModeToggle />
           <Button 
             onClick={handleExport}
             variant="outline" 
             size="sm" 
             className="h-8 text-xs border-border bg-secondary/50 hover:bg-secondary"
           >
             <Download className="w-3 h-3 mr-1.5" />
             Export JSON
           </Button>
        </div>
      </header>

      {/* Split View Container */}
      <div className="flex-1 flex overflow-hidden" ref={containerRef}>
        {/* Left Panel - JSON Structure */}
        <div 
          className="bg-background overflow-auto" 
          ref={jsonContainerRef}
          style={{ width: `${leftWidth}%` }}
        >
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between">
             <span className="text-xs font-mono text-muted-foreground">STRUCTURED DATA</span>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-muted-foreground animate-pulse">Loading document structure...</div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-destructive text-sm">{error}</div>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            ) : documentData ? (
              <JsonAccordion node={documentData.root} depth={0} title="Document Root" />
            ) : (
              <div className="text-muted-foreground text-sm">No document data available</div>
            )}
          </div>
        </div>

        {/* Draggable Divider */}
        <div 
          className="w-1 bg-border hover:bg-primary cursor-col-resize relative group flex-shrink-0"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 flex items-center justify-center">
            <div className="w-6 h-12 bg-secondary border border-border rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Viewer */}
        <div 
          className="border-l border-border bg-secondary/20 overflow-auto relative" 
          ref={pdfContainerRef}
          style={{ width: `${100 - leftWidth}%` }}
        >
          <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border px-4 py-2 flex justify-between items-center">
             <span className="text-xs font-mono text-muted-foreground">SOURCE PDF</span>
             <span className="text-xs font-mono text-muted-foreground">{pageNumber} / {numPages}</span>
          </div>
          <div className="p-8 flex justify-center min-h-full">
            <div className="shadow-2xl">
              {pdfUrl ? (
                <Document
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center h-96 w-full">
                      <div className="text-muted-foreground text-sm animate-pulse">Loading PDF...</div>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center h-96 w-full gap-4">
                      <div className="text-destructive text-sm">Failed to load PDF</div>
                      <div className="text-muted-foreground text-xs">
                        Make sure {documentId}.pdf exists in the public/pdfs folder
                      </div>
                    </div>
                  }
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="mb-8 shadow-lg"
                      width={600}
                    />
                  ))}
                </Document>
              ) : (
                <div className="flex items-center justify-center h-96 w-full">
                  <div className="text-muted-foreground text-sm">No PDF available</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function JsonAccordion({ node, depth = 0, title }: { node: DocumentNode; depth?: number; title: string }) {
  // Define color schemes for each level (up to 5 levels)
  const levelColors = [
    { 
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      border: 'border-blue-500/30 dark:border-blue-500/40',
      hover: 'hover:bg-blue-500/20 dark:hover:bg-blue-500/30',
      dot: 'bg-blue-500',
      text: 'group-hover:text-blue-500'
    },
    { 
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      border: 'border-violet-500/30 dark:border-violet-500/40',
      hover: 'hover:bg-violet-500/20 dark:hover:bg-violet-500/30',
      dot: 'bg-violet-500',
      text: 'group-hover:text-violet-500'
    },
    { 
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      hover: 'hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30',
      dot: 'bg-emerald-500',
      text: 'group-hover:text-emerald-500'
    },
    { 
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      hover: 'hover:bg-amber-500/20 dark:hover:bg-amber-500/30',
      dot: 'bg-amber-500',
      text: 'group-hover:text-amber-500'
    },
    { 
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      border: 'border-rose-500/30 dark:border-rose-500/40',
      hover: 'hover:bg-rose-500/20 dark:hover:bg-rose-500/30',
      dot: 'bg-rose-500',
      text: 'group-hover:text-rose-500'
    }
  ]

  const colors = levelColors[depth % levelColors.length]

  const getTagStyles = (type: ContentType) => {
    switch (type) {
      case 'text':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
      case 'table':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      case 'image':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const hasChildren = node.children && node.children.length > 0
  const hasContent = node.content && node.content.length > 0

  return (
    <div className={depth > 0 ? 'ml-4 pl-4 border-l border-border/50 mt-2' : ''}>
      <Accordion.Root type="single" collapsible className="mb-2">
        <Accordion.Item value={title} className={`border ${colors.border} rounded-lg ${colors.bg} overflow-hidden transition-all`}>
          <Accordion.Header>
            <Accordion.Trigger className={`flex items-center justify-between w-full px-4 py-3 text-left ${colors.hover} transition-colors group`}>
              <div className="flex items-center gap-2 flex-1">
                <div className={`w-2 h-2 rounded-full ${colors.dot} transition-transform group-data-[state=open]:scale-125`}></div>
                <span className={`font-mono text-sm font-medium text-foreground ${colors.text} transition-colors`}>
                  {title}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="px-4 pb-4 pt-2 data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            {hasContent && (
              <div className="space-y-3 mb-4">
                {node.content.map((item: ContentItem, idx: number) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-md border ${colors.border} ${colors.bg} bg-opacity-50 overflow-hidden min-w-0`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${getTagStyles(item.type)}`}>
                        {item.type.toUpperCase()}
                      </span>
                    </div>
                    <div className="markdown-content-box overflow-x-auto overflow-y-hidden">
                      <div className="prose prose-sm max-w-full dark:prose-invert prose-p:m-0 prose-headings:m-0 prose-ul:m-0 prose-ol:m-0 prose-li:m-0 prose-blockquote:m-0 prose-pre:m-0">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0 word-break break-words">{children}</p>,
                          ul: ({ children }) => <ul className="mb-2 last:mb-0 pl-4 word-break break-words">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-2 last:mb-0 pl-4 word-break break-words">{children}</ol>,
                          blockquote: ({ children }) => <blockquote className="mb-2 last:mb-0 border-l-4 border-muted-foreground/20 pl-4 italic word-break break-words">{children}</blockquote>,
                          code: ({ children, className, ...props }) => {
                            const isInline = !className?.includes('language-')
                            return isInline ? (
                              <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono word-break break-all" {...props}>
                                {children}
                              </code>
                            ) : (
                              <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto my-2">
                                <code className="word-break break-all" {...props}>
                                  {children}
                                </code>
                              </pre>
                            )
                          },
                          table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full">{children}</table></div>,
                          th: ({ children }) => <th className="border px-2 py-1 text-left font-semibold bg-muted/50">{children}</th>,
                          td: ({ children }) => <td className="border px-2 py-1 word-break break-words">{children}</td>,
                        }}
                        >
                          {item.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hasChildren && (
              <div className="space-y-2">
                {node.children.map((childObj: Record<string, DocumentNode>, idx: number) => {
                  const childKey = Object.keys(childObj)[0]
                  const childNode = childObj[childKey]
                  return (
                    <JsonAccordion 
                      key={idx} 
                      node={childNode} 
                      depth={depth + 1} 
                      title={childKey}
                    />
                  )
                })}
              </div>
            )}
          </Accordion.Content>
        </Accordion.Item>
      </Accordion.Root>
    </div>
  )
}
