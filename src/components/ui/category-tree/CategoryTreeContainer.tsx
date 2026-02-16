import React, { useState } from 'react';
import { CategoryTree, CategoryNode } from './CategoryTree';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Expand, 
  Collapse,
  Filter,
  FolderPlus
} from 'lucide-react';

interface CategoryTreeContainerProps {
  categories: CategoryNode[];
  onCategorySelect?: (category: CategoryNode) => void;
  onCategoryExpand?: (categoryId: string) => void;
  onCategoryAdd?: (parentId?: string) => void;
  onCategoryEdit?: (category: CategoryNode) => void;
  onCategoryDelete?: (categoryId: string) => void;
  selectedCategoryId?: string;
  className?: string;
  title?: string;
  showSearch?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

export function CategoryTreeContainer({
  categories,
  onCategorySelect,
  onCategoryExpand,
  onCategoryAdd,
  onCategoryEdit,
  onCategoryDelete,
  selectedCategoryId,
  className,
  title = "Categories",
  showSearch = true,
  showActions = true,
  compact = false
}: CategoryTreeContainerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAll, setExpandedAll] = useState(false);

  const getAllCategoryIds = (cats: CategoryNode[]): string[] => {
    let ids: string[] = [];
    cats.forEach(cat => {
      ids.push(cat.id);
      if (cat.subcategories) {
        ids = [...ids, ...getAllCategoryIds(cat.subcategories)];
      }
    });
    return ids;
  };

  const expandAll = () => {
    const allIds = getAllCategoryIds(categories);
    allIds.forEach(id => onCategoryExpand?.(id));
    setExpandedAll(true);
  };

  const collapseAll = () => {
    setExpandedAll(false);
  };

  const filterCategories = (cats: CategoryNode[]): CategoryNode[] => {
    if (!searchTerm) return cats;
    
    return cats.filter(cat => {
      const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const hasMatchingChildren = cat.subcategories && 
                                  filterCategories(cat.subcategories).length > 0;
      
      return matchesSearch || hasMatchingChildren;
    }).map(cat => ({
      ...cat,
      subcategories: cat.subcategories ? filterCategories(cat.subcategories) : undefined
    }));
  };

  const getTotalCategories = (cats: CategoryNode[]): number => {
    let total = cats.length;
    cats.forEach(cat => {
      if (cat.subcategories) {
        total += getTotalCategories(cat.subcategories);
      }
    });
    return total;
  };

  const getTotalProducts = (cats: CategoryNode[]): number => {
    let total = cats.reduce((sum, cat) => sum + cat.productCount, 0);
    cats.forEach(cat => {
      if (cat.subcategories) {
        total += getTotalProducts(cat.subcategories);
      }
    });
    return total;
  };

  const filteredCategories = filterCategories(categories);
  const totalCategories = getTotalCategories(categories);
  const totalProducts = getTotalProducts(categories);

  return (
    <Card className={cn(
      'h-full flex flex-col',
      compact && 'text-xs',
      className
    )}>
      <CardHeader className={cn(
        'flex flex-row items-center justify-between space-y-0 pb-3',
        compact && 'py-3 px-4'
      )}>
        <div className="flex items-center gap-2">
          <CardTitle className={cn(
            'text-sm font-semibold',
            compact && 'text-xs'
          )}>
            {title}
          </CardTitle>
          <Badge variant="secondary" className={cn(
            'text-[10px] px-1 py-0 h-4',
            compact && 'text-[9px]'
          )}>
            {totalCategories}
          </Badge>
          <Badge variant="outline" className={cn(
            'text-[10px] px-1 py-0 h-4',
            compact && 'text-[9px]'
          )}>
            {totalProducts} items
          </Badge>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                compact && 'h-6 w-6'
              )}
              onClick={expandedAll ? collapseAll : expandAll}
              title={expandedAll ? "Collapse all" : "Expand all"}
            >
              {expandedAll ? (
                <Collapse className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />
              ) : (
                <Expand className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                compact && 'h-6 w-6'
              )}
              onClick={() => onCategoryAdd?.()}
              title="Add category"
            >
              <Plus className={cn('h-3 w-3', compact && 'h-2.5 w-2.5')} />
            </Button>
          </div>
        )}
      </CardHeader>
      
      {showSearch && (
        <div className={cn(
          'px-4 pb-3',
          compact && 'px-3 pb-2'
        )}>
          <div className="relative">
            <Search className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground',
              compact ? 'h-3 w-3' : 'h-3.5 w-3.5'
            )} />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'pl-7',
                compact && 'h-7 text-xs'
              )}
            />
          </div>
        </div>
      )}
      
      <CardContent className={cn(
        'flex-1 overflow-auto p-0',
        compact && 'p-0'
      )}>
        <div className={cn(
          'p-3',
          compact && 'p-2'
        )}>
          <CategoryTree
            categories={filteredCategories}
            onCategorySelect={onCategorySelect}
            onCategoryExpand={onCategoryExpand}
            onCategoryAdd={onCategoryAdd}
            onCategoryEdit={onCategoryEdit}
            onCategoryDelete={onCategoryDelete}
            selectedCategoryId={selectedCategoryId}
          />
        </div>
      </CardContent>
    </Card>
  );
}