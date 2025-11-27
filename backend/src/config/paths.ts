import path from 'path';
import os from 'os';

/**
 * Configuration for file paths
 */

// Use environment variable or fall back to home directory
const baseDir = process.env.PDF_RESULTS_DIR || path.join(os.homedir(), 'pdf-results');
export const OUTPUTS_DIR = path.join(baseDir, 'ervin', 'outputs');

// PDFs directory - defaults to frontend's public/pdfs folder
export const PDFS_DIR = process.env.PDFS_DIR || '/home/intel/kubernetes_files/ervin/pdf-parsing/doc-flow/frontend/public/pdfs';

export const OUTPUT_TREE_FILENAME = 'output_tree.json';
