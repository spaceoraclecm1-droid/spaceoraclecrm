# Bulk Actions - User Quick Reference

## What You Can Do

### 🔲 Select Inquiries
- Click any checkbox to select an inquiry
- Click the checkbox in the table header to select/deselect all visible inquiries
- Selected rows are highlighted in blue

### 🗑️ Delete Inquiries
1. Select one or more inquiries
2. Click the red **Delete** button in the action bar
3. Confirm in the dialog
4. Inquiries are removed from the list
5. **Undo available** - click "Undo" in the toast notification

### ❌ Mark as Deal Lost
1. Select one or more inquiries
2. Click the amber **Deal Lost** button
3. (Optional) Add remarks explaining why
4. Click **Mark as Deal Lost**
5. **Undo available** - click "Undo" to revert

### ↶ Undo Actions
- Click the green **Undo** button to reverse the last action
- Undo works for both Delete and Deal Lost
- You can undo up to 10 actions
- Undo history clears when you navigate away from this page

## Action Bar

When you select inquiries, this bar appears at the top:

```
┌─────────────────────────────────────────────────────────┐
│ 3 enquiries selected  [Clear] [Undo] [Deal Lost] [Delete]│
└─────────────────────────────────────────────────────────┘
```

**Buttons:**
- **Clear** - Deselect all
- **Undo** - Undo last action (appears only when available)
- **Deal Lost** - Mark selected as Deal Lost
- **Delete** - Delete selected inquiries

## Common Workflows

### Workflow 1: Clean Up Unqualified Leads
1. Filter by Source or Employee
2. Select inquiries you want to mark as lost
3. Click **Deal Lost**
4. Add remarks (optional) explaining why
5. Confirm

### Workflow 2: Delete Duplicate Inquiries
1. Search for duplicates
2. Select the duplicate records
3. Click **Delete**
4. Confirm in dialog
5. They're removed from the list
6. If you deleted by mistake, click **Undo** immediately

### Workflow 3: Bulk Reassign (Future)
This feature will be added soon to reassign multiple inquiries to employees.

## Tips & Tricks

✅ **Select All Then Deselect**
- Click "Select All" to select all visible inquiries
- Then click individual checkboxes to deselect specific ones
- This is faster than selecting 50 individual items

✅ **Use Filters First**
- Filter by Source, Employee, or search
- Then select from filtered results
- Safer than selecting everything

✅ **Remarks Help Your Team**
- When marking as Deal Lost, add remarks
- Explains to other team members why it was marked
- Shows in the inquiry history

✅ **Undo is Your Friend**
- If you accidentally deleted, you have 10 actions of undo history
- Undo works across multiple actions
- Only available in the current session

## What "Delete" Means

When you delete inquiries:
- They **disappear from the list** immediately
- They **cannot be found in searches**
- They can still be **undone** within the session
- They are **archived** (soft-deleted), not permanently removed
- Admin can still see them if needed (marked as deleted in database)

## What "Deal Lost" Means

When you mark as Deal Lost:
- Inquiry status changes to "Deal Lost"
- Inquiry **disappears from the active list**
- A **progress entry** is created in the history
- You can **undo** to revert the status
- The inquiry's history is preserved for future reference

## FAQ

**Q: Can I delete multiple inquiries at once?**  
A: Yes! Select all the ones you want to delete, then click Delete.

**Q: If I delete something, can I get it back?**  
A: Yes, click **Undo** in the toast notification (appears for 5 seconds). Or use the green Undo button in the action bar.

**Q: Can I undo multiple times?**  
A: Yes, up to 10 actions. Each undo reverses the most recent action.

**Q: Will undo work after I leave this page?**  
A: No, undo history is cleared when you navigate away. Use it immediately after the action.

**Q: What's the difference between Delete and Deal Lost?**  
A: Delete removes it from your list. Deal Lost marks it as a lost sale and keeps the history. Use Deal Lost for actual sales inquiries, Delete for duplicates or spam.

**Q: Can other users see what I deleted?**  
A: No, deleted inquiries are hidden for all users (unless an admin restores them).

**Q: Do I need to confirm before deleting?**  
A: Yes, a confirmation dialog appears showing how many will be affected.

## Need Help?

If something isn't working:
1. Check that you have the latest version
2. Try refreshing the page
3. Look at error messages in the action bar
4. Contact your admin if problems persist

---

**Version**: 1.0 - User Guide  
**Last Updated**: 2026-07-09
