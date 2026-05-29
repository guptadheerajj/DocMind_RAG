import { useState } from 'react';
import { FileText, Globe, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { deleteSource as apiDeleteSource } from '@/lib/api';
import AddSourceDialog from '@/components/upload/AddSourceDialog';
import { toast } from 'sonner';

export default function SourcePanel({ chatId, sources, onSourceAdded, onSourceDeleted }) {
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
    <div className="px-3 py-2.5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
          Sources {sources.length > 0 && `(${sources.length})`}
        </button>

        {/* "Add more" button — only shown when there are existing sources */}
        {sources.length > 0 && (
          <AddSourceDialog
            chatId={chatId}
            onSourceAdded={onSourceAdded}
            triggerLabel="Add more"
          />
        )}
      </div>

      {expanded && (
        <>
          {sources.length === 0 ? (
            <p className="text-xs text-muted-foreground py-1">
              No sources. Add a PDF or URL via the chat area.
            </p>
          ) : (
            <ScrollArea className="max-h-52">
              <ul className="flex flex-col gap-1.5 pr-1">
                {sources.map((src) => (
                  <li
                    key={src.id}
                    className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                  >
                    {/* Type icon */}
                    <span className="shrink-0">
                      {src.type === 'pdf'
                        ? <FileText size={12} className="text-red-400" />
                        : <Globe size={12} className="text-blue-400" />}
                    </span>

                    {/* Name with tooltip */}
                    <Tooltip>
                      <TooltipTrigger className="flex-1 truncate text-left text-muted-foreground cursor-default text-xs">
                        {src.name}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-56 text-xs">
                        {src.name}
                      </TooltipContent>
                    </Tooltip>

                    {/* Chunk count */}
                    <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
                      {src.chunkCount}
                    </Badge>

                    {/* Delete — always visible */}
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      disabled={deletingId === src.id}
                      onClick={() => handleDelete(src.id)}
                      title="Remove source"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
}
