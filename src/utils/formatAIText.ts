import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({
  gfm: true,
  breaks: true,
});

export async function formatAiText(text: string): Promise<string> {
  const html = await marked.parse(text);
  return DOMPurify.sanitize(html);
}
