'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileText, ArrowRight, Layers, FileJson, Terminal, Cpu, Database, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModeToggle } from '@/components/mode-toggle'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">DocuStructure</h1>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-xs font-medium text-muted-foreground">v2.0 is now available</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 text-balance bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">
              The intelligent way to <br /> parse documents.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 text-pretty leading-relaxed max-w-2xl mx-auto">
              Transform complex PDF documents into interactive, hierarchical JSON structures. 
              Leverage advanced parsing logic to extract semantic meaning instantly.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-base bg-foreground text-background hover:bg-foreground/90">
                  Start Building
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/view">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border hover:bg-secondary">
                  View Demo
                </Button>
              </Link>
            </div>

            <div className="mt-20 p-4 bg-card/50 border border-border rounded-xl backdrop-blur-sm shadow-2xl">
              <div className="aspect-[16/9] rounded-lg bg-background border border-border overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Layers className="w-16 h-16 text-primary mx-auto mb-4 opacity-80" />
                    <p className="text-sm text-muted-foreground font-mono">System Architecture Preview</p>
                  </div>
                </div>
                {/* Decorative UI elements */}
                <div className="absolute top-4 left-4 right-4 h-8 bg-secondary/50 rounded flex items-center px-3 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="py-24 border-t border-border/40">
        <div className="container mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Complete Parsing Toolkit</h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Our methodology combines rule-based extraction with modern PDF processing tools to deliver 99% accuracy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-border/40">
            <FeatureCard 
              icon={<Terminal className="w-6 h-6" />}
              title="Markdown Conversion"
              description="Utilizes marker-pdf to convert raw PDF binaries into clean, structured Markdown text."
            />
            <FeatureCard 
              icon={<FileText className="w-6 h-6" />}
              title="TOC Generation"
              description="Advanced pdfminer integration to extract and validate Table of Contents automatically."
            />
            <FeatureCard 
              icon={<Cpu className="w-6 h-6" />}
              title="Node Creation"
              description="Intelligent recursive algorithms create a robust node tree with parent-child tracking."
            />
            <FeatureCard 
              icon={<Database className="w-6 h-6" />}
              title="Parsing Logic"
              description="Heuristic matching of headings against TOC entries to build the semantic hierarchy."
            />
            <FeatureCard 
              icon={<FileJson className="w-6 h-6" />}
              title="JSON Output"
              description="Generates a standardized JSON schema ready for API consumption and frontend rendering."
            />
            <FeatureCard 
              icon={<Share2 className="w-6 h-6" />}
              title="Flat Export"
              description="Simultaneous generation of flat text files for legacy system compatibility."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-secondary/20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Integrations</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
                <li><Link href="#" className="hover:text-foreground">API Reference</Link></li>
                <li><Link href="#" className="hover:text-foreground">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Privacy</Link></li>
                <li><Link href="#" className="hover:text-foreground">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-border/40">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <Layers className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">DocuStructure</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 DocuStructure Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-8 border-r border-b border-border/40 hover:bg-secondary/30 transition-colors group">
      <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center mb-6 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  )
}
