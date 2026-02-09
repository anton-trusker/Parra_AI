import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHasPermission } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ALL_MODULES,
  ALL_PERMISSION_LEVELS,
  buildPermissions,
  permKey,
  type AppRole,
  type ModuleKey,
  type PermissionLevel,
} from '@/data/referenceData';

export default function RolesPermissions() {
  const canAccess = useHasPermission('settings', 'full');
  const { roles, addRole, removeRole, setRolePermission, setModulePermissions } = useSettingsStore();
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#22c55e');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(roles.length <= 2 ? roles.map(r => r.id) : []));
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  const toggleRole = (id: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleModule = (roleId: string, moduleKey: string) => {
    const compositeKey = `${roleId}:${moduleKey}`;
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(compositeKey)) next.delete(compositeKey); else next.add(compositeKey);
      return next;
    });
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) { toast.error('Enter a role name'); return; }
    const newRole: AppRole = {
      id: `role_${Date.now()}`,
      name: newRoleName.trim(),
      color: newRoleColor,
      isBuiltin: false,
      permissions: { ...buildPermissions('none'), 'dashboard.view_analytics': 'view' },
    };
    addRole(newRole);
    setNewRoleName('');
    setExpandedRoles(prev => new Set([...prev, newRole.id]));
    toast.success(`Role "${newRole.name}" created`);
  };

  const getPermSummary = (role: AppRole) => {
    const active = Object.values(role.permissions).filter(v => v !== 'none').length;
    const total = Object.keys(role.permissions).length;
    return `${active}/${total} permissions`;
  };

  const getModuleSummary = (role: AppRole, moduleKey: ModuleKey) => {
    const mod = ALL_MODULES.find(m => m.key === moduleKey)!;
    const active = mod.subActions.filter(a => (role.permissions[permKey(moduleKey, a.key)] ?? 'none') !== 'none').length;
    return `${active}/${mod.subActions.length}`;
  };

  const getModuleHighestLevel = (role: AppRole, moduleKey: ModuleKey): PermissionLevel => {
    const mod = ALL_MODULES.find(m => m.key === moduleKey)!;
    const hierarchy: PermissionLevel[] = ['none', 'view', 'edit', 'full'];
    let best = 0;
    mod.subActions.forEach(a => {
      const lvl = hierarchy.indexOf(role.permissions[permKey(moduleKey, a.key)] ?? 'none');
      if (lvl > best) best = lvl;
    });
    return hierarchy[best];
  };

  const isAdminLocked = (role: AppRole) => role.isBuiltin && role.id === 'role_admin';

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/settings" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>
        <span>/</span>
        <span className="text-foreground">Roles & Permissions</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-heading font-bold">Roles & Permissions</h1>
      </div>

      {/* Add new role */}
      <div className="wine-glass-effect rounded-xl p-5 space-y-3">
        <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Create New Role
        </h3>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs">Role Name</Label>
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="e.g. Sommelier"
              className="bg-secondary border-border w-44"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddRole(); }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Color</Label>
            <input
              type="color"
              value={newRoleColor}
              onChange={(e) => setNewRoleColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-secondary"
            />
          </div>
          <Button size="sm" onClick={handleAddRole} className="wine-gradient text-primary-foreground">
            <Plus className="w-4 h-4 mr-1" /> Add Role
          </Button>
        </div>
      </div>

      {/* Roles list */}
      <div className="space-y-3">
        {roles.map((role) => {
          const isOpen = expandedRoles.has(role.id);
          const locked = isAdminLocked(role);
          return (
            <Collapsible key={role.id} open={isOpen} onOpenChange={() => toggleRole(role.id)}>
              <div className="wine-glass-effect rounded-xl overflow-hidden">
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role.color }} />
                      <h3 className="font-heading font-semibold text-lg">{role.name}</h3>
                      {role.isBuiltin && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">Built-in</span>
                      )}
                      <span className="text-xs text-muted-foreground">{getPermSummary(role)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!role.isBuiltin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); removeRole(role.id); toast.success('Role deleted'); }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-5 pb-5">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">Module / Action</th>
                            {ALL_PERMISSION_LEVELS.map((l) => (
                              <th key={l.value} className="text-center py-2 px-2 text-xs text-muted-foreground font-medium w-16">
                                {l.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ALL_MODULES.map((mod) => {
                            const moduleCompositeKey = `${role.id}:${mod.key}`;
                            const isModuleOpen = expandedModules.has(moduleCompositeKey);
                            const highestLevel = getModuleHighestLevel(role, mod.key);
                            const summary = getModuleSummary(role, mod.key);

                            return (
                              <ModuleRow
                                key={mod.key}
                                mod={mod}
                                role={role}
                                isOpen={isModuleOpen}
                                onToggle={() => toggleModule(role.id, mod.key)}
                                highestLevel={highestLevel}
                                summary={summary}
                                locked={locked}
                                onSetModuleLevel={(level) => {
                                  setModulePermissions(role.id, mod.key, level);
                                  toast.success(`All ${mod.label} permissions set to ${level}`);
                                }}
                                onSetSubActionLevel={(actionKey, level) => {
                                  setRolePermission(role.id, permKey(mod.key, actionKey), level);
                                }}
                              />
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}

// Sub-component for module row + sub-action rows
function ModuleRow({
  mod, role, isOpen, onToggle, highestLevel, summary, locked,
  onSetModuleLevel, onSetSubActionLevel,
}: {
  mod: (typeof ALL_MODULES)[0];
  role: AppRole;
  isOpen: boolean;
  onToggle: () => void;
  highestLevel: PermissionLevel;
  summary: string;
  locked: boolean;
  onSetModuleLevel: (level: PermissionLevel) => void;
  onSetSubActionLevel: (actionKey: string, level: PermissionLevel) => void;
}) {
  return (
    <>
      {/* Module header row */}
      <tr className="border-b border-border bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer" onClick={onToggle}>
        <td className="py-2.5 pr-4">
          <div className="flex items-center gap-2 font-medium">
            {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            <span>{mod.label}</span>
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">{summary}</span>
          </div>
        </td>
        {ALL_PERMISSION_LEVELS.map((l) => (
          <td key={l.value} className="text-center py-2.5 px-2">
            <button
              onClick={(e) => { e.stopPropagation(); if (!locked) onSetModuleLevel(l.value); }}
              disabled={locked}
              title={`Set all ${mod.label} to ${l.label}`}
              className={`w-5 h-5 rounded-sm border-2 transition-colors mx-auto flex items-center justify-center ${
                highestLevel === l.value && allSame(role, mod)
                  ? 'border-accent bg-accent'
                  : 'border-border/60 hover:border-muted-foreground'
              } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {highestLevel === l.value && allSame(role, mod) && (
                <div className="w-2 h-2 rounded-sm bg-accent-foreground" />
              )}
            </button>
          </td>
        ))}
      </tr>
      {/* Sub-action rows */}
      {isOpen && mod.subActions.map((action, idx) => {
        const key = permKey(mod.key, action.key);
        const currentLevel = role.permissions[key] ?? 'none';
        return (
          <tr key={action.key} className={`border-b border-border/30 ${idx % 2 === 0 ? 'bg-background' : 'bg-secondary/10'} hover:bg-secondary/20 transition-colors`}>
            <td className="py-2 pr-4 pl-10 text-sm text-muted-foreground">{action.label}</td>
            {ALL_PERMISSION_LEVELS.map((l) => (
              <td key={l.value} className="text-center py-2 px-2">
                <button
                  onClick={() => { if (!locked) onSetSubActionLevel(action.key, l.value); }}
                  disabled={locked}
                  className={`w-5 h-5 rounded-full border-2 transition-colors mx-auto flex items-center justify-center ${
                    currentLevel === l.value
                      ? 'border-accent bg-accent'
                      : 'border-border hover:border-muted-foreground'
                  } ${locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {currentLevel === l.value && (
                    <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                  )}
                </button>
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}

// Check if all sub-actions in a module share the same permission level
function allSame(role: AppRole, mod: (typeof ALL_MODULES)[0]): boolean {
  if (mod.subActions.length === 0) return true;
  const first = role.permissions[permKey(mod.key, mod.subActions[0].key)] ?? 'none';
  return mod.subActions.every(a => (role.permissions[permKey(mod.key, a.key)] ?? 'none') === first);
}
