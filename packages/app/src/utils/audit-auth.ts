const AUDIT_PROVIDER_CONNECTED_KEY = "audit-provider-connected.v1"
const AUDIT_PROVIDER_CONNECTED_EVENT = "audit-provider-connected"

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined"
}

export function readAuditProviderConnected() {
  if (!canUseStorage()) return false
  try {
    return localStorage.getItem(AUDIT_PROVIDER_CONNECTED_KEY) === "1"
  } catch {
    return false
  }
}

export function writeAuditProviderConnected(value: boolean) {
  if (canUseStorage()) {
    try {
      if (value) localStorage.setItem(AUDIT_PROVIDER_CONNECTED_KEY, "1")
      else localStorage.removeItem(AUDIT_PROVIDER_CONNECTED_KEY)
    } catch {
      // Ignore storage failures and still notify listeners.
    }
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(AUDIT_PROVIDER_CONNECTED_EVENT, {
        detail: value,
      }),
    )
  }
}

export function onAuditProviderConnectedChange(listener: (value: boolean) => void) {
  if (typeof window === "undefined") return () => {}

  const handler = (event: Event) => {
    listener(Boolean((event as CustomEvent<boolean>).detail))
  }

  window.addEventListener(AUDIT_PROVIDER_CONNECTED_EVENT, handler)
  return () => window.removeEventListener(AUDIT_PROVIDER_CONNECTED_EVENT, handler)
}
