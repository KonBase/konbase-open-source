
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
    // Using direct SQL queries via RPC instead of unsupported TypeScript parameters
    const { error } = await supabase.rpc('create_storage_policy', { 
      bucket_name: 'profiles',
      policy_name: 'Public Read Access',
      definition: 'true', // Anyone can read
      operation: 'SELECT'
    });
    
    if (error) {
      console.error('Error creating public bucket policy:', error);
    } else {
      console.log('Public bucket policy created successfully');
    }
    
    // Add policy for users to insert their own files
    const { error: insertError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'profiles',
      policy_name: 'User Insert Access',
      definition: '(auth.uid() = owner)', // Only file owner can insert
      operation: 'INSERT'
    });
    
    if (insertError) {
      console.error('Error creating insert bucket policy:', insertError);
    }
    
    // Add policy for users to update their own files
    const { error: updateError } = await supabase.rpc('create_storage_policy', {
      bucket_name: 'profiles',
      policy_name: 'User Update Access',
      definition: '(auth.uid() = owner)', // Only file owner can update
      operation: 'UPDATE'
    });
    
    if (updateError) {
      console.error('Error creating update bucket policy:', updateError);
    }
    
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
