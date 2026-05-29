import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Globe, Upload, X, CheckCircle2, AlertCircle, Loader2, Link, ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { uploadPdf, scrapeUrl } from '@/lib/api';
import { toast } from 'sonner';

/**
 * WelcomeScreen — shown when a chat has no sources yet.
 *
 * Displays two side-by-side cards:
 *   Left  → Multi-file PDF dropzone
 *   Right → URL input + scrape
 *
 * Once at least one source is indexed, a "Start chatting" button appears.
 */
export default function WelcomeScreen({ chatId, onSourceAdded }) {
  const [pdfItems, setPdfItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState('idle'); // idle | loading | done | error
  const [urlMsg, setUrlMsg] = useState('');
  const [indexedCount, setIndexedCount] = useState(0);

  // ── PDF Drop ──────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    setPdfItems((prev) => [
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

  function removePdf(i) {
    setPdfItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleUploadPdfs() {
    const pending = pdfItems.filter((f) => f.status === 'pending');
    if (pending.length === 0) return;
    setUploading(true);

    for (let i = 0; i < pdfItems.length; i++) {
      if (pdfItems[i].status !== 'pending') continue;
      setPdfItems((prev) =>
        prev.map((f, idx) => idx === i ? { ...f, status: 'uploading' } : f)
      );
      try {
        const data = await uploadPdf(chatId, pdfItems[i].file);
        onSourceAdded({ id: data.sourceId, name: data.filename, type: 'pdf', chunkCount: data.chunkCount, createdAt: new Date().toISOString() });
        setPdfItems((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: 'done', message: `${data.chunkCount} chunks` } : f)
        );
        setIndexedCount((n) => n + 1);
        toast.success(`Indexed "${data.filename}"`);
      } catch (err) {
        setPdfItems((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: 'error', message: err.message } : f)
        );
        toast.error(err.message);
      }
    }
    setUploading(false);
  }

  // ── URL Scrape ────────────────────────────────────────────────────────────
  async function handleScrapeUrl() {
    if (!url.trim()) return;
    setUrlStatus('loading');
    setUrlMsg('');
    try {
      const data = await scrapeUrl(chatId, url.trim());
      onSourceAdded({ id: data.sourceId, name: data.title, type: 'web', url: data.url, chunkCount: data.chunkCount, createdAt: new Date().toISOString() });
      setUrlStatus('done');
      setUrlMsg(`"${data.title}" — ${data.chunkCount} chunks`);
      setIndexedCount((n) => n + 1);
      toast.success('URL scraped and indexed');
    } catch (err) {
      setUrlStatus('error');
      setUrlMsg(err.message);
      toast.error(err.message);
    }
  }

  const hasPending = pdfItems.some((f) => f.status === 'pending');
  const pendingCount = pdfItems.filter((f) => f.status === 'pending').length;

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-3xl flex flex-col gap-8">

        {/* ── Hero heading ─────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="mb-3 bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            What can I help you with?
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Upload PDFs or add a URL — then ask anything. Your documents stay private to this chat.
          </p>
        </div>

        {/* ── Two source cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* PDF Card */}
          <div className="source-card flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="leading-tight">Upload PDFs</h3>
                <p className="text-xs text-muted-foreground">Multiple files supported</p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-0.5">
                {isDragActive ? 'Drop files here…' : 'Drag & drop PDFs'}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse · Max 10MB each</p>
            </div>

            {/* File list */}
            {pdfItems.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {pdfItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    <PdfStatusIcon status={item.status} />
                    <span className="flex-1 truncate text-foreground/80">{item.file.name}</span>
                    {item.message && (
                      <Badge variant={item.status === 'error' ? 'destructive' : 'secondary'} className="shrink-0 text-[10px]">
                        {item.message}
                      </Badge>
                    )}
                    {item.status === 'pending' && !uploading && (
                      <button onClick={() => removePdf(i)} className="shrink-0 text-muted-foreground hover:text-foreground">
                        <X size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {hasPending && (
              <Button onClick={handleUploadPdfs} disabled={uploading} className="w-full">
                {uploading && <Loader2 size={14} className="mr-2 animate-spin" />}
                {uploading ? 'Uploading…' : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>

          {/* URL Card */}
          <div className="source-card flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="leading-tight">Add a URL</h3>
                <p className="text-xs text-muted-foreground">Articles, docs, any webpage</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 flex-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setUrlStatus('idle'); setUrlMsg(''); }}
                    placeholder="https://example.com/article"
                    disabled={urlStatus === 'loading'}
                    className="pl-9 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter' && urlStatus === 'idle') handleScrapeUrl(); }}
                  />
                </div>
                <Button
                  onClick={handleScrapeUrl}
                  disabled={!url.trim() || urlStatus === 'loading'}
                  variant="outline"
                >
                  {urlStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> : 'Scrape'}
                </Button>
              </div>

              {/* URL status */}
              {urlMsg && (
                <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                  urlStatus === 'error'
                    ? 'border-destructive/25 bg-destructive/8 text-destructive'
                    : 'border-green-500/25 bg-green-500/8 text-green-400'
                }`}>
                  {urlStatus === 'error'
                    ? <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    : <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
                  <span className="leading-snug">{urlMsg}</span>
                </div>
              )}

              {/* Add more URLs hint */}
              {urlStatus === 'done' && (
                <button
                  onClick={() => { setUrl(''); setUrlStatus('idle'); setUrlMsg(''); }}
                  className="text-xs text-muted-foreground hover:text-foreground underline text-left transition-colors"
                >
                  + Add another URL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Ready to chat ─────────────────────────────────────── */}
        {indexedCount > 0 && (
          <div className="animate-fade-in text-center">
            <p className="mb-3 text-sm text-muted-foreground">
              {indexedCount} source{indexedCount !== 1 ? 's' : ''} indexed — you can now ask questions below ↓
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PdfStatusIcon({ status }) {
  if (status === 'uploading') return <Loader2 size={14} className="shrink-0 animate-spin text-primary" />;
  if (status === 'done') return <CheckCircle2 size={14} className="shrink-0 text-green-400" />;
  if (status === 'error') return <AlertCircle size={14} className="shrink-0 text-destructive" />;
  return <FileText size={14} className="shrink-0 text-muted-foreground" />;
}
