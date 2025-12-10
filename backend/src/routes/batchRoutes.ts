import { Router, Request, Response } from 'express'
import path from 'path'
import fs from 'fs/promises'
import { authenticate } from '../middleware/auth'
import { BATCH_OUTPUTS_DIR } from '../config/paths'

const router = Router()

// Protect batch job routes
router.use(authenticate)

interface NormalizedBatchJobFile {
  batch_job_file_id: string
  status: string
  original_filename: string
  format: string
  params: Record<string, any>
}

interface NormalizedBatchJob {
  batch_job_id: string
  status: string
  user: string
  created_at: string
  updated_at: string
  params: Record<string, any>
  files: NormalizedBatchJobFile[]
}

const normalizeStatus = (batchJobId: string, parsed: any): NormalizedBatchJob => ({
  batch_job_id: parsed.job_id ?? batchJobId,
  status: parsed.status ?? 'pending',
  user: parsed.user ?? '',
  created_at: parsed.created_at ?? '',
  updated_at: parsed.updated_at ?? '',
  params: parsed.params ?? {},
  files: Array.isArray(parsed.files)
    ? parsed.files.map((file: any) => ({
        batch_job_file_id: file.file_id,
        status: file.status,
        original_filename: file.original_filename,
        format: file.format,
        params: file.params ?? {},
      }))
    : [],
})

const readStatusFile = async (batchJobId: string) => {
  const statusFilePath = path.join(BATCH_OUTPUTS_DIR, batchJobId, 'status.json')
  const fileContents = await fs.readFile(statusFilePath, 'utf-8')
  const parsed = JSON.parse(fileContents)
  return normalizeStatus(batchJobId, parsed)
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const entries = await fs.readdir(BATCH_OUTPUTS_DIR, { withFileTypes: true })
    const batchJobs = await Promise.all(
      entries
        .filter(entry => entry.isDirectory())
        .map(async (entry) => {
          try {
            return await readStatusFile(entry.name)
          } catch (error) {
            return null
          }
        }),
    )

    return res.json({
      success: true,
      data: batchJobs.filter((job): job is ReturnType<typeof normalizeStatus> => Boolean(job)),
    })
  } catch (error) {
    console.error('Failed to list batch outputs:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to list batch jobs',
      message: (error as Error).message,
    })
  }
})

router.get('/:batchJobId/status', async (req: Request, res: Response) => {
  const { batchJobId } = req.params

  if (!batchJobId) {
    return res.status(400).json({
      success: false,
      error: 'Batch job ID is required',
    })
  }

  if (batchJobId.includes('..')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid batch job ID',
    })
  }

  try {
    const normalized = await readStatusFile(batchJobId)
    return res.json({
      success: true,
      data: normalized,
    })
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Batch job not found',
      })
    }

    console.error('Failed to read batch job status:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to read batch job status',
      message: (error as Error).message,
    })
  }
})

/**
 * Helper function to extract batch job ID from a file ID
 * File IDs look like: ALI10-1765274389.518018:pdf1.pdf or ALIX-1765262688.3141365:ts1.pdf
 * Batch job ID would be: ALI10-1765274389.518018 or ALIX-1765262688.3141365
 */
const extractBatchJobIdFromFileId = (fileId: string): string | null => {
  // Match pattern: {batch_job_id}:{filename}
  // Extract everything before the first colon as the batch job ID
  const colonIndex = fileId.indexOf(':')
  if (colonIndex === -1) return null
  return fileId.substring(0, colonIndex)
}

/**
 * Convert file ID to folder name
 * File IDs use colons (e.g., ALI10-1765274389.518018:pdf1.pdf)
 * Folder names use underscores (e.g., ALI10-1765274389.518018_pdf1.pdf)
 */
const fileIdToFolderName = (fileId: string): string => {
  // Replace the first colon after the batch job ID with underscore
  // Pattern: {batch_job_id}:filename -> {batch_job_id}_filename
  return fileId.replace(/:/, '_')
}

/**
 * GET /api/batch_jobs/files/:fileId/structure
 * Get the document structure (output_tree.json) for a batch job file
 */
router.get('/files/:fileId/structure', async (req: Request, res: Response) => {
  const { fileId } = req.params

  if (!fileId) {
    return res.status(400).json({
      success: false,
      error: 'File ID is required',
    })
  }

  // Security check: prevent directory traversal
  if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file ID',
    })
  }

  // Extract batch job ID from file ID
  const batchJobId = extractBatchJobIdFromFileId(fileId)
  if (!batchJobId) {
    return res.status(400).json({
      success: false,
      error: 'Could not determine batch job ID from file ID',
    })
  }

  // Convert file ID to folder name (colon -> underscore)
  const folderName = fileIdToFolderName(fileId)

  // Construct the path to output_tree.json
  const structurePath = path.join(BATCH_OUTPUTS_DIR, batchJobId, folderName, 'output', 'processing', 'output_tree.json')

  try {
    const fileContents = await fs.readFile(structurePath, 'utf-8')
    const structure = JSON.parse(fileContents)
    return res.json({
      success: true,
      data: structure,
    })
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Document structure not found',
      })
    }

    console.error('Failed to read batch file structure:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to read document structure',
      message: (error as Error).message,
    })
  }
})

