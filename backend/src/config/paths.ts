import path from 'path';
import os from 'os';



export const OUTPUTS_DIR = process.env.OUTPUTS_DIR || '/home/alimohammad/pdf-results';

export const BATCH_OUTPUTS_DIR =
  process.env.BATCH_OUTPUTS_DIR || '/home/alimohammad/AIComps/comps/pdf-parser/batch_processing';

export const PDFS_DIR = process.env.PDFS_DIR || '/home/alimohammad/pdf-parser';


export const OUTPUT_TREE_FILENAME = '/outputs/processing/output_tree.json';
