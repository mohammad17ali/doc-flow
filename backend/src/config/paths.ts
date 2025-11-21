import path from 'path';
import os from 'os';

/**
 * Configuration for file paths
 */

// Use environment variable or fall back to home directory
const baseDir = process.env.PDF_RESULTS_DIR || path.join(os.homedir(), 'pdf-results');
export const OUTPUTS_DIR = path.join(baseDir, 'ervin', 'outputs');

export const OUTPUT_TREE_FILENAME = 'output_tree.json';
