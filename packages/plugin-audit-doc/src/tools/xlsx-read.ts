import { tool } from "@opencode-ai/plugin"
import ExcelJS from "exceljs"
import path from "path"

export const xlsx_read = tool({
  description:
    "Read a .xlsx (Excel) file and extract its content as structured text. Returns sheet names, headers, and row data.",
  args: {
    path: tool.schema.string().describe("Absolute or relative path to the .xlsx file"),
    sheet: tool.schema.string().optional().describe("Specific sheet name to read. If omitted, reads all sheets."),
    maxRows: tool.schema.number().optional().describe("Maximum number of rows to read per sheet. Default: 500"),
  },
  async execute(args, ctx) {
    const filePath = path.isAbsolute(args.path) ? args.path : path.resolve(ctx.directory, args.path)
    const maxRows = args.maxRows ?? 500
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const output: string[] = [`# Spreadsheet: ${path.basename(filePath)}`]
    const sheets = args.sheet ? [workbook.getWorksheet(args.sheet)].filter(Boolean) : workbook.worksheets

    for (const sheet of sheets) {
      if (!sheet) continue
      output.push("", `## Sheet: ${sheet.name} (${sheet.rowCount} rows, ${sheet.columnCount} columns)`)

      let rowCount = 0
      sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowCount >= maxRows) return
        const values = row.values as (string | number | boolean | null)[]
        const cells = values.slice(1).map((v) => (v === null || v === undefined ? "" : String(v)))
        if (rowNumber === 1) {
          output.push("", `| ${cells.join(" | ")} |`)
          output.push(`| ${cells.map(() => "---").join(" | ")} |`)
        } else {
          output.push(`| ${cells.join(" | ")} |`)
        }
        rowCount++
      })

      if (sheet.rowCount > maxRows) {
        output.push("", `_Showing ${maxRows} of ${sheet.rowCount} rows. Use maxRows parameter to see more._`)
      }
    }

    return output.join("\n")
  },
})
