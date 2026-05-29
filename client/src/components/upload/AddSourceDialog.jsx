import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Link, Upload, X,
  CheckCircle2, AlertCircle, Loader2, Plus
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { uploadPdf, scrapeUrl } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AddSourceDialog({ chatId, onSourceAdded, triggerLabel }) {
  const [open, setOpen] = useState(false);
  function handleClose() { setOpen(false); }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: 'outline', size: triggerLabel ? 'sm' : 'icon' }),
          triggerLabel ? 'gap-1.5 h-7 text-xs px-2.5' : 'h-7 w-7'
        )}
        title="Add source (PDF or URL)"
      >
        <Plus size={12} />
        {triggerLabel && <span>{triggerLabel}</span>}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Source</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pdf" className="mt-1">
          <TabsList className="w-full">
            <TabsTrigger value="pdf" className="flex-1 gap-1.5 text-xs">
              <FileText size={12} /> Upload PDF
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 gap-1.5 text-xs">
              <Link size={12} /> Add URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-4">
            <PdfTab chatId={chatId} onSourceAdded={onSourceAdded} onClose={handleClose} />
          </TabsContent>

          <TabsContent value="url" className="mt-4">
            <UrlTab chatId={chatId} onSourceAdded={onSourceAdded} onClose={handleClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ─── PDF Tab ───────────────────────────────────────────────────────────────────

function PdfTab({ chatId, onSourceAdded, onClose }) {
  const [fileItems, setFileItems] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback((accepted) => {
    setFileItems((prev) => [
      ...prev,
      ...accepted.map((f) => ({ file: f, status: 'pending', message: '' })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    disabled: uploading,
  });

  function removeFile(i) {
    setFileItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleUpload() {
    setUploading(true);
    for (let i = 0; i < fileItems.length; i++) {
      if (fileItems[i].status !== 'pending') continue;
      setFileItems((prev) =>
        prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f)
      );
      try {
        const data = await uploadPdf(chatId, fileItems[i].file);
        onSourceAdded({ id: data.sourceId, name: data.filename, type: 'pdf', chunkCount: data.chunkCount, createdAt: new Date().toISOString() });
        setFileItems((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: 'done', message: `${data.chunkCount} chunks` } : f)
        );
        toast.success(`Indexed "${data.filename}"`);
      } catch (err) {
        setFileItems((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: 'error', message: err.message } : f)
        );
        toast.error(err.message);
      }
    }
    setUploading(false);
  }

  const allDone = fileItems.length > 0 && fileItems.every((f) => f.status === 'done');
  const pendingCount = fileItems.filter((f) => f.status === 'pending').length;

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground mb-0.5">
          {isDragActive ? 'Drop PDFs here…' : 'Drag & drop PDFs here'}
        </p>
        <p className="text-xs text-muted-foreground">or click to browse · Multiple files · Max 10MB</p>
      </div>

      {fileItems.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {fileItems.map((item, i) => (
            <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
              <FileStatusIcon status={item.status} />
              <span className="flex-1 truncate">{item.file.name}</span>
              {item.message && (
                <Badge variant={item.status === 'error' ? 'destructive' : 'secondary'} className="shrink-0 text-[10px]">
                  {item.message}
                </Badge>
              )}
              {item.status === 'pending' && !uploading && (
                <button onClick={() => removeFile(i)} className="shrink-0 text-muted-foreground hover:text-foreground">
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-end gap-2">
        {allDone ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleUpload} disabled={pendingCount === 0 || uploading}>
              {uploading && <Loader2 size={13} className="mr-1.5 animate-spin" />}
              {uploading ? 'Uploading…' : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── URL Tab ───────────────────────────────────────────────────────────────────

function UrlTab({ chatId, onSourceAdded, onClose }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function handleScrape() {
    if (!url.trim()) return;
    setStatus('loading');
    try {
      const data = await scrapeUrl(chatId, url.trim());
      onSourceAdded({ id: data.sourceId, name: data.title, type: 'web', url: data.url, chunkCount: data.chunkCount, createdAt: new Date().toISOString() });
      setStatus('done');
      setMessage(`"${data.title}" — ${data.chunkCount} chunks`);
      toast.success('URL scraped and indexed');
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
      toast.error(err.message);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">Website URL</label>
        <Input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setStatus('idle'); setMessage(''); }}
          placeholder="https://example.com/article"
          disabled={status === 'loading' || status === 'done'}
          onKeyDown={(e) => { if (e.key === 'Enter' && status === 'idle') handleScrape(); }}
        />
      </div>

      {message && (
        <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
          status === 'error'
            ? 'border-destructive/25 bg-destructive/10 text-destructive'
            : 'border-green-500/25 bg-green-500/10 text-green-400'
        }`}>
          {status === 'error'
            ? <AlertCircle size={14} className="mt-0.5 shrink-0" />
            : <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
          <span>{message}</span>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {status === 'done' ? (
          <Button onClick={onClose}>Done</Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleScrape} disabled={!url.trim() || status === 'loading'}>
              {status === 'loading' && <Loader2 size={13} className="mr-1.5 animate-spin" />}
              {status === 'loading' ? 'Scraping…' : 'Scrape & Index'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function FileStatusIcon({ status }) {
  if (status === 'uploading') return <Loader2 size={13} className="shrink-0 animate-spin text-primary" />;
  if (status === 'done') return <CheckCircle2 size={13} className="shrink-0 text-green-400" />;
  if (status === 'error') return <AlertCircle size={13} className="shrink-0 text-destructive" />;
  return <FileText size={13} className="shrink-0 text-muted-foreground" />;
}
