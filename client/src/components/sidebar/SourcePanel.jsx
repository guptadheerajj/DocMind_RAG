import { useState } from 'react';
import { FileText, Globe, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { deleteSource as apiDeleteSource } from '@/lib/api';
import { toast } from 'sonner';

export default function SourcePanel({ chatId, sources, onSourceDeleted }) {
  const [expanded, setExpanded] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  async function handleDelete(sourceId) {
    setDeletingId(sourceId);
    try {
      await apiDeleteSource(sourceId);
      onSourceDeleted(sourceId);
      toast.success('Source removed');
    } catch (err) {
      toast.error(err.message || 'Failed to remove source');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="px-3 py-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>Sources {sources.length > 0 && `(${sources.length})`}</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <>
          {sources.length === 0 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              No sources yet. Add a PDF or URL.
            </p>
          ) : (
            <ScrollArea className="mt-2 max-h-48">
              <ul className="flex flex-col gap-1.5">
                {sources.map((src) => (
                  <li
                    key={src.id}
                    className="group flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                  >
                    <span className="shrink-0">
                      {src.type === 'pdf'
                        ? <FileText size={12} className="text-red-400" />
                        : <Globe size={12} className="text-blue-400" />}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex-1 truncate text-muted-foreground">{src.name}</span>
                      </TooltipTrigger>
                      <TooltipContent side="right">{src.name}</TooltipContent>
                    </Tooltip>
                    <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                      {src.chunkCount}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                      disabled={deletingId === src.id}
                      onClick={() => handleDelete(src.id)}
                    >
                      <Trash2 size={11} />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
          <Separator className="mt-3" />
        </>
      )}
    </div>
  );
}
