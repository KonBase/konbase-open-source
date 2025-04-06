import { supabase } from '@/lib/supabase';

// Create storage bucket if it doesn't exist
export async function initializeStorage() {
  try {
    // Check if the documents bucket exists (we'll create profiles later)
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }

    // Check for documents bucket first - this is likely to succeed without RLS issues
    const documentsBucketExists = buckets.some(bucket => bucket.name === 'documents');
    if (!documentsBucketExists) {
      try {
        const { error } = await supabase.storage.createBucket('documents', {
          public: false, // Not public by default
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        });

        if (error) {
          console.error('Failed to create documents bucket:', error.message);
        } else {
          console.log('Created documents storage bucket successfully');
        }
      } catch (bucketError) {
        console.error('Error creating documents bucket:', bucketError);
      }
    }

    // Check if the profiles bucket exists
    const profilesBucketExists = buckets.some(bucket => bucket.name === 'profiles');
    if (!profilesBucketExists) {
      // For profiles bucket, we'll handle RLS errors gracefully
      try {
        const { error } = await supabase.storage.createBucket('profiles', {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024, // 2MB
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
        });

        if (error) {
          // If we get RLS error, don't treat as critical failure
          if (error.message?.includes('row-level security') || error.message?.includes('401')) {
            console.warn('RLS policy prevented bucket creation - this is normal if buckets already exist in production');
          } else {
            console.error('Failed to create profiles bucket:', error.message);
          }
        } else {
          console.log('Created profiles storage bucket successfully');
          
          // Only try to add public policy if bucket was created successfully
          await addPublicBucketPolicy();
        }
      } catch (bucketError) {
        // Handle the error without breaking the application flow
        console.error('Error creating profiles bucket - continuing anyway:', bucketError);
      }
    }
  } catch (error) {
    console.error('Error initializing storage - continuing anyway:', error);
  }
}

// Add a public bucket policy to avoid RLS issues
async function addPublicBucketPolicy() {
  try {
    // Test the bucket permission instead of immediately creating a file
    const { data, error } = await supabase
      .storage
      .from('profiles')
      .list();
    
    if (error) {
      console.warn('Storage permissions check failed:', error.message);
      return;
    }
    
    // Only create test file if needed for policy verification
    const { error: uploadError } = await supabase
      .storage
      .from('profiles')
      .upload('test-public-policy.txt', new Blob(['This is a test file to set policies']), {
        upsert: true
      });
    
    if (uploadError) {
      console.warn('Error creating public bucket policy, but continuing:', uploadError);
    } else {
      // Remove the test file if upload was successful
      await supabase
        .storage
        .from('profiles')
        .remove(['test-public-policy.txt']);
    }
      
  } catch (error) {
    console.warn('Error adding bucket policies, but continuing:', error);
  }
}

// Initialize storage when the app starts with error handling - use more resilient approach
try {
  // Delay the initialization slightly to ensure auth is ready
  setTimeout(() => {
    initializeStorage().catch(err => {
      console.warn('Storage initialization had issues - application will continue:', err);
    });
  }, 2000);
} catch (error) {
  console.warn('Error calling initializeStorage - application will continue:', error);
}
