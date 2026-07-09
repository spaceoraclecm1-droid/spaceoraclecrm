import { supabase } from './supabase';

export interface Enquiry {
  id: number;
  'Client Name': string;
  'Mobile': string;
  'Email': string;
  'Enquiry For': string;
  'Property Type': string;
  'Assigned To': string;
  'Created Date': string;
  'Enquiry Progress': string;
  'Budget': string;
  'NFD': string;
  'Remarks': string;
  'Favourite': string;
  'Near to Win': string;
  'Enquiry Source': string;
  'Assigned By': string;
  'Area': string;
  'Configuration': string;
  'Last Remarks': string;
  'is_deleted'?: boolean;
}

/**
 * Delete inquiries (soft delete - sets is_deleted = true)
 * Returns the full records for undo functionality
 */
export async function deleteBulkInquiries(ids: number[]): Promise<Enquiry[]> {
  if (!ids || ids.length === 0) {
    throw new Error('No inquiries selected');
  }

  try {
    // Fetch full records first (for undo history)
    const { data: records, error: fetchError } = await supabase
      .from('enquiries')
      .select('*')
      .in('id', ids);

    if (fetchError) throw fetchError;

    if (!records || records.length === 0) {
      throw new Error('Inquiries not found');
    }

    // Soft delete: set is_deleted = true
    const { error: updateError } = await supabase
      .from('enquiries')
      .update({ is_deleted: true })
      .in('id', ids);

    if (updateError) throw updateError;

    return records as Enquiry[];
  } catch (error) {
    console.error('Error deleting inquiries:', error);
    throw error;
  }
}

/**
 * Restore deleted inquiries (soft delete - sets is_deleted = false)
 */
export async function restoreBulkInquiries(ids: number[]): Promise<void> {
  if (!ids || ids.length === 0) {
    throw new Error('No inquiries to restore');
  }

  try {
    const { error } = await supabase
      .from('enquiries')
      .update({ is_deleted: false })
      .in('id', ids);

    if (error) throw error;
  } catch (error) {
    console.error('Error restoring inquiries:', error);
    throw error;
  }
}

/**
 * Mark inquiries as Deal Lost
 * Updates status and creates progress entries
 */
export async function markBulkAsDealLost(
  ids: number[],
  remarks?: string
): Promise<{
  previousData: Enquiry[];
  progressEntries: any[];
}> {
  if (!ids || ids.length === 0) {
    throw new Error('No inquiries selected');
  }

  try {
    // 1. Fetch current records (for undo history)
    const { data: records, error: fetchError } = await supabase
      .from('enquiries')
      .select('*')
      .in('id', ids);

    if (fetchError) throw fetchError;

    if (!records || records.length === 0) {
      throw new Error('Inquiries not found');
    }

    // 2. Update enquiry status to "Deal Lost"
    const { error: updateError } = await supabase
      .from('enquiries')
      .update({ 'Enquiry Progress': 'Deal Lost' })
      .in('id', ids);

    if (updateError) throw updateError;

    // 3. Create progress entries
    const now = new Date().toISOString();
    const progressEntries = ids.map((id) => ({
      eid: id,
      progress_type: 'deal_lost',
      remark: remarks || 'Marked as Deal Lost (bulk action)',
      created_at: now,
    }));

    const { data: insertedProgress, error: insertError } = await supabase
      .from('Inquiry_Progress')
      .insert(progressEntries)
      .select('id');

    if (insertError) throw insertError;

    return {
      previousData: records as Enquiry[],
      progressEntries: insertedProgress || [],
    };
  } catch (error) {
    console.error('Error marking inquiries as deal lost:', error);
    throw error;
  }
}

/**
 * Undo Deal Lost action
 * Restores previous status and deletes progress entries
 */
export async function undoDealLost(
  ids: number[],
  previousStatuses: Record<number, string>,
  progressEntryIds: string[]
): Promise<void> {
  if (!ids || ids.length === 0) {
    throw new Error('No inquiries to restore');
  }

  try {
    // 1. Restore each inquiry to its previous status
    const updatePromises = ids.map((id) => {
      const previousStatus = previousStatuses[id] || 'New';
      return supabase
        .from('enquiries')
        .update({ 'Enquiry Progress': previousStatus })
        .eq('id', id);
    });

    const results = await Promise.all(updatePromises);

    // Check for errors
    for (const result of results) {
      if (result.error) throw result.error;
    }

    // 2. Delete progress entries
    if (progressEntryIds && progressEntryIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('Inquiry_Progress')
        .delete()
        .in('id', progressEntryIds);

      if (deleteError) throw deleteError;
    }
  } catch (error) {
    console.error('Error undoing deal lost:', error);
    throw error;
  }
}

/**
 * Create is_deleted column if it doesn't exist
 * This is a helper function to ensure the table structure is ready
 */
export async function ensureIsDeletedColumn(): Promise<void> {
  try {
    // Try to fetch a single record to check if column exists
    const { error } = await supabase
      .from('enquiries')
      .select('is_deleted')
      .limit(1);

    // If there's an error about the column not existing, we can't create it via client
    // This should be done via Supabase SQL editor or migrations
    if (error && error.message.includes('is_deleted')) {
      console.warn(
        'is_deleted column not found. Please add it via Supabase SQL editor: ALTER TABLE enquiries ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE;'
      );
    }
  } catch (error) {
    console.error('Error checking is_deleted column:', error);
  }
}
