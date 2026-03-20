import { onCleanup, onMount } from "solid-js"
import { showToast } from "@opencode-ai/ui/toast"
import {
  usePrompt,
  type ContentPart,
  type Prompt,
  type ImageAttachmentPart,
  type DocumentAttachmentPart,
} from "@/context/prompt"
import { useLanguage } from "@/context/language"
import { uuid } from "@/utils/uuid"
import { getCursorPosition } from "./editor-dom"
import { attachmentMime, isDocumentMime } from "./files"
import { normalizePaste, pasteMode } from "./paste"

function dataUrl(file: File, mime: string) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.addEventListener("error", () => resolve(""))
    reader.addEventListener("load", () => {
      const value = typeof reader.result === "string" ? reader.result : ""
      const idx = value.indexOf(",")
      if (idx === -1) {
        resolve(value)
        return
      }
      resolve(`data:${mime};base64,${value.slice(idx + 1)}`)
    })
    reader.readAsDataURL(file)
  })
}

const DOCUMENT_EXTS = new Set(["docx", "xlsx", "doc", "xls"])

function isDocumentPath(filePath: string) {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? ""
  return DOCUMENT_EXTS.has(ext)
}

function promptLength(parts: Prompt) {
  return parts.reduce((sum, part) => sum + ("content" in part ? part.content.length : 0), 0)
}

function relayout(parts: Prompt): Prompt {
  let position = 0
  return parts.map((part) => {
    if (!("content" in part)) return { ...part }
    const next = {
      ...part,
      start: position,
      end: position + part.content.length,
    }
    position = next.end
    return next
  })
}

function withDocumentReference(parts: Prompt, filename: string) {
  const reference = `《${filename}》`
  const combined = parts.map((part) => ("content" in part ? part.content : "")).join("")
  if (combined.includes(reference) || combined.includes(filename)) {
    return relayout(parts)
  }

  const next = [...parts]
  const addition = combined.trim().length === 0 ? reference : `${/[\s\n]$/.test(combined) ? "" : " "}${reference}`
  const lastText = next.map((part, index) => ({ part, index })).findLast((entry) => entry.part.type === "text")

  if (lastText && lastText.part.type === "text") {
    next[lastText.index] = {
      ...lastText.part,
      content: lastText.part.content + addition,
    }
    return relayout(next)
  }

  next.push({
    type: "text",
    content: addition,
    start: 0,
    end: 0,
  })
  return relayout(next)
}

type PromptAttachmentsInput = {
  editor: () => HTMLDivElement | undefined
  isDialogActive: () => boolean
  setDraggingType: (type: "image" | "@mention" | null) => void
  focusEditor: () => void
  addPart: (part: ContentPart) => boolean
  readClipboardImage?: () => Promise<File | null>
}

