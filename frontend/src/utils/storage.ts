import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase credentials are missing! Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file')
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

export async function uploadFile(
  bucket: string,
  file: File,
  path: string
): Promise<string> {
  // Validate environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase credentials are not configured. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
  }

  // Validate file size (max 100MB for videos)
  const maxSize = 100 * 1024 * 1024 // 100MB
  if (file.size > maxSize) {
    throw new Error(`File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`)
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    // Provide more helpful error messages
    if (error.message.includes('signature verification failed') || error.message.includes('Bucket not found')) {
      throw new Error(`Storage bucket '${bucket}' not found or not configured. Please ensure the bucket exists in Supabase Storage and storage policies are set up correctly. See SETUP_STORAGE_BUCKET.sql for setup instructions.`)
    }
    if (error.message.includes('new row violates row-level security') || error.message.includes('RLS')) {
      throw new Error(`Upload denied by storage policy. Please check Supabase Storage policies allow uploads to '${bucket}' bucket. Run SETUP_STORAGE_BUCKET.sql to configure policies.`)
    }
    if (error.message.includes('File size exceeds')) {
      throw new Error(`File is too large. Maximum allowed size is 100MB.`)
    }
    throw new Error(`Upload failed: ${error.message}`)
  }

  if (!data || !data.path) {
    throw new Error('Upload succeeded but no file path returned')
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}