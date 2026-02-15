import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  parseCSVFile, autoMapColumns, validateRows, generateTemplate,
  COLUMN_DEFINITIONS, ParsedCSV, ColumnMapping, ValidationResult,
} from '@/utils/csvParser';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, Download, ArrowLeft, ArrowRight, Check, AlertTriangle,
  FileSpreadsheet, CheckCircle2, XCircle, Eye, EyeOff, Loader2,
} from 'lucide-react';

const STEPS = ['Upload', 'Map Columns', 'Preview', 'Confirm'];

export default function ImportInventory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const existingSkus = useMemo(() => [] as string[], []);

  // ── Step 1: Upload ──
  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.csv')) {
      toast({ title: 'Invalid file', description: 'Please upload a .csv file', variant: 'destructive' });
      return;
    }
    setFile(f);
    try {
      const result = await parseCSVFile(f);
      setParsed(result);
      const autoMapped = autoMapColumns(result.headers);
      setMappings(autoMapped);
    } catch {
      toast({ title: 'Parse error', description: 'Failed to parse CSV file', variant: 'destructive' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  // ── Step 2: Mapping ──
  const updateMapping = (index: number, systemField: string) => {
    setMappings(prev => prev.map((m, i) => i === index ? { ...m, systemField } : m));
  };

  const requiredFields = COLUMN_DEFINITIONS.filter(c => c.required).map(c => c.key);
  const mappedFields = mappings.map(m => m.systemField).filter(f => f !== 'skip');
  const missingRequired = requiredFields.filter(f => !mappedFields.includes(f));

  // ── Step 3: Preview ──
  const runValidation = () => {
    if (!parsed) return;
    const result = validateRows(parsed.rows, mappings, existingSkus);
    setValidation(result);
  };

  const errorRowSet = useMemo(() => new Set(validation?.skippedRows || []), [validation]);
  const errorsForRow = (rowIdx: number) => validation?.errors.filter(e => e.row === rowIdx) || [];

  // ── Step 4: Import ──
  const handleImport = () => {
    if (!validation) return;
    setImporting(true);
    const toImport = validation.validRows.filter((_, i) => !errorRowSet.has(i));

    setTimeout(() => {
      // TODO: Implement actual product import via Supabase
      const importCount = toImport.length;
      setImporting(false);
      toast({ title: 'Import complete', description: `${importCount} products imported successfully` });
      navigate('/products');
    }, 800);
  };

  const goNext = () => {
    if (step === 1) runValidation();
    setStep(s => Math.min(s + 1, 3));
  };

  const canNext = () => {
    if (step === 0) return !!parsed && parsed.rows.length > 0;
    if (step === 1) return missingRequired.length === 0;
    if (step === 2) return !!validation;
    return false;
  };

  const importableCount = validation ? validation.validRows.length - (validation.skippedRows.length) : 0;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/catalog')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold">Import Inventory</h1>
          <p className="text-muted-foreground mt-1">Upload a CSV file to bulk-import wines</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === step ? 'bg-primary text-primary-foreground' :
              i < step ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
            }`}>
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="wine-glass-effect rounded-xl p-6">
        {/* ── STEP 0: Upload ── */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold">Upload CSV File</h2>
              <Button variant="outline" size="sm" onClick={generateTemplate}>
                <Download className="w-4 h-4 mr-2" /> Download Template
              </Button>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
                dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'
              }`}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Drag & drop your CSV file here</p>
              <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              <input id="csv-input" type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            </div>

            {parsed && file && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{parsed.rows.length} rows · {parsed.headers.length} columns</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            )}
          </div>
        )}

        {/* ── STEP 1: Column Mapping ── */}
        {step === 1 && parsed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold">Map Columns</h2>
              <Button variant="outline" size="sm" onClick={() => setMappings(autoMapColumns(parsed.headers))}>
                Auto-detect
              </Button>
            </div>

            {missingRequired.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span>Missing required fields: <strong>{missingRequired.map(k => COLUMN_DEFINITIONS.find(c => c.key === k)?.label).join(', ')}</strong></span>
              </div>
            )}

            <div className="space-y-2">
              {mappings.map((m, i) => {
                const isMapped = m.systemField !== 'skip';
                const isRequired = requiredFields.includes(m.systemField);
                const preview = parsed.rows.slice(0, 3).map(r => r[i] || '').join(' | ');

                return (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                    isMapped ? 'border-primary/20 bg-primary/5' : 'border-border'
                  }`}>
                    <div className="w-5 flex justify-center">
                      {isMapped ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <XCircle className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.csvHeader}</p>
                      <p className="text-xs text-muted-foreground truncate">{preview || '(empty)'}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Select value={m.systemField} onValueChange={v => updateMapping(i, v)}>
                      <SelectTrigger className={`w-48 ${isRequired ? 'border-primary/40' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="skip">Skip</SelectItem>
                        {COLUMN_DEFINITIONS.map(c => (
                          <SelectItem key={c.key} value={c.key}>
                            {c.label}{c.required ? ' *' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === 2 && validation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-heading font-semibold">Preview & Validate</h2>
              <Button variant="outline" size="sm" onClick={() => setShowErrorsOnly(!showErrorsOnly)}>
                {showErrorsOnly ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
                {showErrorsOnly ? 'Show all' : 'Errors only'}
              </Button>
            </div>

            {validation.skippedRows.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                <span>{validation.skippedRows.length} rows have errors — fix in your CSV or they will be skipped</span>
              </div>
            )}

            <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    {mappings.filter(m => m.systemField !== 'skip').map(m => (
                      <TableHead key={m.csvHeader}>
                        {COLUMN_DEFINITIONS.find(c => c.key === m.systemField)?.label || m.systemField}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validation.validRows
                    .map((row, idx) => ({ row, idx }))
                    .filter(({ idx }) => !showErrorsOnly || errorRowSet.has(idx))
                    .map(({ row, idx }) => {
                      const rowErrors = errorsForRow(idx);
                      const hasErr = rowErrors.length > 0;
                      return (
                        <TableRow key={idx} className={hasErr ? 'bg-destructive/5' : ''}>
                          <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                          {mappings.filter(m => m.systemField !== 'skip').map(m => {
                            const cellErr = rowErrors.find(e => e.field === m.systemField);
                            return (
                              <TableCell key={m.systemField} className={cellErr ? 'text-destructive font-medium' : ''} title={cellErr?.message}>
                                {row[m.systemField] || '—'}
                                {cellErr && <span className="block text-[10px]">{cellErr.message}</span>}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ── STEP 3: Confirm ── */}
        {step === 3 && validation && (
          <div className="space-y-6 text-center py-6">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-primary" />
            <h2 className="text-xl font-heading font-semibold">Ready to Import</h2>

            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-2xl font-bold text-primary">{importableCount}</p>
                <p className="text-xs text-muted-foreground">To import</p>
              </div>
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-2xl font-bold text-accent">{validation.errors.length}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-2xl font-bold text-destructive">{validation.skippedRows.length}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
            </div>

            <Button
              className="wine-gradient text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 px-8"
              onClick={handleImport}
              disabled={importing || importableCount === 0}
            >
              {importing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
              {importing ? 'Importing...' : `Import ${importableCount} Wines`}
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 3 && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => step === 0 ? navigate('/catalog') : setStep(s => s - 1)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button onClick={goNext} disabled={!canNext()}>
            Next <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
      {step === 3 && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={() => setStep(2)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
        </div>
      )}
    </div>
  );
}
