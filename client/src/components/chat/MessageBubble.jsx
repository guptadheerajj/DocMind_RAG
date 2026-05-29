import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Globe, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

  return (
    <div className="animate-fade-in flex justify-start py-1">
      <div className="msg-ai max-w-[85%]">
        <div className="prose text-sm text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {sources.length > 0 && (
          <div className="mt-3 border-t border-border pt-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Sources used
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((src, i) => (
                <SourceBadge key={i} source={src} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SourceBadge({ source }) {
  const isPdf = source.type === 'pdf';
  const label = isPdf
    ? `${source.source}${source.page !== undefined ? ` · p.${source.page}` : ''}`
    : source.source;

  const badge = (
    <Badge
      variant="outline"
      className="max-w-[200px] gap-1 truncate px-2 py-0.5 text-[11px]"
    >
      {isPdf
        ? <FileText size={10} className="shrink-0 text-red-400" />
        : <Globe size={10} className="shrink-0 text-blue-400" />}
      <span className="truncate">{label}</span>
      {!isPdf && <ExternalLink size={9} className="shrink-0 opacity-50" />}
    </Badge>
  );

  return !isPdf
    ? <a href={source.source} target="_blank" rel="noopener noreferrer" className="no-underline">{badge}</a>
    : badge;
}
