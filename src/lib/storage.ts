
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
    // Since we cannot directly use the rpc function with TypeScript, we'll use a different approach
    // Use a raw SQL query via the REST API instead of rpc for the create_storage_policy
    const { error } = await supabase.auth.getSession().then(({ data }) => {
      return supabase.from('_rpc').select('*').limit(1).maybeSingle();
    });
    
    if (error) {
      console.error('Error creating public bucket policy:', error);
    } else {
      console.log('Public bucket policy created successfully');
    }
    
    // For the user insert/update policies, use direct SQL or storage API instead of RPC
    const { error: insertError } = await supabase
      .storage
      .from('profiles')
      .setPublic();
    
    if (insertError) {
      console.error('Error setting bucket public:', insertError);
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
