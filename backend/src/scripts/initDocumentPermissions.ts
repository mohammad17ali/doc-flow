import { connectToDatabase, getDatabase } from '../config/database';
import { DocumentModel } from '../models/Document';
import { UserGroupModel } from '../models/UserGroup';
import { ObjectId } from 'mongodb';
import fs from 'fs/promises';
import path from 'path';
import { OUTPUTS_DIR } from '../config/paths';

/**
 * Initialize documents by scanning the outputs directory
 * Automatically discovers all PDF document folders
 * Automatically assigns admin group permissions to all documents
 * 
 * Prerequisites: Run 'npm run init:admin' first to create admin group
 */

async function initDocumentPermissions() {
  try {
    console.log('🚀 Initializing documents in database...\n');
    console.log('📁 Scanning directory: ' + OUTPUTS_DIR);

    // Connect to database
    await connectToDatabase();
    console.log('✅ Connected to database\n');

    // Create indexes
    await DocumentModel.createIndexes();

    // Find admin group
    console.log('🔍 Looking for admin group...');
    const adminGroup = await UserGroupModel.findByName('admin');
    
    if (!adminGroup || !adminGroup._id) {
      console.error('❌ Admin group not found!');
      console.error('   Please run "npm run init:admin" first to create the admin group.');
      process.exit(1);
    }
    
    const adminGroupId = adminGroup._id;
    console.log(`✅ Found admin group (ID: ${adminGroupId})\n`);

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
          // Document already exists, check and update permissions if needed
          const existingDoc = existingDocs.find(d => d.documentId === folderName);
          const hasAdminPermission = existingDoc?.permissions.some(
            p => p.groupId.toString() === adminGroupId.toString()
          );

          if (!hasAdminPermission) {
            // Add admin group permission to existing document
            await DocumentModel.addPermission(folderName, adminGroupId);
            console.log(`   🔄 Updated (added admin permissions)`);
            updatedCount++;
          } else {
            console.log(`   ⚠️  Already exists with admin access (skipped)`);
            skippedCount++;
          }
          console.log('');
        } else {
          // Create new document WITH admin group permissions
          await DocumentModel.create({
            documentId: folderName,
            name: folderName, // Use folder name as display name
            filePath: docPath,
            permissions: [
              {
                groupId: adminGroupId, // Automatically grant admin group access
              }
            ],
            metadata: {},
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });

          console.log(`   ✅ Created with admin group permissions\n`);
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
    console.log('📝 All documents have been granted admin group access automatically.\n');
    console.log('💡 Next Steps:');
    console.log('   1. Login as admin (username: admin, password: admin123)');
    console.log('   2. Create additional user groups via Admin Panel');
    console.log('   3. Assign document permissions to groups via Admin Panel');
    console.log('   4. Create users and assign them to groups\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
initDocumentPermissions();
