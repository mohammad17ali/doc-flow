export type BatchJobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface BatchJobFile {
  batch_job_file_id: string
  status: BatchJobStatus
  original_filename: string
  format: string
  params: Record<string, any>
}

export interface BatchJob {
  batch_job_id: string
  status: BatchJobStatus
  user: string
  created_at: string
  updated_at: string
  params: Record<string, any>
  files: BatchJobFile[]
}

