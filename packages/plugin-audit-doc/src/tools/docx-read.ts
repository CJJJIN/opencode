import { tool } from "@opencode-ai/plugin"
import mammoth from "mammoth"
import fs from "fs/promises"
import path from "path"

export const docx_read = tool({
  description:
    "Read a .docx (Word) file and extract its text content. Returns the document text with basic formatting preserved.",
  args: {
    path: tool.schema.string().describe("Absolute or relative path to the .docx file"),
  },
  async execute(args, ctx) {
    const filePath = path.isAbsolute(args.path) ? args.path : path.resolve(ctx.directory, args.path)
    const buffer = await fs.readFile(filePath)
    const result = await mammoth.extractRawText({ buffer })
    const warnings = result.messages.filter((m) => m.type === "warning").map((m) => m.message)
    const output = [`# Document: ${path.basename(filePath)}`, "", result.value]
    if (warnings.length > 0) {
      output.push("", "## Warnings", ...warnings.map((w) => `- ${w}`))
    }
    return output.join("\n")
  },
})
