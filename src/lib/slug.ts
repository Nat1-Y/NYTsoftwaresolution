/** A stable id fragment from a display name: "Next.js" → "next-js". */
export const slug = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
