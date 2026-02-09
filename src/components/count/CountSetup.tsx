import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CountSetupProps {
  countType: string;
  onCountTypeChange: (v: string) => void;
  onStart: () => void;
}

export default function CountSetup({ countType, onCountTypeChange, onStart }: CountSetupProps) {
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-heading font-bold">Start Inventory Count</h1>
        <p className="text-muted-foreground mt-1">Set up a new counting session</p>
      </div>

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
          <Textarea placeholder="e.g., Weekly count" className="bg-card border-border" />
        </div>

        <Button
          onClick={onStart}
          className="w-full h-14 text-lg font-semibold wine-gradient text-primary-foreground hover:opacity-90"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Counting
        </Button>
      </div>
    </div>
  );
}