export function createPromptAttachments(input: PromptAttachmentsInput) {
  const prompt = usePrompt()
  const language = useLanguage()

  const warn = () => {
    showToast({
      title: language.t("prompt.toast.pasteUnsupported.title"),
      description: language.t("prompt.toast.pasteUnsupported.description"),
    })
  }

  const addDocumentByPath = (filePath: string, filename: string, mime: string) => {
    const editor = input.editor()
    if (!editor) return false
    const attachment: DocumentAttachmentPart = {
      type: "document",
      id: uuid(),
      filename,
      mime,
      path: filePath,
    }
    const next = withDocumentReference([...prompt.current(), attachment], filename)
    prompt.set(next, promptLength(next))
    return true
  }

  const add = async (file: File, toast = true) => {
    const mime = await attachmentMime(file)
    if (!mime) {
      if (toast) warn()
      return false
    }

    const editor = input.editor()
    if (!editor) return false

    // Document files: store as document attachment (path-based when available)
    if (isDocumentMime(mime)) {
      const attachment: DocumentAttachmentPart = {
        type: "document",
        id: uuid(),
        filename: file.name,
        mime,
        // Web File objects don't have paths; store data URL as fallback
        path: "",
      }
      const url = await dataUrl(file, mime)
      if (url) attachment.path = url
      const next = withDocumentReference([...prompt.current(), attachment], file.name)
      prompt.set(next, promptLength(next))
      return true
    }

    const url = await dataUrl(file, mime)
    if (!url) return false

    const attachment: ImageAttachmentPart = {
      type: "image",
      id: uuid(),
      filename: file.name,
      mime,
      dataUrl: url,
    }
    const cursor = prompt.cursor() ?? getCursorPosition(editor)
    prompt.set([...prompt.current(), attachment], cursor)
    return true
  }

  const addAttachment = (file: File) => add(file)

  const removeAttachment = (id: string) => {
    const current = prompt.current()
    const next = current.filter((part) => {
      if (part.type === "image") return part.id !== id
      if (part.type === "document") return part.id !== id
      return true
    })
    prompt.set(next, prompt.cursor())
  }

  const handlePaste = async (event: ClipboardEvent) => {
    const clipboardData = event.clipboardData
    if (!clipboardData) return

    event.preventDefault()
    event.stopPropagation()

    const items = Array.from(clipboardData.items)
    const fileItems = items.filter((item) => item.kind === "file")

    if (fileItems.length > 0) {
      let found = false
      for (const item of fileItems) {
        const file = item.getAsFile()
        if (!file) continue
        const ok = await add(file, false)
        if (ok) found = true
      }
      if (!found) warn()
      return
    }

    const plainText = clipboardData.getData("text/plain") ?? ""

    // Desktop: Browser clipboard has no images and no text, try platform's native clipboard for images
    if (input.readClipboardImage && !plainText) {
      const file = await input.readClipboardImage()
      if (file) {
        await addAttachment(file)
        return
      }
    }

    if (!plainText) return

    const text = normalizePaste(plainText)

    const put = () => {
      if (input.addPart({ type: "text", content: text, start: 0, end: 0 })) return true
      input.focusEditor()
      return input.addPart({ type: "text", content: text, start: 0, end: 0 })
    }

    if (pasteMode(text) === "manual") {
      put()
      return
    }

    const inserted = typeof document.execCommand === "function" && document.execCommand("insertText", false, text)
    if (inserted) return

    put()
  }

  const handleGlobalDragOver = (event: DragEvent) => {
    if (input.isDialogActive()) return

    event.preventDefault()
    const hasFiles = event.dataTransfer?.types.includes("Files")
    const hasText = event.dataTransfer?.types.includes("text/plain")
    if (hasFiles) {
      input.setDraggingType("image")
    } else if (hasText) {
      input.setDraggingType("@mention")
    }
  }

  const handleGlobalDragLeave = (event: DragEvent) => {
    if (input.isDialogActive()) return
    if (!event.relatedTarget) {
      input.setDraggingType(null)
    }
  }

  const handleGlobalDrop = async (event: DragEvent) => {
    if (input.isDialogActive()) return

    event.preventDefault()
    input.setDraggingType(null)

    const plainText = event.dataTransfer?.getData("text/plain")
    const filePrefix = "file:"
    if (plainText?.startsWith(filePrefix)) {
      const filePath = plainText.slice(filePrefix.length)
      // Document files dropped from OS file manager with path
      if (isDocumentPath(filePath)) {
        const ext = filePath.split(".").pop()?.toLowerCase() ?? ""
        const mime =
          ext === "docx"
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : ext === "xlsx"
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : ext === "doc"
                ? "application/msword"
                : "application/vnd.ms-excel"
        const filename = filePath.split("/").pop() ?? filePath
        input.focusEditor()
        addDocumentByPath(filePath, filename, mime)
        return
      }
      input.focusEditor()
      input.addPart({ type: "file", path: filePath, content: "@" + filePath, start: 0, end: 0 })
      return
    }

    const dropped = event.dataTransfer?.files
    if (!dropped) return

    let found = false
    for (const file of Array.from(dropped)) {
      const ok = await add(file, false)
      if (ok) found = true
    }
    if (!found && dropped.length > 0) warn()
  }

  onMount(() => {
    document.addEventListener("dragover", handleGlobalDragOver)
    document.addEventListener("dragleave", handleGlobalDragLeave)
    document.addEventListener("drop", handleGlobalDrop)
  })

  onCleanup(() => {
    document.removeEventListener("dragover", handleGlobalDragOver)
    document.removeEventListener("dragleave", handleGlobalDragLeave)
    document.removeEventListener("drop", handleGlobalDrop)
  })

  return {
    addAttachment,
    removeAttachment,
    handlePaste,
  }
}
