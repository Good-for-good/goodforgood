import { backupScheduler } from './services/backup-scheduler'
 
export async function initializeApp() {
  // Initialize backup scheduler
  await backupScheduler.initialize()
} 