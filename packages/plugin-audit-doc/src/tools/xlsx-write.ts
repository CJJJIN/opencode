import { tool } from "@opencode-ai/plugin"
import ExcelJS from "exceljs"
import fs from "fs/promises"
import path from "path"

export const xlsx_write = tool({
  description:
    "Generate or edit a .xlsx (Excel) file. Creates a spreadsheet with headers and data rows. Returns the path to the generated file.",
  args: {
    path: tool.schema.string().describe("Output file path for the .xlsx file"),
    sheetName: tool.schema.string().optional().describe("Sheet name. Default: 'Sheet1'"),
    headers: tool.schema.array(tool.schema.string()).describe("Column headers"),
    rows: tool.schema
      .array(tool.schema.array(tool.schema.union([tool.schema.string(), tool.schema.number()])))
      .describe("Data rows as arrays of values"),
  },
  async execute(args, ctx) {
    const filePath = path.isAbsolute(args.path) ? args.path : path.resolve(ctx.directory, args.path)
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet(args.sheetName ?? "Sheet1")

    sheet.addRow(args.headers)
    for (const row of args.rows) {
      sheet.addRow(row)
    }

    // Auto-fit column widths
    sheet.columns.forEach((col) => {
      let maxLen = 10
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value ?? "").length
        if (len > maxLen) maxLen = len
      })
      col.width = Math.min(maxLen + 2, 50)
    })

    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await workbook.xlsx.writeFile(filePath)
    return `Spreadsheet generated: ${filePath}`
  },
})
