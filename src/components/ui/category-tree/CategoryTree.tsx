import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight, 
  ChevronDown, 
  Package, 
  Folder, 
  FolderOpen,
  MoreHorizontal,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CategoryNode {
  id: string;
  name: string;
  description?: string;
  productCount: number;
  subcategories?: CategoryNode[];
  level: number;
  isExpanded?: boolean;
}

export interface CategoryTreeProps {
  categories: CategoryNode[];
  onCategorySelect?: (category: CategoryNode) => void;
  onCategoryExpand?: (categoryId: string) => void;
  onCategoryAdd?: (parentId?: string) => void;
  onCategoryEdit?: (category: CategoryNode) => void;
  onCategoryDelete?: (categoryId: string) => void;
  selectedCategoryId?: string;
  className?: string;
}

export function CategoryTree({ 
  categories, 
  onCategorySelect,
  onCategoryExpand,
  onCategoryAdd,
  onCategoryEdit,
  onCategoryDelete,
  selectedCategoryId,
  className 
}: CategoryTreeProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (categoryId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedItems(newExpanded);
    onCategoryExpand?.(categoryId);
  };

  const renderCategoryNode = (category: CategoryNode, level: number = 0) => {
    const isExpanded = expandedItems.has(category.id);
    const hasChildren = category.subcategories && category.subcategories.length > 0;
    const isSelected = selectedCategoryId === category.id;
    const indentLevel = Math.min(level, 5); // Cap at 5 levels for visual clarity

    return (
      <div key={category.id} className="select-none">
        {/* Category Item */}
        <div
          className={cn(
            'group flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-all',
            'hover:bg-accent/50 hover:text-accent-foreground',
            'border-l-2',
            isSelected 
              ? 'bg-accent text-accent-foreground border-l-primary' 
              : 'border-l-transparent hover:border-l-border',
            'min-h-[40px]'
          )}
          style={{ 
            paddingLeft: `${12 + (indentLevel * 16)}px`,
            fontSize: `${Math.max(12, 14 - indentLevel)}px`
          }}
          onClick={() => onCategorySelect?.(category)}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 hover:bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(category.id);
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
            </Button>
          )}
          
          {!hasChildren && <div className="w-5" />}

          {/* Category Icon */}
          <div className="flex-shrink-0">
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Folder className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <Package className="h-4 w-4 text-muted-foreground" />
            )}
          </div>

          {/* Category Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{category.name}</span>
              <Badge 
                variant="secondary" 
                className="text-[10px] px-1 py-0 h-4"
              >
                {category.productCount}
              </Badge>
            </div>
            {category.description && level === 0 && (
              <div className="text-[10px] text-muted-foreground truncate mt-0.5">
                {category.description}
              </div>
            )}
          </div>

          {/* Actions Menu */}
          {(onCategoryAdd || onCategoryEdit || onCategoryDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 hover:bg-accent"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onCategoryAdd && (
                  <DropdownMenuItem onClick={() => onCategoryAdd(category.id)}>
                    <Plus className="h-3 w-3 mr-2" />
                    Add Subcategory
                  </DropdownMenuItem>
                )}
                {onCategoryEdit && (
                  <DropdownMenuItem onClick={() => onCategoryEdit(category)}>
                    <Edit2 className="h-3 w-3 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onCategoryDelete && (
                  <DropdownMenuItem 
                    onClick={() => onCategoryDelete(category.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Subcategories */}
        {hasChildren && isExpanded && (
          <div className="ml-2 border-l border-border/50">
            {category.subcategories!.map((subcategory) => 
              renderCategoryNode({ ...subcategory, level: level + 1 }, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-1', className)}>
      {categories.map((category) => renderCategoryNode(category))}
    </div>
  );
}