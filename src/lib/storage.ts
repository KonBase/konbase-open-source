
import { supabase } from '@/lib/supabase';

// Create storage bucket if it doesn't exist
export async function initializeStorage() {
  try {
    // Check if the profiles bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) throw bucketsError;

    const profilesBucketExists = buckets.some(bucket => bucket.name === 'profiles');

    if (!profilesBucketExists) {
      // Create the profiles bucket
      const { error } = await supabase.storage.createBucket('profiles', {
        public: true,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
      });

      if (error) throw error;
      console.log('Created profiles storage bucket successfully');
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Initialize storage when the app starts
initializeStorage();
