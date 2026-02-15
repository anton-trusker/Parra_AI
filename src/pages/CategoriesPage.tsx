import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Search, ChevronRight, ChevronDown, Package, Trash2, MoreHorizontal, List, TreePine, Eye, FolderPlus, Move, Copy, RefreshCw, Edit2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCategoriesWithCounts, useDeleteCategory } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

type ViewType = 'tree' | 'list';

interface TreeNode {
  id: string;
  name: string;
  parent_id: string | null;
  syrve_group_id?: string;
  synced_at?: string | null;
  is_active?: boolean | null;
  children: TreeNode[];
  productCount: number;
  totalProductCount: number;
}

function buildTree(categories: any[], counts: Record<string, number>): TreeNode[] {
  const lookup = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const cat of categories) {
    lookup.set(cat.id, {
      id: cat.id, name: cat.name, parent_id: cat.parent_id,
      syrve_group_id: cat.syrve_group_id, synced_at: cat.synced_at, is_active: cat.is_active,
      children: [], productCount: counts[cat.id] || 0, totalProductCount: 0,
    });
  }

  for (const cat of categories) {
    const node = lookup.get(cat.id)!;
    if (cat.parent_id && lookup.has(cat.parent_id)) {
      lookup.get(cat.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const calcTotal = (node: TreeNode): number => {
    node.totalProductCount = node.productCount + node.children.reduce((sum, c) => sum + calcTotal(c), 0);
    return node.totalProductCount;
  };
  roots.forEach(calcTotal);

  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(n => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

function flattenTree(nodes: TreeNode[]): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[]) => {
    for (const n of list) {
      result.push(n);
      walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

function hasMatch(node: TreeNode, term: string): boolean {
  if (node.name.toLowerCase().includes(term.toLowerCase())) return true;
  return node.children.some(c => hasMatch(c, term));
}

function CategoryContextMenu({ node, isAdmin, onEdit, onDelete, onNavigate }: {
  node: TreeNode; isAdmin: boolean; onEdit: (node: TreeNode) => void; onDelete: (id: string, name: string) => void; onNavigate: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEdit(node)}><Edit2 className="w-3.5 h-3.5 mr-2" />Edit</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate(node.id)}><Eye className="w-3.5 h-3.5 mr-2" />View Products</DropdownMenuItem>
        <DropdownMenuItem disabled><FolderPlus className="w-3.5 h-3.5 mr-2" />Add Subcategory</DropdownMenuItem>
        <DropdownMenuItem disabled><Move className="w-3.5 h-3.5 mr-2" />Move to…</DropdownMenuItem>
        <DropdownMenuItem disabled><Copy className="w-3.5 h-3.5 mr-2" />Duplicate</DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(node.id, node.name)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" />Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CategoryRow({ node, depth, expanded, onToggle, onNavigate, onDelete, onEdit, isAdmin, searchTerm }: {
  node: TreeNode; depth: number; expanded: Set<string>; onToggle: (id: string) => void;
  onNavigate: (id: string) => void; onDelete: (id: string, name: string) => void; onEdit: (node: TreeNode) => void; isAdmin: boolean; searchTerm: string;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const matchesSearch = searchTerm ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
  const hasMatchingDescendant = searchTerm ? node.children.some(c => hasMatch(c, searchTerm)) : true;
  if (searchTerm && !matchesSearch && !hasMatchingDescendant) return null;

  return (
    <>
      <div
        className="flex items-center gap-1 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <Button variant="ghost" size="icon" className="h-6 w-6 p-0 shrink-0" onClick={() => onToggle(node.id)}>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        ) : (
          <span className="w-6 shrink-0" />
        )}

        <button onClick={() => onEdit(node)} className="flex-1 text-left text-sm hover:text-accent transition-colors truncate">
          {node.name}
        </button>

        {node.synced_at && (
          <RefreshCw className="w-3 h-3 text-muted-foreground/50 shrink-0" />
        )}

        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
          <Package className="w-3 h-3 mr-0.5" />
          {node.totalProductCount}
        </Badge>

        <CategoryContextMenu node={node} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} onNavigate={onNavigate} />
      </div>
      {(isExpanded || searchTerm) && node.children.map(child => (
        <CategoryRow key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onNavigate={onNavigate} onDelete={onDelete} onEdit={onEdit} isAdmin={isAdmin} searchTerm={searchTerm} />
      ))}
    </>
  );
}

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { data, isLoading } = useCategoriesWithCounts();
  const deleteCategory = useDeleteCategory();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [viewType, setViewType] = useState<ViewType>('tree');
  const [editNode, setEditNode] = useState<TreeNode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const tree = useMemo(() => data ? buildTree(data.categories, data.productCounts) : [], [data]);
  const flatList = useMemo(() => flattenTree(tree), [tree]);
  const allIds = useMemo(() => flatList.map(n => n.id), [flatList]);

  const filteredList = useMemo(() => {
    if (!search) return flatList;
    return flatList.filter(n => n.name.toLowerCase().includes(search.toLowerCase()));
  }, [flatList, search]);

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCategory.mutateAsync(deleteTarget.id);
      toast.success(`Category "${deleteTarget.name}" deleted`);
    } catch (e: any) {
      toast.error(e.message);
    }
    setDeleteTarget(null);
  };

  const parentName = useMemo(() => {
    if (!editNode?.parent_id) return null;
    return flatList.find(n => n.id === editNode.parent_id)?.name || null;
  }, [editNode, flatList]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">{allIds.length} categories from Syrve</p>
        </div>
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button onClick={() => setViewType('tree')} className={`p-2 transition-colors ${viewType === 'tree' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <TreePine className="w-4 h-4" />
          </button>
          <button onClick={() => setViewType('list')} className={`p-2 transition-colors ${viewType === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
        {viewType === 'tree' && (
          <>
            <Button variant="outline" size="sm" className="h-10" onClick={() => setExpanded(new Set(allIds))}>Expand All</Button>
            <Button variant="outline" size="sm" className="h-10" onClick={() => setExpanded(new Set())}>Collapse All</Button>
          </>
        )}
      </div>

      <div className="wine-glass-effect rounded-xl">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-2">
            {tree.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No categories. Run a Syrve sync first.</p>
              </div>
            ) : viewType === 'tree' ? (
              tree.map(node => (
                <CategoryRow key={node.id} node={node} depth={0} expanded={expanded} onToggle={toggleExpand}
                  onNavigate={id => navigate(`/products?category=${id}`)} onDelete={(id, name) => setDeleteTarget({ id, name })} onEdit={setEditNode} isAdmin={isAdmin} searchTerm={search} />
              ))
            ) : (
              /* List View */
              <div>
                <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/50">
                  <span className="col-span-2">Name</span>
                  <span>Parent</span>
                  <span className="text-right">Products</span>
                  <span className="text-right">Actions</span>
                </div>
                {filteredList.map(node => (
                  <div key={node.id} className="grid grid-cols-5 gap-2 px-3 py-2.5 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors group items-center">
                    <button className="col-span-2 text-left text-sm font-medium hover:text-accent transition-colors truncate" onClick={() => setEditNode(node)}>
                      {node.name}
                    </button>
                    <span className="text-xs text-muted-foreground truncate">
                      {node.parent_id ? (flatList.find(n => n.id === node.parent_id)?.name || '—') : '—'}
                    </span>
                    <span className="text-right text-sm tabular-nums">{node.productCount}</span>
                    <div className="flex items-center justify-end">
                      <CategoryContextMenu node={node} isAdmin={isAdmin} onEdit={setEditNode} onDelete={(id, name) => setDeleteTarget({ id, name })} onNavigate={id => navigate(`/products?category=${id}`)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editNode} onOpenChange={open => !open && setEditNode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Category Details</DialogTitle>
          </DialogHeader>
          {editNode && (
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-sm font-medium mt-0.5">{editNode.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Parent Category</Label>
                  <p className="text-sm mt-0.5">{parentName || 'Root'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Products</Label>
                  <p className="text-sm mt-0.5">{editNode.productCount} direct · {editNode.totalProductCount} total</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Syrve Group ID</Label>
                  <p className="text-xs font-mono mt-0.5 text-muted-foreground truncate">{editNode.syrve_group_id || '—'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Synced</Label>
                  <p className="text-xs mt-0.5 text-muted-foreground">{editNode.synced_at ? new Date(editNode.synced_at).toLocaleString() : '—'}</p>
                </div>
              </div>
              {editNode.children.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Subcategories ({editNode.children.length})</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {editNode.children.map(c => (
                      <Badge key={c.id} variant="outline" className="text-xs cursor-pointer" onClick={() => setEditNode(c)}>
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { if (editNode) navigate(`/products?category=${editNode.id}`); setEditNode(null); }}>
              <Eye className="w-3.5 h-3.5 mr-1.5" />View Products
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditNode(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate this category and all its subcategories. Products will remain but become uncategorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
