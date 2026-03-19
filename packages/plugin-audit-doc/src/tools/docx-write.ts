import { tool } from "@opencode-ai/plugin"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import fs from "fs/promises"
import path from "path"

export const docx_write = tool({
  description:
    "Generate a .docx (Word) report file. Accepts structured content with headings and paragraphs. Returns the path to the generated file.",
  args: {
    path: tool.schema.string().describe("Output file path for the .docx file"),
    title: tool.schema.string().describe("Document title"),
    sections: tool.schema
      .array(
        tool.schema.object({
          heading: tool.schema.string().describe("Section heading"),
          content: tool.schema.string().describe("Section content text"),
        }),
      )
      .describe("Array of sections with heading and content"),
  },
  async execute(args, ctx) {
    const filePath = path.isAbsolute(args.path) ? args.path : path.resolve(ctx.directory, args.path)

    const children: Paragraph[] = [
      new Paragraph({ text: args.title, heading: HeadingLevel.TITLE }),
      new Paragraph({ text: "" }),
    ]

    for (const section of args.sections) {
      children.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }))
      for (const line of section.content.split("\n")) {
        children.push(new Paragraph({ children: [new TextRun(line)] }))
      }
      children.push(new Paragraph({ text: "" }))
    }

    const doc = new Document({ sections: [{ children }] })
    const buffer = await Packer.toBuffer(doc)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, buffer)
    return `Document generated: ${filePath}`
  },
})
