import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FolderTree, List, TreePine, Eye, Layers, FolderOpen, Activity, Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCategoriesWithCounts, useDeleteCategory } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/authStore';
import PageHeader from '@/components/PageHeader';
import EmptyState from '@/components/EmptyState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CategoryTreeContainer, CategoryNode } from '@/components/ui/category-tree';

type ViewType = 'tree' | 'list';

interface ExtendedCategoryNode extends CategoryNode {
  parent_id: string | null;
  syrve_group_id?: string;
  synced_at?: string | null;
  is_active?: boolean | null;
  totalProductCount: number;
  subcategories?: ExtendedCategoryNode[];
}

// ── Tree helpers ──────────────────────────────────────────────

function buildCategoryTree(categories: any[], counts: Record<string, number>): ExtendedCategoryNode[] {
  const lookup = new Map<string, ExtendedCategoryNode>();
  const roots: ExtendedCategoryNode[] = [];

  for (const cat of categories) {
    lookup.set(cat.id, {
      id: cat.id, 
      name: cat.name, 
      description: cat.description,
      parent_id: cat.parent_id,
      syrve_group_id: cat.syrve_group_id, 
      synced_at: cat.synced_at, 
      is_active: cat.is_active,
      subcategories: [], 
      productCount: counts[cat.id] || 0, 
      totalProductCount: 0,
      level: 0
    });
  }

  for (const cat of categories) {
    const node = lookup.get(cat.id)!;
    if (cat.parent_id && lookup.has(cat.parent_id)) {
      const parent = lookup.get(cat.parent_id)!;
      node.level = parent.level + 1;
      parent.subcategories!.push(node);
    } else {
      roots.push(node);
    }
  }

  const calcTotal = (node: ExtendedCategoryNode): number => {
    node.totalProductCount = node.productCount + (node.subcategories || []).reduce((sum, c) => sum + calcTotal(c), 0);
    return node.totalProductCount;
  };
  roots.forEach(calcTotal);

  const sortNodes = (nodes: ExtendedCategoryNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name));
    nodes.forEach(n => sortNodes(n.subcategories || []));
  };
  sortNodes(roots);
  
  // Update levels recursively just in case
  const updateLevels = (nodes: ExtendedCategoryNode[], level: number) => {
    nodes.forEach(n => {
      n.level = level;
      if (n.subcategories) updateLevels(n.subcategories, level + 1);
    });
  };
  updateLevels(roots, 0);

  return roots;
}

function flattenTree(nodes: ExtendedCategoryNode[]): ExtendedCategoryNode[] {
  const result: ExtendedCategoryNode[] = [];
  const walk = (list: ExtendedCategoryNode[]) => {
    for (const n of list) {
      result.push(n);
      if (n.subcategories) walk(n.subcategories);
    }
  };
  walk(nodes);
  return result;
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

// ── Main page ─────────────────────────────────────────────────

export default function CategoriesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const { data, isLoading } = useCategoriesWithCounts();
  const deleteCategory = useDeleteCategory();
  const [viewType, setViewType] = useState<ViewType>('tree');
  const [editNode, setEditNode] = useState<ExtendedCategoryNode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const tree = useMemo(() => data ? buildCategoryTree(data.categories, data.productCounts) : [], [data]);
  const flatList = useMemo(() => flattenTree(tree), [tree]);
  const allIds = useMemo(() => flatList.map(n => n.id), [flatList]);

  const rootCount = useMemo(() => tree.length, [tree]);
  const withProducts = useMemo(() => flatList.filter(n => n.productCount > 0).length, [flatList]);
  const totalProducts = useMemo(() => Object.values(data?.productCounts || {}).reduce((a, b) => a + b, 0), [data]);

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

      {/* Content */}
      <div className="h-[calc(100vh-380px)] min-h-[500px]">
        {tree.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="No categories found"
            description="Run a Syrve sync to import your product categories."
          />
        ) : viewType === 'tree' ? (
          <CategoryTreeContainer
            categories={tree}
            onCategorySelect={(cat) => navigate(`/products?category=${cat.id}`)}
            onCategoryEdit={isAdmin ? (cat) => setEditNode(cat as ExtendedCategoryNode) : undefined}
            onCategoryDelete={isAdmin ? (id) => {
              const cat = flatList.find(n => n.id === id);
              if (cat) setDeleteTarget({ id, name: cat.name });
            } : undefined}
            onCategoryAdd={isAdmin ? (parentId) => toast.info('Category creation is handled via Syrve sync') : undefined}
            showSearch={true}
            showActions={true}
            compact={true}
            className="h-full border-none shadow-none bg-transparent"
          />
        ) : (
          /* ── List View ── */
          <Card className="h-full overflow-hidden">
            <ScrollArea className="h-full">
              {/* Table header */}
              <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm border-b border-border">
                <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <span className="col-span-4">Category</span>
                  <span className="col-span-3">Parent</span>
                  <span className="col-span-1 text-center">Level</span>
                  <span className="col-span-1 text-right">Direct</span>
                  <span className="col-span-1 text-right">Total</span>
                  <span className="col-span-1 text-center">Status</span>
                  <span className="col-span-1 text-right">Actions</span>
                </div>
              </div>
              <div className="divide-y divide-border/40">
                {flatList.map((node, idx) => (
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
                      {(node.subcategories?.length || 0) > 0
                        ? <FolderOpen className="w-4 h-4 text-accent shrink-0" />
                        : <TreePine className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
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
                      {node.level}
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
                      {/* Reuse CategoryTreeContainer actions or just custom button? 
                          Let's use a simple Edit button for list view for now */}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditNode(node)}>
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>

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
                  <p className="text-xl font-heading font-bold">{editNode.subcategories?.length || 0}</p>
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
              {(editNode.subcategories?.length || 0) > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Subcategories ({editNode.subcategories?.length})
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {editNode.subcategories?.map(c => (
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
