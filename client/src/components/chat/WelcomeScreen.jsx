import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Globe, Link, Upload, X,
  CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { uploadPdf, scrapeUrl } from '@/lib/api';
import { toast } from 'sonner';

// File item shape: { id, file, status: 'pending'|'uploading'|'done'|'error', message }

let _id = 0;
function nextId() { return ++_id; }

export default function WelcomeScreen({ chatId, onSourceAdded }) {
  // ── PDF state ──────────────────────────────────────────────────────────────
  const [pdfItems, setPdfItems] = useState([]);
  const [uploading, setUploading] = useState(false);

  // ── URL state ──────────────────────────────────────────────────────────────
  const [url, setUrl] = useState('');
  const [urlStatus, setUrlStatus] = useState('idle'); // idle | loading | done | error
  const [urlMsg, setUrlMsg] = useState('');
  const [scraping, setScraping] = useState(false);

  // Track how many sources have been indexed (for "ready to chat" message)
  const indexedCount = pdfItems.filter((f) => f.status === 'done').length
    + (urlStatus === 'done' ? 1 : 0);

  // ── PDF Drop ──────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted) => {
    setPdfItems((prev) => [
      ...prev,
      ...accepted.map((f) => ({ id: nextId(), file: f, status: 'pending', message: '' })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
    // Dropzone is disabled while uploading so user can't add files mid-upload
    disabled: uploading,
  });

  function removePdf(id) {
    if (uploading) return;
    setPdfItems((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleUploadPdfs() {
    // Snapshot pending items at call time — avoids stale-closure issues
    const toUpload = pdfItems.filter((f) => f.status === 'pending');
    if (toUpload.length === 0 || uploading) return;

    setUploading(true);

    // Upload sequentially so the server isn't flooded.
    // URL scraping can still happen concurrently (separate state).
    for (const item of toUpload) {
      // Mark this specific file as uploading
      setPdfItems((prev) =>
        prev.map((f) => f.id === item.id ? { ...f, status: 'uploading' } : f)
      );

      try {
        const data = await uploadPdf(chatId, item.file);
        onSourceAdded({
          id: data.sourceId,
          name: data.filename,
          type: 'pdf',
          chunkCount: data.chunkCount,
          createdAt: new Date().toISOString(),
        });
        setPdfItems((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'done', message: `${data.chunkCount} chunks` } : f
          )
        );
        toast.success(`Indexed "${data.filename}"`);
      } catch (err) {
        setPdfItems((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'error', message: err.message } : f
          )
        );
        toast.error(`"${item.file.name}": ${err.message}`);
        // Continue to next file on error — don't abort the whole batch
      }
    }

    setUploading(false);
  }

  // ── URL Scrape ────────────────────────────────────────────────────────────
  // Runs independently from PDF up`loads — both can be in progress at once.
  async function handleScrapeUrl() {
    if (!url.trim() || scraping) return;
    setScraping(true);
    setUrlStatus('loading');
    setUrlMsg('');

    try {
      const data = await scrapeUrl(chatId, url.trim());
      onSourceAdded({
        id: data.sourceId,
        name: data.title,
        type: 'web',
        url: data.url,
        chunkCount: data.chunkCount,
        createdAt: new Date().toISOString(),
      });
      setUrlStatus('done');
      setUrlMsg(`"${data.title}" — ${data.chunkCount} chunks indexed`);
      toast.success('URL scraped and indexed');
    } catch (err) {
      setUrlStatus('error');
      setUrlMsg(err.message);
      toast.error(err.message);
    } finally {
      setScraping(false);
    }
  }

  const pendingCount = pdfItems.filter((f) => f.status === 'pending').length;

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 animate-fade-in">
      <div className="w-full max-w-3xl flex flex-col gap-8">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="text-center">
          <h1 className="mb-3 bg-gradient-to-br from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            What can I help you with?
          </h1>
          <p className="text-muted-foreground text-base max-w-md mx-auto leading-relaxed">
            Upload PDFs or add a URL — then ask anything.
            Your documents are private to this chat session.
          </p>
        </div>

        {/* ── Two source cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* PDF Card */}
          <div className="source-card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 text-red-400">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="mb-0 leading-tight">Upload PDFs</h3>
                <p className="text-xs text-muted-foreground">Multiple files, sequential upload</p>
              </div>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload size={20} className="mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground mb-1">
                {isDragActive ? 'Drop files here…' : 'Drag & drop PDFs'}
              </p>
              <p className="text-xs text-muted-foreground">or click to browse · Max 10MB each</p>
            </div>

            {/* File list */}
            {pdfItems.length > 0 && (
              <ul className="flex flex-col gap-1.5">
                {pdfItems.map((item) => (
                  <li key={item.id} className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    <PdfStatusIcon status={item.status} />
                    <span className="flex-1 truncate text-foreground/80">{item.file.name}</span>
                    {item.message && (
                      <Badge
                        variant={item.status === 'error' ? 'destructive' : 'secondary'}
                        className="shrink-0 text-[10px]"
                      >
                        {item.message}
                      </Badge>
                    )}
                    {item.status === 'pending' && !uploading && (
                      <button
                        onClick={() => removePdf(item.id)}
                        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {pendingCount > 0 && (
              <Button onClick={handleUploadPdfs} disabled={uploading} className="w-full">
                {uploading && <Loader2 size={14} className="mr-2 animate-spin" />}
                {uploading
                  ? 'Uploading…'
                  : `Upload ${pendingCount} file${pendingCount !== 1 ? 's' : ''}`}
              </Button>
            )}
          </div>

          {/* URL Card */}
          <div className="source-card flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <Globe size={20} />
              </div>
              <div>
                <h3 className="mb-0 leading-tight">Add a URL</h3>
                <p className="text-xs text-muted-foreground">Articles, docs, any webpage</p>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (urlStatus !== 'idle') { setUrlStatus('idle'); setUrlMsg(''); }
                    }}
                    placeholder="https://example.com/article"
                    disabled={scraping}
                    className="pl-9 text-sm"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleScrapeUrl(); }}
                  />
                </div>
                <Button
                  onClick={handleScrapeUrl}
                  disabled={!url.trim() || scraping}
                  variant="outline"
                >
                  {scraping ? <Loader2 size={14} className="animate-spin" /> : 'Scrape'}
                </Button>
              </div>

              {/* URL status */}
              {urlMsg && (
                <div className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${
                  urlStatus === 'error'
                    ? 'border-destructive/25 bg-destructive/10 text-destructive'
                    : 'border-green-500/25 bg-green-500/10 text-green-400'
                }`}>
                  {urlStatus === 'error'
                    ? <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    : <CheckCircle2 size={14} className="mt-0.5 shrink-0" />}
                  <span className="leading-snug">{urlMsg}</span>
                </div>
              )}

              {urlStatus === 'done' && (
                <button
                  onClick={() => { setUrl(''); setUrlStatus('idle'); setUrlMsg(''); }}
                  className="text-xs text-primary hover:underline text-left"
                >
                  + Add another URL
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Both in-progress indicator ────────────────────────── */}
        {uploading && scraping && (
          <p className="animate-fade-in text-center text-sm text-muted-foreground">
            <Loader2 size={12} className="inline mr-1.5 animate-spin" />
            Uploading PDFs and scraping URL simultaneously…
          </p>
        )}

        {/* ── Ready to chat ─────────────────────────────────────── */}
        {indexedCount > 0 && !uploading && !scraping && (
          <div className="animate-fade-in text-center">
            <p className="text-sm text-muted-foreground">
              <CheckCircle2 size={14} className="inline mr-1.5 text-green-400" />
              {indexedCount} source{indexedCount !== 1 ? 's' : ''} ready — ask your first question below ↓
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
