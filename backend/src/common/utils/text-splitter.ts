export function splitText(text: string, chunkSize: number = 1000, overlap: number = 100): string[] {
  if (!text) return [];
  if (text.length <= chunkSize) return [text];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;
    if (end > text.length) {
      end = text.length;
    }

    chunks.push(text.slice(start, end));
    
    if (end === text.length) break;
    start += chunkSize - overlap;
  }

  return chunks;
}
