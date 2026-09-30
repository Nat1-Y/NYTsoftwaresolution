/** Trim text to a meta-description length at a word boundary. */
export function summary(text: string, max = 158): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '').replace(/[,;:—–-]\s*$/, '')}…`;
}
