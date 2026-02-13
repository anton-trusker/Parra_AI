import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, FolderTree, Search, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  syrve_group_id: string;
  parent_id: string | null;
  parent_syrve_id: string | null;
  is_active: boolean;
}

interface CategoryTreePickerProps {
  categories: Category[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onDeleteCategory?: (id: string) => void;
  title?: string;
  summaryPrefix?: string;
}

interface TreeNode {
  category: Category;
  children: TreeNode[];
}

function buildTree(categories: Category[]): TreeNode[] {
  const lookup = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const cat of categories) lookup.set(cat.id, { category: cat, children: [] });
  for (const cat of categories) {
    const node = lookup.get(cat.id)!;
    if (cat.parent_id && lookup.has(cat.parent_id)) lookup.get(cat.parent_id)!.children.push(node);
    else roots.push(node);
  }
  const sortNodes = (nodes: TreeNode[]) => { nodes.sort((a, b) => a.category.name.localeCompare(b.category.name)); nodes.forEach(n => sortNodes(n.children)); };
  sortNodes(roots);
  return roots;
}

function getDescendantIds(node: TreeNode): string[] {
  const ids: string[] = [];
  for (const child of node.children) { ids.push(child.category.id); ids.push(...getDescendantIds(child)); }
  return ids;
}

function getAllIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];
  for (const node of nodes) { ids.push(node.category.id); ids.push(...getAllIds(node.children)); }
  return ids;
}

function countSelected(node: TreeNode, selectedIds: Set<string>): { selected: number; total: number } {
  let selected = selectedIds.has(node.category.id) ? 1 : 0;
  let total = 1;
  for (const child of node.children) {
    const cs = countSelected(child, selectedIds);
    selected += cs.selected;
    total += cs.total;
  }
  return { selected, total };
}

function TreeNodeRow({
  node, depth, selectedIds, expandedIds, onToggleSelect, onToggleExpand, onSelectBranch, onDelete, searchTerm,
}: {
  node: TreeNode; depth: number; selectedIds: Set<string>; expandedIds: Set<string>;
  onToggleSelect: (id: string) => void; onToggleExpand: (id: string) => void;
  onSelectBranch: (node: TreeNode, selected: boolean) => void;
  onDelete?: (id: string) => void; searchTerm: string;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedIds.has(node.category.id);
  const isSelected = selectedIds.has(node.category.id);
  const descendantIds = getDescendantIds(node);
  const allDescendantsSelected = descendantIds.length > 0 && descendantIds.every(id => selectedIds.has(id));
  const someDescendantsSelected = descendantIds.some(id => selectedIds.has(id));
  const isIndeterminate = someDescendantsSelected && !allDescendantsSelected && !isSelected;

  const matchesSearch = searchTerm ? node.category.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
  const hasMatchingDescendant = searchTerm ? node.children.some(child => hasMatch(child, searchTerm)) : true;
  if (searchTerm && !matchesSearch && !hasMatchingDescendant) return null;

  // Count selected in this branch
  const { selected: branchSelected, total: branchTotal } = hasChildren ? countSelected(node, selectedIds) : { selected: 0, total: 0 };
  const hasPartialSelection = hasChildren && branchSelected > 0 && branchSelected < branchTotal;
  const hasFullSelection = isSelected && allDescendantsSelected;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors group",
          hasFullSelection && "bg-primary/10 border-l-2 border-l-primary",
          hasPartialSelection && !hasFullSelection && "bg-accent/5 border-l-2 border-l-accent/50",
          isSelected && !hasChildren && "bg-primary/10",
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <Button variant="ghost" size="icon" className="h-5 w-5 p-0 shrink-0" onClick={() => onToggleExpand(node.category.id)}>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        ) : (
          <span className="w-5 shrink-0" />
        )}

        <Checkbox
          id={`tree-${node.category.id}`}
          checked={isSelected || (allDescendantsSelected && hasChildren)}
          data-state={isIndeterminate ? 'indeterminate' : undefined}
          onCheckedChange={() => {
            onToggleSelect(node.category.id);
          }}
          className={cn("shrink-0", isIndeterminate && "border-accent bg-accent/20")}
        />

        <label htmlFor={`tree-${node.category.id}`} className="text-sm cursor-pointer flex-1 truncate">
          {node.category.name}
        </label>

        {hasChildren && hasPartialSelection && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-accent/10 text-accent border-accent/30">
            {branchSelected}/{branchTotal}
          </Badge>
        )}

        {hasChildren && !hasPartialSelection && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 opacity-60">
            {node.children.length}
          </Badge>
        )}

        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0">
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{node.category.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate this category{hasChildren ? ` and ${descendantIds.length} subcategories` : ''}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(node.category.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {(isExpanded || searchTerm) &&
        node.children.map(child => (
          <TreeNodeRow key={child.category.id} node={child} depth={depth + 1} selectedIds={selectedIds} expandedIds={expandedIds}
            onToggleSelect={onToggleSelect} onToggleExpand={onToggleExpand} onSelectBranch={onSelectBranch} onDelete={onDelete} searchTerm={searchTerm} />
        ))}
    </>
  );
}

