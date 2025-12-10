import path from 'path';
import os from 'os';

/**
 * Configuration for file paths
 */

// Use environment variable or fall back to home directory
// const baseDir = process.env.PDF_RESULTS_DIR || path.join(os.homedir(), 'pdf-results');
// export const OUTPUTS_DIR = path.join(baseDir, 'ervin', 'outputs');
export const OUTPUTS_DIR = process.env.OUTPUTS_DIR || '/home/alimohammad/pdf-results';

// Batch processing outputs directory (contains folders named after each batch_job_id)
export const BATCH_OUTPUTS_DIR =
  process.env.BATCH_OUTPUTS_DIR || '/home/alimohammad/AIComps/comps/pdf-parser/batch_processing';

// PDFs directory - defaults to frontend's public/pdfs folder
export const PDFS_DIR = process.env.PDFS_DIR || '/home/alimohammad/pdf-parser';

export const OUTPUT_TREE_FILENAME = '/outputs/processing/output_tree.json';
