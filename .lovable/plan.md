

# Fix: Category Selection Behavior and Wine Categories Scoping

## Problem
1. Clicking a parent category checkbox auto-selects ALL descendant categories (e.g., clicking "Wine" selects the parent + 99 children = "100 of 135"). The user expects to select only the parent and have the system infer that its children are included.
2. The Wine Categories picker shows the full 135 categories instead of only categories selected in the import filter.

## Changes

### 1. CategoryTreePicker -- Change Parent Selection Behavior
**File**: `src/components/syrve/CategoryTreePicker.tsx`

- **Parent click = toggle only that parent**, not the entire branch. Remove `selectBranch` from the checkbox handler for parents. Clicking a parent only adds/removes that parent's ID.
- Add a new optional prop `title` (default: "Category Filter") and `summaryPrefix` (default: "Importing") so each picker instance can have distinct labels.
- Update summary text to use `summaryPrefix`.
- The visual indicators (partial selection borders/badges) remain -- they now show when a parent is selected but some children aren't, which is normal and informative.

### 2. SyrveSettings -- Scope Wine Categories Picker
**File**: `src/pages/SyrveSettings.tsx`

- Filter categories passed to the Wine Categories `CategoryTreePicker` to only include categories already selected in the main Category Filter (section 3). If no categories are selected in the filter, show all.
- Add a `useEffect` that prunes `wine_category_ids` when `selectedCategoryIds` changes (removes any wine category IDs no longer in the import filter).
- Pass custom title "Wine Categories" and summaryPrefix "Selected" to distinguish from the main filter.

## Technical Details

### CategoryTreePicker changes
- New props: `title?: string`, `summaryPrefix?: string`
- Checkbox `onCheckedChange` for parent nodes: call `onToggleSelect(node.category.id)` instead of `onSelectBranch(...)`. This toggles only the clicked category.
- Keep `selectBranch` available only via "Select All" / bulk actions, not individual checkbox clicks.

### SyrveSettings scoping
```typescript
const wineCategoryPool = selectedCategoryIds.length > 0
  ? categories.filter(c => selectedCategoryIds.includes(c.id))
  : categories;
```

Cleanup effect:
```typescript
useEffect(() => {
  if (selectedCategoryIds.length > 0 && fieldMapping.wine_category_ids?.length > 0) {
    const validIds = fieldMapping.wine_category_ids.filter(id => selectedCategoryIds.includes(id));
    if (validIds.length !== fieldMapping.wine_category_ids.length) {
      setFieldMapping(prev => ({ ...prev, wine_category_ids: validIds }));
    }
  }
}, [selectedCategoryIds]);
```

### Files Modified
- `src/components/syrve/CategoryTreePicker.tsx` -- Add title/summaryPrefix props, change parent click to toggle-only
- `src/pages/SyrveSettings.tsx` -- Scope wine picker, add cleanup effect, pass custom props
