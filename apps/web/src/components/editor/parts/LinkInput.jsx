'use client';

/**
 * LinkInput — link əlavə etmə inline forması və link silmə düyməsi.
 */

import { useState } from 'react';
import { Link as LinkIcon, Unlink, Check } from 'lucide-react';
import { ToolbarButton } from './Primitives';

export default function LinkInput({ editor }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  const apply = () => {
    if (!url) return;
    const href = url.startsWith('http') ? url : `https://${url}`;
    editor.chain().focus().setLink({ href }).run();
    setUrl('');
    setOpen(false);
  };

  const remove = () => editor.chain().focus().unsetLink().run();

  if (open) {
    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-md px-2 py-1">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') apply();
            if (e.key === 'Escape') {
              setOpen(false);
              setUrl('');
            }
          }}
          placeholder="URL daxil edin..."
          autoFocus
          className="w-40 px-2 py-1 text-sm bg-transparent border-none focus:outline-none"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={apply}
          className="p-1 text-green-600 hover:bg-green-50 rounded"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen(false);
            setUrl('');
          }}
          className="p-1 text-red-500 hover:bg-red-50 rounded"
        >
          <Unlink size={14} />
        </button>
      </div>
    );
  }

  return (
    <>
      <ToolbarButton
        onClick={() => setOpen(true)}
        isActive={editor.isActive('link')}
        title="Link əlavə et"
      >
        <LinkIcon size={16} />
      </ToolbarButton>
      {editor.isActive('link') && (
        <ToolbarButton onClick={remove} title="Linki sil">
          <Unlink size={16} />
        </ToolbarButton>
      )}
    </>
  );
}