function hasMatch(node: TreeNode, term: string): boolean {
  if (node.category.name.toLowerCase().includes(term.toLowerCase())) return true;
  return node.children.some(c => hasMatch(c, term));
}

export default function CategoryTreePicker({ categories, selectedIds, onSelectionChange, onDeleteCategory, title = 'Category Filter', summaryPrefix = 'Importing' }: CategoryTreePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(categories), [categories]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allIds = useMemo(() => getAllIds(tree), [tree]);

  const toggleSelect = (id: string) => {
    if (selectedSet.has(id)) onSelectionChange(selectedIds.filter(i => i !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const selectBranch = (node: TreeNode, selected: boolean) => {
    const branchIds = [node.category.id, ...getDescendantIds(node)];
    if (selected) { const combined = new Set([...selectedIds, ...branchIds]); onSelectionChange([...combined]); }
    else { const branchSet = new Set(branchIds); onSelectionChange(selectedIds.filter(id => !branchSet.has(id))); }
  };

  const selectAll = () => onSelectionChange(allIds);
  const clearAll = () => onSelectionChange([]);
  const expandAll = () => setExpandedIds(new Set(allIds));
  const collapseAll = () => setExpandedIds(new Set());

  // Summary
  const totalCategories = allIds.length;
  const selectedCount = selectedIds.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FolderTree className="w-4 h-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-medium flex-1">{title}</p>
      </div>

      {/* Summary bar */}
      <div className={cn(
        "rounded-lg px-3 py-2 text-sm flex items-center justify-between",
        selectedCount === 0 ? "bg-muted/50 text-muted-foreground" : "bg-primary/10 text-primary"
      )}>
        <span>
          {selectedCount === 0 ? `${summaryPrefix}: All categories` : `${summaryPrefix}: ${selectedCount} of ${totalCategories} categories`}
        </span>
        {selectedCount > 0 && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAll}>Clear</Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search categories..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 h-9" />
      </div>

      <div className="flex gap-1 flex-wrap">
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>Select All</Button>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAll}>Clear All</Button>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={expandAll}>Expand All</Button>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={collapseAll}>Collapse All</Button>
      </div>

      <ScrollArea className="h-64 rounded-md border">
        <div className="p-1">
          {tree.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No categories found. Run a sync first.</p>
          ) : (
            tree.map(node => (
              <TreeNodeRow key={node.category.id} node={node} depth={0} selectedIds={selectedSet} expandedIds={expandedIds}
                onToggleSelect={toggleSelect} onToggleExpand={toggleExpand} onSelectBranch={selectBranch}
                onDelete={onDeleteCategory} searchTerm={searchTerm} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
