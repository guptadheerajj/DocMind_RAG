import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Globe, ExternalLink } from 'lucide-react';

// ─── Citation Preprocessing ───────────────────────────────────────────────────
// The model outputs citations like: (OS PPT (1).pdf, Page 3) or (geeksforgeeks.org)
// We replace them with backtick-encoded markers that ReactMarkdown's custom
// code renderer will turn into styled chips. Handles one level of nested parens.

const CITATION_RE =
  /\(([^()]*(?:\([^()]+\)[^()]*)*\.(?:pdf|PDF)(?:,\s*Page\s+\d+)?)\)|\((https?:\/\/[^\s)]+)\)|\(([a-zA-Z0-9][\w.-]+\.[a-zA-Z]{2,}(?:\/[^)\s]*)?)\)/g;

function preprocessCitations(text) {
  return text.replace(CITATION_RE, (_, pdfCite, urlCite, domainCite) => {
    const cite = pdfCite || urlCite || domainCite;
    // Encode as inline code so ReactMarkdown handles it as an inline node
    return `\`__CITE__${cite}\``;
  });
}

// Parse "OS PPT (1).pdf, Page 3" → { isPdf: true, filename, page }
// Parse "geeksforgeeks.org"       → { isPdf: false, url }
function parseCiteContent(raw) {
  const pageMatch = raw.match(/^(.*?),\s*Page\s+(\d+)\s*$/i);
  if (pageMatch) return { isPdf: true, filename: pageMatch[1].trim(), page: pageMatch[2] };
  if (/\.pdf$/i.test(raw.trim())) return { isPdf: true, filename: raw.trim(), page: null };
  return { isPdf: false, url: raw.trim() };
}

// ─── Inline Citation Chip ─────────────────────────────────────────────────────
function CitationChip({ raw }) {
  const info = parseCiteContent(raw);

  if (info.isPdf) {
    return (
      <span className="citation-chip citation-chip-pdf">
        <FileText size={10} className="shrink-0" />
        {info.page ? `Page ${info.page}` : info.filename}
      </span>
    );
  }

  const displayUrl = info.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const href = /^https?:\/\//.test(info.url) ? info.url : `https://${info.url}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="citation-chip citation-chip-url"
    >
      <Globe size={10} className="shrink-0" />
      {displayUrl.length > 28 ? `${displayUrl.slice(0, 28)}…` : displayUrl}
    </a>
  );
}

// ─── ReactMarkdown component overrides ───────────────────────────────────────
const MARKDOWN_COMPONENTS = {
  // Intercept inline code nodes — if they start with __CITE__ render a chip
  code({ children, className, node, ...props }) {
    const text = String(children);
    if (text.startsWith('__CITE__')) {
      return <CitationChip raw={text.slice(8)} />;
    }
    return <code className={className} {...props}>{children}</code>;
  },
};

// ─── Source Card ─────────────────────────────────────────────────────────────
function SourceCard({ source }) {
  const isPdf = source.type === 'pdf';
  const rawName = source.source ?? '';
  const displayName = isPdf
    ? rawName
    : rawName.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const shortened = displayName.length > 32 ? `${displayName.slice(0, 32)}…` : displayName;

  const card = (
    <div
      className={[
        'flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-xs transition-colors',
        isPdf
          ? 'border-red-500/20 bg-red-500/6 hover:bg-red-500/12 hover:border-red-500/30'
          : 'border-blue-500/20 bg-blue-500/6 hover:bg-blue-500/12 hover:border-blue-500/30',
      ].join(' ')}
    >
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 rounded-md p-1 ${isPdf ? 'bg-red-500/15' : 'bg-blue-500/15'}`}>
        {isPdf
          ? <FileText size={13} className="text-red-400" />
          : <Globe size={13} className="text-blue-400" />}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground/90 leading-snug truncate" title={rawName}>
          {shortened}
        </p>
        {isPdf && source.page !== undefined && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Page {source.page}</p>
        )}
        {!isPdf && (
          <div className="flex items-center gap-1 mt-0.5">
            <ExternalLink size={9} className="shrink-0 text-blue-400/60" />
            <span className="text-[10px] text-muted-foreground truncate">{rawName}</span>
          </div>
        )}
      </div>
    </div>
  );

  return isPdf ? card : (
    <a href={rawName} target="_blank" rel="noopener noreferrer" className="no-underline block">
      {card}
    </a>
  );
}

// ─── Main MessageBubble ───────────────────────────────────────────────────────
export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const sources = message.sources ?? [];

  if (isUser) {
    return (
      <div className="animate-fade-in flex justify-end py-1">
        <div className="msg-user">
          <p className="m-0 text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    );
  }

  const processedContent = preprocessCitations(message.content);

  return (
    <div className="animate-fade-in flex justify-start py-1">
      <div className="msg-ai max-w-[85%]">

        {/* Answer text with inline citation chips */}
        <div className="prose text-sm text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
            {processedContent}
          </ReactMarkdown>
        </div>

        {/* Sources panel — card grid */}
        {sources.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sources Used
            </p>
            <div className={`grid gap-2 ${sources.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {sources.map((src, i) => (
                <SourceCard key={i} source={src} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
