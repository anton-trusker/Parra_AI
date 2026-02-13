import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderTree, Search, ChevronRight, ChevronDown, Package, Trash2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCategoriesWithCounts, useDeleteCategory } from '@/hooks/useProducts';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface TreeNode {
  id: string;
  name: string;
  parent_id: string | null;
  children: TreeNode[];
  productCount: number;
  totalProductCount: number;
}

function buildTree(categories: any[], counts: Record<string, number>): TreeNode[] {
  const lookup = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  for (const cat of categories) {
    lookup.set(cat.id, { id: cat.id, name: cat.name, parent_id: cat.parent_id, children: [], productCount: counts[cat.id] || 0, totalProductCount: 0 });
  }

  for (const cat of categories) {
    const node = lookup.get(cat.id)!;
    if (cat.parent_id && lookup.has(cat.parent_id)) {
      lookup.get(cat.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Calculate total counts (self + descendants)
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

function hasMatch(node: TreeNode, term: string): boolean {
  if (node.name.toLowerCase().includes(term.toLowerCase())) return true;
  return node.children.some(c => hasMatch(c, term));
}

function CategoryRow({ node, depth, expanded, onToggle, onNavigate, onDelete, isAdmin, searchTerm }: {
  node: TreeNode; depth: number; expanded: Set<string>; onToggle: (id: string) => void;
  onNavigate: (id: string) => void; onDelete: (id: string, name: string) => void; isAdmin: boolean; searchTerm: string;
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

        <button onClick={() => onNavigate(node.id)} className="flex-1 text-left text-sm hover:text-accent transition-colors truncate">
          {node.name}
        </button>

        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 shrink-0">
          <Package className="w-3 h-3 mr-0.5" />
          {node.totalProductCount}
        </Badge>

        {isAdmin && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete "{node.name}"?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will deactivate this category{hasChildren ? ` and all ${node.children.length} subcategories` : ''}. Products will remain but become uncategorized.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(node.id, node.name)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
      {(isExpanded || searchTerm) && node.children.map(child => (
        <CategoryRow key={child.id} node={child} depth={depth + 1} expanded={expanded} onToggle={onToggle} onNavigate={onNavigate} onDelete={onDelete} isAdmin={isAdmin} searchTerm={searchTerm} />
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

  const tree = useMemo(() => data ? buildTree(data.categories, data.productCounts) : [], [data]);
  const allIds = useMemo(() => {
    const ids: string[] = [];
    const collect = (nodes: TreeNode[]) => { for (const n of nodes) { ids.push(n.id); collect(n.children); } };
    collect(tree);
    return ids;
  }, [tree]);

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const handleDelete = async (id: string, name: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(`Category "${name}" deleted`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

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
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 bg-card border-border" />
        </div>
        <Button variant="outline" size="sm" className="h-10" onClick={() => setExpanded(new Set(allIds))}>Expand All</Button>
        <Button variant="outline" size="sm" className="h-10" onClick={() => setExpanded(new Set())}>Collapse All</Button>
      </div>

      <div className="wine-glass-effect rounded-xl">
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="p-2">
            {tree.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No categories. Run a Syrve sync first.</p>
              </div>
            ) : (
              tree.map(node => (
                <CategoryRow key={node.id} node={node} depth={0} expanded={expanded} onToggle={toggleExpand}
                  onNavigate={id => navigate(`/products?category=${id}`)} onDelete={handleDelete} isAdmin={isAdmin} searchTerm={search} />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
