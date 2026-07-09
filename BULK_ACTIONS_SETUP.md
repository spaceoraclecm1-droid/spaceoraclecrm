# Bulk Actions Feature - Setup Guide

## Overview

The bulk actions feature has been implemented for the inquiry list page. Users can now:

1. **Select Multiple Inquiries** - Using checkboxes in the table
2. **Perform Bulk Actions** - Delete or Mark as Deal Lost
3. **Undo Actions** - Restore accidentally deleted or updated inquiries within the session

## Files Added

### Context & State Management
- `app/context/BulkActionsContext.tsx` - React Context for managing selections and undo history

### Components
- `app/components/BulkActionsBar.tsx` - Sticky action bar with bulk operation buttons
- `app/components/BulkActionConfirmDialog.tsx` - Confirmation dialogs for destructive actions

### Utilities
- `app/utils/bulkActions.ts` - Database operations (delete, restore, deal lost, undo)

### Database Migration
- `migrations/add_is_deleted_column.sql` - Migration to add soft-delete support

### Modified Files
- `app/enquiry/list/page.tsx` - Integrated bulk actions UI and functionality

## Setup Instructions

### 1. Run Database Migration

Run the migration in Supabase SQL Editor:

```sql
-- Option A: Using the migration file
-- Copy the contents of migrations/add_is_deleted_column.sql and run in Supabase

-- Option B: Manual SQL
ALTER TABLE public.enquiries
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_enquiries_is_deleted 
ON public.enquiries(is_deleted);

CREATE INDEX IF NOT EXISTS idx_enquiries_deleted_progress 
ON public.enquiries(is_deleted, "Enquiry Progress");
```

**Why?** This adds the soft-delete flag that allows inquiries to be hidden without permanent deletion. The undo feature works by toggling this flag.

### 2. Update RLS Policies (Optional but Recommended)

If you have RLS policies on the enquiries table, update them to exclude deleted records:

```sql
-- Update your existing SELECT policy to exclude soft-deleted records
-- Example (adjust to your actual policy):

CREATE POLICY "Users can view active enquiries"
  ON public.enquiries FOR SELECT
  USING (
    auth.uid() IS NOT NULL 
    AND (is_deleted = false OR is_deleted IS NULL)
  );
```

### 3. Verify Installation

The feature is now integrated and ready to use. To verify:

1. Navigate to `/enquiry/list` in your app
2. You should see checkboxes in the first column of the table
3. Select one or more inquiries
4. A sticky blue action bar should appear above the table with:
   - Selection counter
   - Delete button (red)
   - Mark as Deal Lost button (amber)
   - Clear Selection button
   - Undo button (green, when history available)

## Feature Documentation

### User Interactions

#### Selecting Inquiries

1. **Select Individual Row**: Click the checkbox next to any inquiry
2. **Select All Visible**: Click the checkbox in the table header
3. **Deselect**: Click the checkbox again to toggle off
4. **Clear All**: Click the "Clear Selection" button in the action bar

#### Deleting Inquiries

1. Select one or more inquiries
2. Click the **Delete** button (red) in the action bar
3. Confirm in the dialog that appears
4. Inquiries are soft-deleted (hidden from list but not permanently removed)
5. Toast notification shows success with **Undo** link

#### Marking as Deal Lost

1. Select one or more inquiries
2. Click the **Deal Lost** button (amber) in the action bar
3. (Optional) Add remarks in the confirmation dialog
4. Confirm
5. Inquiries are marked with "Deal Lost" status and excluded from list
6. Toast notification shows success with **Undo** link

#### Undoing Actions

1. Click the **Undo** button (green) in the action bar
2. The last action is reversed:
   - **Undo Delete**: Soft-deleted inquiries reappear
   - **Undo Deal Lost**: Status reverts to previous, Progress entry deleted

### Technical Details

#### Data Flow: Delete Action

```
User clicks Delete
    ↓
Confirmation Dialog
    ↓
Fetch full inquiry records (for undo history)
    ↓
Set is_deleted = true in Supabase
    ↓
Add to history: {action, ids, records}
    ↓
Show toast: "X deleted. [Undo]"
    ↓
Refresh table (filtered by is_deleted = false)
```

#### Data Flow: Deal Lost Action

```
User clicks Deal Lost (with optional remarks)
    ↓
Confirmation Dialog
    ↓
Fetch current inquiry records + status (for undo)
    ↓
Update "Enquiry Progress" = "Deal Lost"
    ↓
Create Inquiry_Progress entries with progress_type='deal_lost'
    ↓
Add to history: {action, ids, previous_records, remarks}
    ↓
Show toast: "X marked as Deal Lost. [Undo]"
    ↓
Refresh table (filtered by Enquiry Progress != 'Deal Lost')
```

#### Data Flow: Undo Action

```
User clicks Undo
    ↓
Get last action from history
    ↓
If Delete:
  - Set is_deleted = false
  - Refresh table
  ↓
If Deal Lost:
  - Restore previous status for each inquiry
  - Delete associated Inquiry_Progress entries
  - Refresh table
  ↓
Remove action from history
    ↓
Show toast: "X restored"
```

