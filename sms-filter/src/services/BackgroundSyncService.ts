import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { ThreatCloudService } from './ThreatCloudService';
import { backgroundSyncOutcome } from './backgroundSyncPolicy';

const BACKGROUND_FETCH_TASK = 'background-threat-sync';

// 1. Define the task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    console.log('[BackgroundFetch] Bulut veritabanı senkronizasyonu başlatılıyor...');
    const syncOutcome = backgroundSyncOutcome(await ThreatCloudService.syncDatabase());
    if (syncOutcome === 'failed') {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('[BackgroundFetch] Senkronizasyon hatası:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Helper to register the task
export async function registerBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60 * 60 * 12, // 12 hours in seconds
        stopOnTerminate: false, // android only
        startOnBoot: true,      // android only
      });
      console.log('[BackgroundFetch] Görev başarıyla kaydedildi.');
    }
  } catch (err) {
    console.log('[BackgroundFetch] Kayıt hatası:', err);
  }
}

// 3. Helper to unregister the task
export async function unregisterBackgroundSync() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
      console.log('[BackgroundFetch] Görev iptal edildi.');
    }
  } catch (err) {
    console.log('[BackgroundFetch] İptal hatası:', err);
  }
}
