interface ContentReaderProps {
  corpo: string
  titulo: string
}

export function ContentReader({ corpo, titulo }: ContentReaderProps) {
  return (
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="mb-8 text-3xl font-bold leading-tight text-white sm:text-4xl">{titulo}</h1>
      <div
        className="prose prose-invert prose-zinc max-w-none prose-h2:text-white prose-a:text-blue-400 prose-strong:text-white"
        dangerouslySetInnerHTML={{ __html: corpo }}
      />
    </div>
  )
}
