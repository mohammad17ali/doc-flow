/**
 * Example usage of the Document Permissions System
 * 
 * This file demonstrates how to work with document permissions programmatically
 */

import { DocumentModel } from '../models/Document';
import { UserGroupModel } from '../models/UserGroup';
import { ObjectId } from 'mongodb';

// ============================================================================
// Example 1: Grant a group access to a document
// ============================================================================
async function grantDocumentAccess(
  documentId: string,
  groupName: string
): Promise<void> {
  // Find the group by name
  const group = await UserGroupModel.findByName(groupName);
  
  if (!group || !group._id) {
    throw new Error(`Group "${groupName}" not found`);
  }

  // Add permission to document
  const success = await DocumentModel.addPermission(
    documentId,
    group._id
  );

  if (success) {
    console.log(`✅ Granted access to ${groupName} for document ${documentId}`);
  } else {
    console.log(`⚠️  Failed to grant access (document may not exist)`);
  }
}

// Usage:
// await grantDocumentAccess('BMRA-Single-Server', 'BMRA-Admins');

// ============================================================================
// Example 2: Revoke group access from a document
// ============================================================================
async function revokeDocumentAccess(
  documentId: string,
  groupName: string
): Promise<void> {
  // Find the group by name
  const group = await UserGroupModel.findByName(groupName);
  
  if (!group || !group._id) {
    throw new Error(`Group "${groupName}" not found`);
  }

  // Remove permission from document
  const success = await DocumentModel.removePermission(documentId, group._id);

  if (success) {
    console.log(`✅ Revoked access for ${groupName} from document ${documentId}`);
  } else {
    console.log(`⚠️  Failed to revoke access`);
  }
}

// Usage:
// await revokeDocumentAccess('BMRA-Single-Server', 'Old-Group');

// ============================================================================
// Example 3: Check if a user has access to a document
// ============================================================================
async function checkUserAccess(
  documentId: string,
  userGroupIds: ObjectId[]
): Promise<boolean> {
  const hasAccess = await DocumentModel.hasAccess(documentId, userGroupIds);
  
  if (hasAccess) {
    console.log(`✅ User has access to document ${documentId}`);
  } else {
    console.log(`❌ User does NOT have access to document ${documentId}`);
  }
  
  return hasAccess;
}

// Usage:
// const userGroups = [new ObjectId('...')];
// await checkUserAccess('BMRA-Single-Server', userGroups);

// ============================================================================
// Example 4: Get all documents accessible by a group
// ============================================================================
async function getGroupDocuments(groupName: string): Promise<void> {
  // Find the group
  const group = await UserGroupModel.findByName(groupName);
  
  if (!group || !group._id) {
    throw new Error(`Group "${groupName}" not found`);
  }

  // Get all documents this group can access
  const documents = await DocumentModel.findByGroupIds([group._id]);
  
  console.log(`\n📄 Documents accessible by ${groupName}:`);
  console.log(`Found ${documents.length} documents:\n`);
  
  documents.forEach(doc => {
    console.log(`  - ${doc.name} (${doc.documentId})`);
    console.log(`    Files: ${doc.metadata?.fileCount || 'unknown'}`);
    console.log('');
  });
}

// Usage:
// await getGroupDocuments('BMRA-Admins');

// ============================================================================
// Example 5: Create a new document with permissions
// ============================================================================
async function createDocumentWithPermissions(
  documentId: string,
  name: string,
  groupNames: string[]
): Promise<void> {
  // Resolve group names to IDs
  const permissions = [];
  
  for (const groupName of groupNames) {
    const group = await UserGroupModel.findByName(groupName);
    if (group && group._id) {
      permissions.push({
        groupId: group._id
      });
    } else {
      console.warn(`⚠️  Warning: Group "${groupName}" not found, skipping`);
    }
  }

  if (permissions.length === 0) {
    throw new Error('No valid groups found for permissions');
  }

  // Create document
  const docId = await DocumentModel.create({
    documentId,
    name,
    filePath: `/home/intel/pdf-results/ervin/outputs/${documentId}`,
    permissions,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  console.log(`✅ Created document with ID: ${docId}`);
  console.log(`   Document ID: ${documentId}`);
  console.log(`   Name: ${name}`);
  console.log(`   Permissions: ${permissions.length} groups`);
}

// Usage:
// await createDocumentWithPermissions(
//   'new-document',
//   'New Document',
//   ['BMRA-Admins', 'Tender-Team']
// );

// ============================================================================
// Example 6: Update document permissions (replace all)
// ============================================================================
async function updateDocumentPermissions(
  documentId: string,
  groupNames: string[]
): Promise<void> {
  // Resolve group names to IDs
  const permissions = [];
  
  for (const groupName of groupNames) {
    const group = await UserGroupModel.findByName(groupName);
    if (group && group._id) {
      permissions.push({
        groupId: group._id
      });
    }
  }

  // Update document
  const success = await DocumentModel.update(documentId, { permissions });

  if (success) {
    console.log(`✅ Updated permissions for document ${documentId}`);
    console.log(`   New permissions: ${permissions.length} groups`);
  } else {
    console.log(`⚠️  Failed to update permissions`);
  }
}

// Usage:
// await updateDocumentPermissions('BMRA-Single-Server', [
//   'BMRA-Admins',
//   'BMRA-Viewers'
// ]);

// ============================================================================
// Example 7: List all documents with their permissions
// ============================================================================
async function listAllDocumentsWithPermissions(): Promise<void> {
  const documents = await DocumentModel.findAll();
  
  console.log(`\n📚 All Documents (${documents.length} total):\n`);
  console.log('='.repeat(70));
  
  for (const doc of documents) {
    console.log(`\n📄 ${doc.name} (${doc.documentId})`);
    console.log(`   Description: ${doc.description || 'N/A'}`);
    console.log(`   Files: ${doc.metadata?.fileCount || 'unknown'}`);
    console.log(`   Category: ${doc.metadata?.category || 'uncategorized'}`);
    console.log(`   Tags: ${doc.metadata?.tags?.join(', ') || 'none'}`);
    console.log(`\n   Permissions (${doc.permissions.length} groups):`);
    
    for (const perm of doc.permissions) {
      const group = await UserGroupModel.findById(perm.groupId);
      console.log(`     - ${group?.name || 'Unknown'}`);
    }
  }
  
  console.log('\n' + '='.repeat(70) + '\n');
}

// Usage:
// await listAllDocumentsWithPermissions();

export {
  grantDocumentAccess,
  revokeDocumentAccess,
  checkUserAccess,
  getGroupDocuments,
  createDocumentWithPermissions,
  updateDocumentPermissions,
  listAllDocumentsWithPermissions
};
