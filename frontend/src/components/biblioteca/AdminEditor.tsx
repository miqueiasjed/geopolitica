import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

interface AdminEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function AdminEditor({ value, onChange, placeholder }: AdminEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder ?? 'Digite o conteúdo...',
      }),
    ],
    content: value,
    onUpdate({ editor: ed }) {
      onChange(ed.getHTML())
    },
  })

  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  if (!editor) return null

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
      <div className="flex flex-wrap gap-1 border-b border-zinc-800 p-2">
        <button
          type="button"
          aria-label="Negrito"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded px-2.5 py-1 text-sm font-bold transition-colors ${
            editor.isActive('bold')
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          }`}
          data-active={editor.isActive('bold') ? 'true' : undefined}
        >
          N
        </button>
        <button
          type="button"
          aria-label="Itálico"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded px-2.5 py-1 text-sm italic transition-colors ${
            editor.isActive('italic')
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          }`}
          data-active={editor.isActive('italic') ? 'true' : undefined}
        >
          I
        </button>
        <button
          type="button"
          aria-label="Subtítulo H2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`rounded px-2.5 py-1 text-sm font-semibold transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-cyan-500/20 text-cyan-300'
              : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
          }`}
          data-active={editor.isActive('heading', { level: 2 }) ? 'true' : undefined}
        >
          H2
        </button>
        <button
          type="button"
          aria-label="Divisor horizontal"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="rounded px-2.5 py-1 text-sm text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        >
          —
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose prose-invert min-h-[300px] max-w-none px-4 py-3 text-sm text-zinc-100 focus-within:outline-none [&_.ProseMirror]:min-h-[300px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-zinc-500 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]"
      />
    </div>
  )
}
