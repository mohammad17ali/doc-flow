import { connectToDatabase, getDatabase } from '../config/database';
import { DocumentModel } from '../models/Document';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { OUTPUTS_DIR } from '../config/paths';

/**
 * Initialize documents by scanning the outputs directory
 * Automatically discovers all PDF document folders
 * Admin assigns permissions via API after initialization
 */

async function initDocumentPermissions() {
  try {
    console.log('🚀 Initializing documents in database...\n');
    console.log('📁 Scanning directory: ' + OUTPUTS_DIR);
    console.log('⚠️  NOTE: Documents are created WITHOUT permissions');
    console.log('   Admin must assign permissions via API after initialization\n');

    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database\n');

    // Create indexes
    await DocumentModel.createIndexes();

    // Scan the outputs directory for all folders
    console.log('🔍 Scanning for document folders...\n');
    let entries;
    try {
      entries = await fs.readdir(OUTPUTS_DIR, { withFileTypes: true });
    } catch (error) {
      console.error(`❌ Failed to read directory: ${OUTPUTS_DIR}`);
      console.error(error);
      process.exit(1);
    }

    // Filter for directories only
    const folders = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);
    
    if (folders.length === 0) {
      console.log('⚠️  No document folders found in outputs directory');
      console.log('📝 Make sure PDF output folders exist in: ' + OUTPUTS_DIR);
      process.exit(0);
    }

    console.log(`📊 Found ${folders.length} folder(s): ${folders.join(', ')}\n`);

    // Get existing documents from database
    const existingDocs = await DocumentModel.findAll();
    const existingDocIds = new Set(existingDocs.map(doc => doc.documentId));

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    // Process each folder found
    for (const folderName of folders) {
      try {
        console.log(`📄 Processing: ${folderName}`);

        const docPath = path.join(OUTPUTS_DIR, folderName);

        // Create or update document
        if (existingDocIds.has(folderName)) {
          // Document already exists, skip
          console.log(`   ⚠️  Already exists (skipped)\n`);
          skippedCount++;
        } else {
          // Create new document WITHOUT permissions or metadata
          await DocumentModel.create({
            documentId: folderName,
            name: folderName, // Use folder name as display name
            filePath: docPath,
            permissions: [], // Admin will assign permissions later
            metadata: {},
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          console.log(`   ✅ Created (no permissions assigned yet)`);
          console.log(`   ⚠️  Admin must assign permissions via API\n`);
          createdCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${folderName}: ${errorMsg}`);
        console.error(`   ❌ Error: ${errorMsg}\n`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Created: ${createdCount}`);
    console.log(`   🔄 Updated: ${updatedCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('='.repeat(60));
    console.log('\n✅ Document initialization complete!\n');
    console.log('📝 Next Steps:');
    console.log('   1. Create user groups via: POST /api/admin/groups');
    console.log('   2. Assign permissions via: POST /api/admin/documents/:documentId/permissions');
    console.log('   3. Add users to groups via: POST /api/admin/users/:userId/groups/:groupId\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
initDocumentPermissions();
