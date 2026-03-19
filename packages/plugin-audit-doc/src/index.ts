import type { Plugin } from "@opencode-ai/plugin"
import { docx_read } from "./tools/docx-read"
import { xlsx_read } from "./tools/xlsx-read"
import { docx_write } from "./tools/docx-write"
import { xlsx_write } from "./tools/xlsx-write"
import { doc_analyze } from "./tools/doc-analyze"

const plugin: Plugin = async () => ({
  tool: {
    docx_read,
    xlsx_read,
    docx_write,
    xlsx_write,
    doc_analyze,
  },
})

export default plugin