/**
 * GET /api/batch_jobs/files/:fileId/images
 * Get list of images for a batch job file
 */
router.get('/files/:fileId/images', async (req: Request, res: Response) => {
  const { fileId } = req.params

  if (!fileId) {
    return res.status(400).json({
      success: false,
      error: 'File ID is required',
    })
  }

  // Security check: prevent directory traversal
  if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file ID',
    })
  }

  // Extract batch job ID from file ID
  const batchJobId = extractBatchJobIdFromFileId(fileId)
  if (!batchJobId) {
    return res.status(400).json({
      success: false,
      error: 'Could not determine batch job ID from file ID',
    })
  }

  // Convert file ID to folder name (colon -> underscore)
  const folderName = fileIdToFolderName(fileId)

  // Construct the path to processing directory
  const processingDir = path.join(BATCH_OUTPUTS_DIR, batchJobId, folderName, 'output', 'processing')

  try {
    const files = await fs.readdir(processingDir)
    // Filter for image files (jpeg, jpg, png, gif, webp)
    const imageFiles = files.filter(file => /\.(jpeg|jpg|png|gif|webp)$/i.test(file))
    
    return res.json({
      success: true,
      data: imageFiles,
      count: imageFiles.length,
    })
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return res.json({
        success: true,
        data: [],
        count: 0,
      })
    }

    console.error('Failed to list batch file images:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to list images',
      message: (error as Error).message,
    })
  }
})

/**
 * GET /api/batch_jobs/files/:fileId/images/:imageName
 * Serve an image for a batch job file
 */
router.get('/files/:fileId/images/:imageName', async (req: Request, res: Response) => {
  const { fileId, imageName } = req.params

  if (!fileId || !imageName) {
    return res.status(400).json({
      success: false,
      error: 'File ID and image name are required',
    })
  }

  // Security check: prevent directory traversal
  if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\') ||
      imageName.includes('..') || imageName.includes('/') || imageName.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file ID or image name',
    })
  }

  // Extract batch job ID from file ID
  const batchJobId = extractBatchJobIdFromFileId(fileId)
  if (!batchJobId) {
    return res.status(400).json({
      success: false,
      error: 'Could not determine batch job ID from file ID',
    })
  }

  // Convert file ID to folder name (colon -> underscore)
  const folderName = fileIdToFolderName(fileId)

  // Construct the path to the image
  const imagePath = path.join(BATCH_OUTPUTS_DIR, batchJobId, folderName, 'output', 'processing', imageName)

  try {
    await fs.access(imagePath)

    // Determine content type based on extension
    const ext = path.extname(imageName).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    }
    const contentType = contentTypes[ext] || 'application/octet-stream'

    res.setHeader('Content-Type', contentType)

    const { createReadStream } = await import('fs')
    const fileStream = createReadStream(imagePath)
    fileStream.pipe(res)
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Image not found',
      })
    }

    console.error('Failed to serve batch file image:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to serve image',
      message: (error as Error).message,
    })
  }
})

/**
 * GET /api/batch_jobs/files/:fileId/pdf
 * Serve the original PDF for a batch job file
 * Path: batch_processing/{batch_job_id}/{folder_name}/input/original.pdf
 */
router.get('/files/:fileId/pdf', async (req: Request, res: Response) => {
  const { fileId } = req.params

  if (!fileId) {
    return res.status(400).json({
      success: false,
      error: 'File ID is required',
    })
  }

  // Security check: prevent directory traversal
  if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file ID',
    })
  }

  // Extract batch job ID from file ID
  const batchJobId = extractBatchJobIdFromFileId(fileId)
  if (!batchJobId) {
    return res.status(400).json({
      success: false,
      error: 'Could not determine batch job ID from file ID',
    })
  }

  // Convert file ID to folder name (colon -> underscore)
  const folderName = fileIdToFolderName(fileId)

  // Construct the path to the original PDF
  // Pattern: batch_processing/{batch_job_id}/{folder_name}/input/original.pdf
  const pdfPath = path.join(BATCH_OUTPUTS_DIR, batchJobId, folderName, 'input', 'original.pdf')

  try {
    // Check if file exists
    await fs.access(pdfPath)

    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${fileId}"`)

    // Stream the file
    const { createReadStream } = await import('fs')
    const fileStream = createReadStream(pdfPath)
    fileStream.pipe(res)
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'PDF not found',
        message: `Could not find PDF at path: ${pdfPath}`,
      })
    }

    console.error('Failed to serve batch file PDF:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to serve PDF',
      message: (error as Error).message,
    })
  }
})

export default router

