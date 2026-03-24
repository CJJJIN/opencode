import { useGlobalSync } from "@/context/global-sync"
import { readAuditProviderConnected } from "@/utils/audit-auth"
import { decode64 } from "@/utils/base64"
import { isAudit } from "@/utils/edition"
import { useParams } from "@solidjs/router"
import { createMemo } from "solid-js"

export const popularProviders = [
  "opencode",
  "opencode-go",
  "anthropic",
  "github-copilot",
  "openai",
  "google",
  "openrouter",
  "vercel",
]
const popularProviderSet = new Set(popularProviders)
const AUDIT_PROVIDER_ID = "aicodemirror-openai"

export function useProviders() {
  const globalSync = useGlobalSync()
  const params = useParams()
  const dir = createMemo(() => decode64(params.dir) ?? "")
  const providers = () => {
    if (dir()) {
      const [projectStore] = globalSync.child(dir())
      return projectStore.provider
    }
    return globalSync.data.provider
  }
  return {
    all: () => providers().all,
    default: () => providers().default,
    popular: () => providers().all.filter((p) => popularProviderSet.has(p.id)),
    connected: () => {
      const connected = new Set(providers().connected)
      return providers().all.filter((p) => {
        if (!connected.has(p.id)) return false
        if (isAudit && p.id === AUDIT_PROVIDER_ID && !readAuditProviderConnected()) return false
        return true
      })
    },
    paid: () => {
      const connected = new Set(providers().connected)
      return providers().all.filter(
        (p) =>
          connected.has(p.id) &&
          (!isAudit || p.id !== AUDIT_PROVIDER_ID || readAuditProviderConnected()) &&
          (p.id !== "opencode" || Object.values(p.models).some((m) => m.cost?.input)),
      )
    },
  }
}
