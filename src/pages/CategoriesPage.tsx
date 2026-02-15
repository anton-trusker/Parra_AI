import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderTree, Search, ChevronRight, ChevronDown, Package, Trash2, 
  MoreHorizontal, List, TreePine, Eye, FolderPlus, Move, Copy, 
  RefreshCw, Edit2, X, Layers, FolderOpen, Activity, Hash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCategoriesWithCounts, useDeleteCategory } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
  depth?: number;
}

// ── Tree helpers ──────────────────────────────────────────────

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

function flattenTree(nodes: TreeNode[], depth = 0): TreeNode[] {
  const result: TreeNode[] = [];
  const walk = (list: TreeNode[], d: number) => {
    for (const n of list) {
      result.push({ ...n, depth: d });
      walk(n.children, d + 1);
    }
  };
  walk(nodes, depth);
  return result;
}

function hasMatch(node: TreeNode, term: string): boolean {
  if (node.name.toLowerCase().includes(term.toLowerCase())) return true;
  return node.children.some(c => hasMatch(c, term));
}

// ── Stat card ─────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: string }) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", accent || "bg-primary/10")}>
        <Icon className={cn("w-5 h-5", accent ? "text-primary-foreground" : "text-primary")} />
      </div>
      <div>
        <p className="text-2xl font-heading font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────

function CategoryContextMenu({ node, isAdmin, onEdit, onDelete, onNavigate }: {
  node: TreeNode; isAdmin: boolean;
  onEdit: (node: TreeNode) => void;
  onDelete: (id: string, name: string) => void;
  onNavigate: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={() => onEdit(node)}>
          <Edit2 className="w-4 h-4 mr-2" />Edit Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onNavigate(node.id)}>
          <Eye className="w-4 h-4 mr-2" />View Products ({node.totalProductCount})
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled><FolderPlus className="w-4 h-4 mr-2" />Add Subcategory</DropdownMenuItem>
        <DropdownMenuItem disabled><Move className="w-4 h-4 mr-2" />Move to…</DropdownMenuItem>
        <DropdownMenuItem disabled><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onDelete(node.id, node.name)}>
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Tree row ──────────────────────────────────────────────────

