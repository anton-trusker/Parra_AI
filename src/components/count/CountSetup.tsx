import { Play, Loader2, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface CountSetupProps {
  countType: string;
  onCountTypeChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  onStart: () => void;
  isLoading?: boolean;
  activeSession?: any;
  onJoinSession?: () => void;
}

export default function CountSetup({ countType, onCountTypeChange, notes, onNotesChange, onStart, isLoading, activeSession, onJoinSession }: CountSetupProps) {
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Start Inventory Count</h1>
        <p className="text-muted-foreground mt-1">Set up a new counting session</p>
      </div>

      {/* Active session warning */}
      {activeSession && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Active Session Found</p>
              <p className="text-xs text-muted-foreground mt-1">
                "{activeSession.session_name}" is currently in progress. You can join this session or start a new one.
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0">In Progress</Badge>
          </div>
          <Button variant="outline" className="w-full gap-2" onClick={onJoinSession}>
            <Users className="w-4 h-4" />
            Join Active Session
          </Button>
        </div>
      )}

      <div className="wine-glass-effect rounded-xl p-6 space-y-5">
        <div className="space-y-2">
          <Label>Count Type</Label>
          <Select value={countType} onValueChange={onCountTypeChange}>
            <SelectTrigger className="h-12 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full Inventory</SelectItem>
              <SelectItem value="partial">Partial Count</SelectItem>
              <SelectItem value="spot">Spot Check</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="e.g., Weekly count"
            className="bg-card border-border"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        <Button
          onClick={onStart}
          disabled={isLoading}
          className="w-full h-14 text-lg font-semibold wine-gradient text-primary-foreground hover:opacity-90"
        >
          {isLoading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Play className="w-5 h-5 mr-2" />}
          Start New Session
        </Button>
      </div>
    </div>
  );
}
