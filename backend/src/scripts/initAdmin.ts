import { connectToDatabase, closeDatabaseConnection } from '../config/database';
import { UserModel } from '../models/User';
import { UserGroupModel } from '../models/UserGroup';
import { UserManagementService } from '../services/userManagementService';

/**
 * Script to initialize the database with an admin user and admin group
 * Run with: npm run init-admin
 */
async function initializeAdmin() {
  try {
    console.log('🔧 Initializing admin user and group...\n');

    // Connect to database
    await connectToDatabase();
    
    // Create indexes
    await UserModel.createIndexes();
    await UserGroupModel.createIndexes();

    // Check if admin group exists
    let adminGroup = await UserGroupModel.findByName('admin');
    
    if (!adminGroup) {
      console.log('📦 Creating admin group...');
      const groupId = await UserManagementService.createUserGroup({
        name: 'admin',
        description: 'System administrators with full access',
      });
      adminGroup = await UserGroupModel.findByName('admin');
      console.log(`✅ Admin group created with ID: ${groupId}\n`);
    } else {
      console.log(`✅ Admin group already exists\n`);
    }

    // Check if admin user exists
    const existingAdmin = await UserModel.findByUsername('admin');
    
    if (!existingAdmin) {
      console.log('👤 Creating admin user...');
      const userId = await UserManagementService.createUser({
        username: 'admin',
        email: 'admin@docflow.local',
        password: 'admin123', // CHANGE THIS IN PRODUCTION!
        groupIds: adminGroup?._id ? [adminGroup._id.toString()] : [],
      });
      console.log(`✅ Admin user created with ID: ${userId}`);
      console.log('\n⚠️  DEFAULT CREDENTIALS:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   \n   ⚠️  CHANGE THE PASSWORD IMMEDIATELY IN PRODUCTION!\n');
    } else {
      console.log(`✅ Admin user already exists\n`);
    }

    console.log('🎉 Admin initialization complete!\n');

    // Close connection
    await closeDatabaseConnection();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing admin:', error);
    await closeDatabaseConnection();
    process.exit(1);
  }
}

// Run the script
initializeAdmin();
