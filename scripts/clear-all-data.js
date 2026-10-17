import { clearAllPlatformData, initDatabase } from '../db/db.js';

async function main() {
  console.log('====================================================');
  console.log('   EVENTRYE PLATFORM - COMPLETE DATA WIPE & RESET   ');
  console.log('====================================================');
  console.log('Clearing all organizations, users, superadmins, events,');
  console.log('subscriptions, credentials, and activity logs...');

  await initDatabase();
  await clearAllPlatformData();

  console.log('✅ ALL DATA CLEARED SUCCESSFULLY!');
  console.log('Platform is now completely clean and ready for fresh setup.');
  console.log('Visit /superadmin or /orbit-i-master-gateway/login to configure');
  console.log('your single Platform Master SuperAdmin account.');
  console.log('====================================================');
  process.exit(0);
}

main().catch(err => {
  console.error('Error during data wipe:', err);
  process.exit(1);
});
