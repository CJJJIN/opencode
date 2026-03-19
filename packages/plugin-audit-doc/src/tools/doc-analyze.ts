import { tool } from "@opencode-ai/plugin"
import mammoth from "mammoth"
import ExcelJS from "exceljs"
import fs from "fs/promises"
import path from "path"

export const doc_analyze = tool({
  description:
    "Analyze a document (.docx or .xlsx) and return a structured summary including metadata, structure overview, and key statistics. Useful for understanding document contents before detailed review.",
  args: {
    path: tool.schema.string().describe("Absolute or relative path to the document file"),
  },
  async execute(args, ctx) {
    const filePath = path.isAbsolute(args.path) ? args.path : path.resolve(ctx.directory, args.path)
    const ext = path.extname(filePath).toLowerCase()
    const stat = await fs.stat(filePath)
    const output: string[] = [
      `# Document Analysis: ${path.basename(filePath)}`,
      "",
      `- **Type**: ${ext}`,
      `- **Size**: ${(stat.size / 1024).toFixed(1)} KB`,
      `- **Modified**: ${stat.mtime.toISOString()}`,
    ]

    if (ext === ".docx") {
      const buffer = await fs.readFile(filePath)
      const result = await mammoth.extractRawText({ buffer })
      const text = result.value
      const words = text.split(/\s+/).filter(Boolean)
      const lines = text.split("\n")
      const paragraphs = text.split("\n\n").filter(Boolean)
      output.push(
        "",
        "## Statistics",
        `- **Words**: ${words.length}`,
        `- **Lines**: ${lines.length}`,
        `- **Paragraphs**: ${paragraphs.length}`,
        `- **Characters**: ${text.length}`,
        "",
        "## Preview (first 500 chars)",
        text.slice(0, 500) + (text.length > 500 ? "..." : ""),
      )
    } else if (ext === ".xlsx") {
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(filePath)
      output.push("", "## Sheets")
      for (const sheet of workbook.worksheets) {
        output.push(`- **${sheet.name}**: ${sheet.rowCount} rows, ${sheet.columnCount} columns`)
        const firstRow = sheet.getRow(1)
        if (firstRow) {
          const headers = (firstRow.values as (string | number | null)[])
            .slice(1)
            .filter(Boolean)
            .map(String)
          if (headers.length > 0) {
            output.push(`  Headers: ${headers.join(", ")}`)
          }
        }
      }
    } else {
      output.push("", "_Unsupported file type. Supported: .docx, .xlsx_")
    }

    return output.join("\n")
  },
})