function CategoryRow({ node, depth, expanded, onToggle, onNavigate, onDelete, onEdit, isAdmin, searchTerm }: {
  node: TreeNode; depth: number; expanded: Set<string>; onToggle: (id: string) => void;
  onNavigate: (id: string) => void; onDelete: (id: string, name: string) => void;
  onEdit: (node: TreeNode) => void; isAdmin: boolean; searchTerm: string;
}) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const matchesSearch = searchTerm ? node.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
  const hasMatchingDescendant = searchTerm ? node.children.some(c => hasMatch(c, searchTerm)) : true;
  if (searchTerm && !matchesSearch && !hasMatchingDescendant) return null;

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 py-2.5 px-3 rounded-lg transition-all group cursor-default",
          "hover:bg-muted/60",
          depth === 0 && "font-medium",
          !node.is_active && "opacity-50"
        )}
        style={{ paddingLeft: `${depth * 24 + 12}px` }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <button
            onClick={() => onToggle(node.id)}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors shrink-0"
          >
            {isExpanded
              ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
              : <ChevronRight className="w-4 h-4 text-muted-foreground" />
            }
          </button>
        ) : (
          <span className="w-7 shrink-0 flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-border" />
          </span>
        )}

        {/* Folder icon */}
        {hasChildren ? (
          <FolderOpen className="w-4 h-4 text-accent shrink-0" />
        ) : (
          <FolderTree className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
        )}

        {/* Name */}
        <button
          onClick={() => onEdit(node)}
          className="flex-1 text-left text-sm hover:text-primary transition-colors truncate"
        >
          {node.name}
        </button>

        {/* Inactive badge */}
        {!node.is_active && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-destructive/30 text-destructive">
            Inactive
          </Badge>
        )}

        {/* Sync indicator */}
        {node.synced_at && (
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <RefreshCw className="w-3 h-3 text-muted-foreground/40 shrink-0" />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Synced {new Date(node.synced_at).toLocaleDateString()}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Product count badge */}
        <Badge
          variant={node.totalProductCount > 0 ? "secondary" : "outline"}
          className={cn(
            "text-[11px] px-2 py-0 h-5 shrink-0 tabular-nums font-mono",
            node.totalProductCount > 0 && "bg-primary/8 text-primary border-primary/20"
          )}
        >
          <Package className="w-3 h-3 mr-1" />
          {node.totalProductCount}
        </Badge>

        {/* Children count */}
        {hasChildren && (
          <span className="text-[10px] text-muted-foreground/50 tabular-nums shrink-0">
            {node.children.length} sub
          </span>
        )}

        {/* Context menu */}
        <CategoryContextMenu node={node} isAdmin={isAdmin} onEdit={onEdit} onDelete={onDelete} onNavigate={onNavigate} />
      </div>

      {/* Children */}
      {(isExpanded || searchTerm) && node.children.map(child => (
        <CategoryRow
          key={child.id} node={child} depth={depth + 1} expanded={expanded}
          onToggle={onToggle} onNavigate={onNavigate} onDelete={onDelete}
          onEdit={onEdit} isAdmin={isAdmin} searchTerm={searchTerm}
        />
      ))}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────

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

  const rootCount = useMemo(() => tree.length, [tree]);
  const withProducts = useMemo(() => flatList.filter(n => n.productCount > 0).length, [flatList]);
  const totalProducts = useMemo(() => Object.values(data?.productCounts || {}).reduce((a, b) => a + b, 0), [data]);

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
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <PageHeader
        title="Categories"
        subtitle={`${allIds.length} categories synced from Syrve`}
        icon={FolderTree}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-lg overflow-hidden bg-card">
              <button
                onClick={() => setViewType('tree')}
                className={cn(
                  "px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-all",
                  viewType === 'tree'
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <TreePine className="w-3.5 h-3.5" />
                Tree
              </button>
              <button
                onClick={() => setViewType('list')}
                className={cn(
                  "px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-all",
                  viewType === 'list'
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
            </div>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Layers} label="Total Categories" value={allIds.length} />
        <StatCard icon={FolderOpen} label="Root Categories" value={rootCount} />
        <StatCard icon={Package} label="Total Products" value={totalProducts} />
        <StatCard icon={Activity} label="With Products" value={withProducts} />
      </div>

      {/* Toolbar */}
      <Card className="p-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search categories by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10 border-0 bg-muted/50 focus-visible:ring-1"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {viewType === 'tree' && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Button variant="ghost" size="sm" className="text-xs h-8 gap-1.5" onClick={() => setExpanded(new Set(allIds))}>
                <ChevronDown className="w-3.5 h-3.5" />Expand All
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-8 gap-1.5" onClick={() => setExpanded(new Set())}>
                <ChevronRight className="w-3.5 h-3.5" />Collapse
              </Button>
            </>
          )}
          {search && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {filteredList.length} result{filteredList.length !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Content */}
      <Card className="overflow-hidden">
        {tree.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories found"
            description="Run a Syrve sync to import your product categories."
          />
        ) : viewType === 'tree' ? (
          <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
            <div className="p-2 space-y-0.5">
              {tree.map(node => (
                <CategoryRow
                  key={node.id} node={node} depth={0} expanded={expanded}
                  onToggle={toggleExpand}
                  onNavigate={id => navigate(`/products?category=${id}`)}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                  onEdit={setEditNode} isAdmin={isAdmin} searchTerm={search}
                />
              ))}
            </div>
          </ScrollArea>
        ) : (
          /* ── List View ── */
          <ScrollArea className="h-[calc(100vh-380px)] min-h-[400px]">
            {/* Table header */}
            <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span className="col-span-4">Category</span>
                <span className="col-span-3">Parent</span>
                <span className="col-span-1 text-center">Depth</span>
                <span className="col-span-1 text-right">Direct</span>
                <span className="col-span-1 text-right">Total</span>
                <span className="col-span-1 text-center">Status</span>
                <span className="col-span-1 text-right">Actions</span>
              </div>
            </div>
            <div className="divide-y divide-border/40">
              {filteredList.map((node, idx) => (
                <div
                  key={node.id}
                  className={cn(
                    "grid grid-cols-12 gap-3 px-4 py-3 items-center transition-colors group",
                    "hover:bg-muted/30",
                    idx % 2 === 0 && "bg-muted/5"
                  )}
                >
                  <button
                    className="col-span-4 text-left text-sm font-medium hover:text-primary transition-colors truncate flex items-center gap-2"
                    onClick={() => setEditNode(node)}
                  >
                    {node.children.length > 0
                      ? <FolderOpen className="w-4 h-4 text-accent shrink-0" />
                      : <FolderTree className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                    }
                    {node.name}
                  </button>
                  <span className="col-span-3 text-xs text-muted-foreground truncate">
                    {node.parent_id
                      ? flatList.find(n => n.id === node.parent_id)?.name || '—'
                      : <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">Root</Badge>
                    }
                  </span>
                  <span className="col-span-1 text-center text-xs text-muted-foreground tabular-nums">
                    {node.depth ?? 0}
                  </span>
                  <span className="col-span-1 text-right text-sm tabular-nums">
                    {node.productCount}
                  </span>
                  <span className={cn(
                    "col-span-1 text-right text-sm tabular-nums font-medium",
                    node.totalProductCount > 0 && "text-primary"
                  )}>
                    {node.totalProductCount}
                  </span>
                  <span className="col-span-1 flex items-center justify-center">
                    <span className={cn(
                      "w-2 h-2 rounded-full",
                      node.is_active ? "bg-[hsl(var(--wine-success))]" : "bg-destructive"
                    )} />
                  </span>
                  <div className="col-span-1 flex items-center justify-end">
                    <CategoryContextMenu
                      node={node} isAdmin={isAdmin}
                      onEdit={setEditNode}
                      onDelete={(id, name) => setDeleteTarget({ id, name })}
                      onNavigate={id => navigate(`/products?category=${id}`)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>

      {/* ── Edit Dialog ── */}
      <Dialog open={!!editNode} onOpenChange={open => !open && setEditNode(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-accent" />
              {editNode?.name}
            </DialogTitle>
          </DialogHeader>
          {editNode && (
            <div className="space-y-5">
              {/* Key info cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="glass-card p-3 text-center">
                  <p className="text-xl font-heading font-bold text-primary">{editNode.productCount}</p>
                  <p className="text-[11px] text-muted-foreground">Direct Products</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xl font-heading font-bold">{editNode.totalProductCount}</p>
                  <p className="text-[11px] text-muted-foreground">Total Products</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <p className="text-xl font-heading font-bold">{editNode.children.length}</p>
                  <p className="text-[11px] text-muted-foreground">Subcategories</p>
                </div>
              </div>

              <Separator />

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Parent Category</Label>
                  <p className="text-sm mt-1 font-medium">{parentName || 'Root (top-level)'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={editNode.is_active ? "default" : "destructive"} className="text-xs">
                      {editNode.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Syrve Group ID</Label>
                  <p className="text-xs font-mono mt-1 text-muted-foreground bg-muted/50 rounded px-2 py-1 truncate">
                    {editNode.syrve_group_id || '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Synced</Label>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {editNode.synced_at ? new Date(editNode.synced_at).toLocaleString() : 'Never'}
                  </p>
                </div>
              </div>

              {/* Subcategories */}
              {editNode.children.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Subcategories ({editNode.children.length})
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {editNode.children.map(c => (
                      <Badge
                        key={c.id} variant="outline"
                        className="text-xs cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors gap-1"
                        onClick={() => setEditNode(c)}
                      >
                        {c.name}
                        <span className="text-muted-foreground/60 ml-0.5">({c.totalProductCount})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="default" size="sm"
              onClick={() => { if (editNode) navigate(`/products?category=${editNode.id}`); setEditNode(null); }}
              className="gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />View Products
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditNode(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
