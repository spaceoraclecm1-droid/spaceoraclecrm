-- Add is_deleted column to enquiries table for soft delete support
-- This migration supports the bulk actions feature (delete with undo)

ALTER TABLE public.enquiries
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Create index for filtering out deleted records in queries
CREATE INDEX IF NOT EXISTS idx_enquiries_is_deleted 
ON public.enquiries(is_deleted);

-- Index for combined queries (common filter pattern)
CREATE INDEX IF NOT EXISTS idx_enquiries_deleted_progress 
ON public.enquiries(is_deleted, "Enquiry Progress");

-- Comment for documentation
COMMENT ON COLUMN public.enquiries.is_deleted IS 'Soft delete flag - when true, inquiry is hidden from standard views but can be restored via undo';
