-- Create storage bucket for patient images and add image columns to patients table
-- Create storage bucket for patient images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-images', 'patient-images', true)
ON CONFLICT (id) DO NOTHING;

-- Add image columns to patients table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'before_image') THEN
        ALTER TABLE patients ADD COLUMN before_image TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'patients' AND column_name = 'after_image') THEN
        ALTER TABLE patients ADD COLUMN after_image TEXT;
    END IF;
END $$;

-- Create storage policy for patient images
CREATE POLICY "Allow authenticated users to upload patient images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'patient-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to view patient images" ON storage.objects
FOR SELECT USING (
    bucket_id = 'patient-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to update patient images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'patient-images' AND 
    auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated users to delete patient images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'patient-images' AND 
    auth.role() = 'authenticated'
);
