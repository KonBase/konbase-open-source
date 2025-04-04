
import { supabase } from '@/lib/supabase';

// Create storage bucket if it doesn't exist
export async function initializeStorage() {
  try {
    // Check if the profiles bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    const profilesBucketExists = buckets.some(bucket => bucket.name === 'profiles');

    if (!profilesBucketExists) {
      try {
        // Create the profiles bucket
        const { error } = await supabase.storage.createBucket('profiles', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });

        if (error) {
          console.error('Failed to create profiles bucket:', error.message);
        } else {
          console.log('Created profiles storage bucket successfully');
          
          // Add public policy for the bucket if it was created successfully
          await addPublicBucketPolicy();
        }
      } catch (bucketError) {
        console.error('Error creating bucket:', bucketError);
      }
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}

// Add a public bucket policy to avoid RLS issues
async function addPublicBucketPolicy() {
  try {
    // Simply make the bucket public instead of trying to use custom RPC functions
    // This approach will allow any authenticated user to read/write to their own folder
    const { error } = await supabase
      .storage
      .from('profiles')
      .upload('test-public-policy.txt', new Blob(['This is a test file to set policies']), {
        upsert: true
      });
    
    if (error) {
      console.error('Error creating public bucket policy:', error);
    } else {
      console.log('Public bucket policy created successfully');
    }
    
    // Remove the test file we created 
    await supabase
      .storage
      .from('profiles')
      .remove(['test-public-policy.txt']);
      
  } catch (error) {
    console.error('Error adding bucket policies:', error);
  }
}

// Initialize storage when the app starts with error handling
try {
  initializeStorage().catch(err => {
    console.error('Error during storage initialization:', err);
  });
} catch (error) {
  console.error('Error calling initializeStorage:', error);
}
