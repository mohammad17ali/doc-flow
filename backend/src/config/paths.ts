import path from 'path';
import os from 'os';

/**
 * Configuration for file paths
 */

// Get the home directory and construct the path to outputs
const homeDir = os.homedir();
export const OUTPUTS_DIR = path.join(homeDir, 'pdf-results', 'ervin', 'outputs');

export const OUTPUT_TREE_FILENAME = 'output_tree.json';
