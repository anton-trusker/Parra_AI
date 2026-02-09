import { useState } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHasPermission } from '@/stores/authStore';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Shield, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  ALL_MODULES,
  ALL_PERMISSION_LEVELS,
  type AppRole,
  type ModuleKey,
  type PermissionLevel,
} from '@/data/referenceData';

export default function RolesPermissions() {
  const canAccess = useHasPermission('settings', 'full');
  const { roles, addRole, removeRole, setRolePermission } = useSettingsStore();
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#22c55e');
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set(roles.length <= 2 ? roles.map(r => r.id) : []));

  if (!canAccess) return <Navigate to="/dashboard" replace />;

  const toggleRole = (id: string) => {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAddRole = () => {
    if (!newRoleName.trim()) { toast.error('Enter a role name'); return; }
    const defaultPerms: Record<ModuleKey, PermissionLevel> = {} as any;
    ALL_MODULES.forEach((m) => { defaultPerms[m.key] = 'none'; });
    defaultPerms.dashboard = 'view';

    const newRole: AppRole = {
      id: `role_${Date.now()}`,
      name: newRoleName.trim(),
      color: newRoleColor,
      isBuiltin: false,
      permissions: defaultPerms,
    };
    addRole(newRole);
    setNewRoleName('');
    setExpandedRoles(prev => new Set([...prev, newRole.id]));
    toast.success(`Role "${newRole.name}" created`);
  };

  const getPermSummary = (role: AppRole) => {
    const active = Object.values(role.permissions).filter(v => v !== 'none').length;
    return `${active}/${ALL_MODULES.length} modules`;
  };

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

      {/* Roles list with collapsible permission matrices */}
      <div className="space-y-3">
        {roles.map((role) => {
          const isOpen = expandedRoles.has(role.id);
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
                            <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium">Module</th>
                            {ALL_PERMISSION_LEVELS.map((l) => (
                              <th key={l.value} className="text-center py-2 px-2 text-xs text-muted-foreground font-medium w-16">
                                {l.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {ALL_MODULES.map((m, idx) => (
                            <tr key={m.key} className={`border-b border-border/50 ${idx % 2 === 0 ? 'bg-secondary/20' : ''} hover:bg-secondary/40 transition-colors`}>
                              <td className="py-2.5 pr-4 text-sm">{m.label}</td>
                              {ALL_PERMISSION_LEVELS.map((l) => (
                                <td key={l.value} className="text-center py-2.5 px-2">
                                  <button
                                    onClick={() => { setRolePermission(role.id, m.key, l.value); toast.success('Permission updated'); }}
                                    disabled={role.isBuiltin && role.id === 'role_admin'}
                                    className={`w-5 h-5 rounded-full border-2 transition-colors mx-auto flex items-center justify-center ${
                                      role.permissions[m.key] === l.value
                                        ? 'border-accent bg-accent'
                                        : 'border-border hover:border-muted-foreground'
                                    } ${role.isBuiltin && role.id === 'role_admin' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                  >
                                    {role.permissions[m.key] === l.value && (
                                      <div className="w-2 h-2 rounded-full bg-accent-foreground" />
                                    )}
                                  </button>
                                </td>
                              ))}
                            </tr>
                          ))}
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