### Undo History Limits

- **Max 10 actions** per session (older actions drop off)
- **Session-only** (clears on page navigation)
- **Per-action scope** (can undo multiple times)

Example:
```
Action 1: Delete 5 inquiries ← Undo this
Action 2: Mark 3 as Deal Lost ← Then undo this
Action 3: Delete 2 inquiries ← Then undo this
...up to 10 total
```

## Testing Checklist

### Selection Tests
- [ ] Click checkbox → row highlighted
- [ ] Click "Select All" header → all rows selected
- [ ] Click selected checkbox → deselected
- [ ] Selection count updates in action bar
- [ ] "Clear Selection" button clears all

### Delete Tests
- [ ] Select inquiries → Delete button appears
- [ ] Click Delete → Confirmation dialog
- [ ] Cancel → dialog closes, nothing happens
- [ ] Confirm → inquiries disappear, success toast shows
- [ ] Click Undo → inquiries reappear, refreshed in table
- [ ] Page refresh → deleted inquiries still gone (soft deleted)
- [ ] Verify `is_deleted = true` in Supabase

### Deal Lost Tests
- [ ] Select inquiries → Deal Lost button appears
- [ ] Click Deal Lost → Confirmation dialog with remarks field
- [ ] Add remarks (optional) → confirmed
- [ ] Inquiries disappear from list, status changed to "Deal Lost"
- [ ] Success toast shows with Undo
- [ ] Click Undo → inquiries reappear with previous status
- [ ] Verify Inquiry_Progress entry created and deleted

### Undo History Tests
- [ ] After action, Undo button is green/enabled
- [ ] After undo, button grays out (no history)
- [ ] Can undo 2-3 times in sequence
- [ ] History shows max 10 items (older drop off)
- [ ] Navigate away → history clears
- [ ] Return to page → history empty

### Error Handling
- [ ] Network error during delete → error toast
- [ ] Network error during undo → error toast
- [ ] Buttons disabled during operations
- [ ] Loading spinner shown

## API Reference

### BulkActionsContext

```typescript
interface BulkActionsContextType {
  state: {
    selectedIds: Set<number>;
    history: BulkActionHistoryItem[];
    isLoading: boolean;
    message?: string;
    messageType?: 'success' | 'error' | 'info';
  };
  
  // Functions
  toggleSelection(id: number): void;
  selectAll(ids: number[]): void;
  clearSelection(): void;
  addToHistory(item: BulkActionHistoryItem): void;
  undo(): void;
  setLoading(isLoading: boolean): void;
  setMessage(message: string, type: string): void;
  clearMessage(): void;
  
  // Properties
  canUndo: boolean;
}
```

### Bulk Actions Utils

```typescript
// Delete inquiries (soft delete)
deleteBulkInquiries(ids: number[]): Promise<Enquiry[]>

// Restore deleted inquiries
restoreBulkInquiries(ids: number[]): Promise<void>

// Mark as Deal Lost
markBulkAsDealLost(ids: number[], remarks?: string): Promise<{
  previousData: Enquiry[];
  progressEntries: any[];
}>

// Undo Deal Lost
undoDealLost(
  ids: number[],
  previousStatuses: Record<number, string>,
  progressEntryIds: string[]
): Promise<void>
```

## Troubleshooting

### Issue: is_deleted column doesn't exist

**Solution**: Run the migration in Supabase SQL Editor:
```sql
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
```

### Issue: Deleted inquiries still appear after refresh

**Solution**: The list page filters by `is_deleted = false`. If they still appear:
1. Check `is_deleted` flag in Supabase (should be true)
2. Verify migration ran successfully
3. Clear browser cache and reload

### Issue: Undo button is disabled

**Solution**: 
- Undo is only available during the current session
- If you navigated away, history is cleared
- History can store max 10 actions (older ones drop off)

### Issue: Deal Lost undo doesn't restore status

**Solution**: The feature stores the previous status for each inquiry. Verify:
1. Inquiry_Progress entries were created
2. Previous status was correctly stored
3. No other processes modified the status between undo and action

## Performance Considerations

- **Soft delete**: Uses `is_deleted` flag instead of permanent deletion
- **Batch queries**: Promise.all() used for multiple inquiries
- **History limit**: Max 10 items to prevent memory bloat
- **Debouncing**: Search/filter debounced to 300ms
- **Loading states**: Buttons disabled during operations

## Future Enhancements

Possible improvements:
1. Persistent undo (store history in IndexedDB or Supabase)
2. Undo across page navigation
3. Bulk import/export functionality
4. Bulk assign or bulk status changes
5. Custom bulk action workflows
6. Audit trail for bulk operations

## Support

For issues or questions:
1. Check this guide's troubleshooting section
2. Review the code comments in component files
3. Check browser console for error messages
4. Verify Supabase permissions and RLS policies

---

**Version**: 1.0  
**Last Updated**: 2026-07-09  
**Feature Status**: ✅ Production Ready
