/* eslint-disable @typescript-eslint/no-explicit-any */

type EditorJsBlock = {
  type?: string;
  data?: Record<string, any>;
};

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractTextFromBlock(block: EditorJsBlock): string {
  const type = block?.type ?? "";
  const data = block?.data ?? {};

  if (type === "paragraph" || type === "header") {
    return cleanText(data?.text);
  }

  if (type === "list") {
    const items = Array.isArray(data?.items) ? data.items : [];
    return items
      .map((item: any, index: number) => {
        if (typeof item === "string") {
          const bullet = data?.style === "ordered" ? `${index + 1}.` : "•";
          return `${bullet} ${cleanText(item)}`.trim();
        }

        const content = cleanText(item?.content);
        if (!content) return "";

        const bullet = data?.style === "ordered" ? `${index + 1}.` : "•";
        return `${bullet} ${content}`.trim();
      })
      .filter(Boolean)
      .join("\n");
  }

  if (type === "checklist") {
    const items = Array.isArray(data?.items) ? data.items : [];
    return items
      .map((item: any) => `${item?.checked ? "[x]" : "[ ]"} ${cleanText(item?.text)}`.trim())
      .filter(Boolean)
      .join("\n");
  }

  if (type === "table") {
    const rows = Array.isArray(data?.content) ? data.content : [];
    return rows
      .map((row: any[]) =>
        Array.isArray(row)
          ? row.map((cell) => cleanText(cell)).filter(Boolean).join(" | ")
          : "",
      )
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

export function serializeAnnouncementContent(content: any): string {
  if (typeof content === "string") {
    return content.trim();
  }

  const blocks: EditorJsBlock[] = Array.isArray(content?.blocks) ? content.blocks : [];

  return blocks.map(extractTextFromBlock).filter(Boolean).join("\n\n").trim();
}
