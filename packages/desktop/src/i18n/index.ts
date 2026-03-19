import * as i18n from "@solid-primitives/i18n"
import { Store } from "@tauri-apps/plugin-store"

import { dict as desktopEn } from "./en"
import { dict as desktopZh } from "./zh"
import { dict as desktopZht } from "./zht"
import { dict as desktopKo } from "./ko"
import { dict as desktopDe } from "./de"
import { dict as desktopEs } from "./es"
import { dict as desktopFr } from "./fr"
import { dict as desktopDa } from "./da"
import { dict as desktopJa } from "./ja"
import { dict as desktopPl } from "./pl"
import { dict as desktopRu } from "./ru"
import { dict as desktopAr } from "./ar"
import { dict as desktopNo } from "./no"
import { dict as desktopBr } from "./br"
import { dict as desktopBs } from "./bs"

import { dict as appEn } from "../../../app/src/i18n/en"
import { dict as appZh } from "../../../app/src/i18n/zh"
import { dict as appZht } from "../../../app/src/i18n/zht"
import { dict as appKo } from "../../../app/src/i18n/ko"
import { dict as appDe } from "../../../app/src/i18n/de"
import { dict as appEs } from "../../../app/src/i18n/es"
import { dict as appFr } from "../../../app/src/i18n/fr"
import { dict as appDa } from "../../../app/src/i18n/da"
import { dict as appJa } from "../../../app/src/i18n/ja"
import { dict as appPl } from "../../../app/src/i18n/pl"
import { dict as appRu } from "../../../app/src/i18n/ru"
import { dict as appAr } from "../../../app/src/i18n/ar"
import { dict as appNo } from "../../../app/src/i18n/no"
import { dict as appBr } from "../../../app/src/i18n/br"
import { dict as appBs } from "../../../app/src/i18n/bs"

export type Locale =
  | "en"
  | "zh"
  | "zht"
  | "ko"
  | "de"
  | "es"
  | "fr"
  | "da"
  | "ja"
  | "pl"
  | "ru"
  | "ar"
  | "no"
  | "br"
  | "bs"

type RawDictionary = typeof appEn & typeof desktopEn
type Dictionary = i18n.Flatten<RawDictionary>

const LOCALES: readonly Locale[] = [
  "en",
  "zh",
  "zht",
  "ko",
  "de",
  "es",
  "fr",
  "da",
  "ja",
  "pl",
  "ru",
  "bs",
  "ar",
  "no",
  "br",
]

function detectLocale(): Locale {
  if (typeof navigator !== "object") return "en"

  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  for (const language of languages) {
    if (!language) continue
    if (language.toLowerCase().startsWith("en")) return "en"
    if (language.toLowerCase().startsWith("zh")) {
      if (language.toLowerCase().includes("hant")) return "zht"
      return "zh"
    }
    if (language.toLowerCase().startsWith("ko")) return "ko"
    if (language.toLowerCase().startsWith("de")) return "de"
    if (language.toLowerCase().startsWith("es")) return "es"
    if (language.toLowerCase().startsWith("fr")) return "fr"
    if (language.toLowerCase().startsWith("da")) return "da"
    if (language.toLowerCase().startsWith("ja")) return "ja"
    if (language.toLowerCase().startsWith("pl")) return "pl"
    if (language.toLowerCase().startsWith("ru")) return "ru"
    if (language.toLowerCase().startsWith("ar")) return "ar"
    if (
      language.toLowerCase().startsWith("no") ||
      language.toLowerCase().startsWith("nb") ||
      language.toLowerCase().startsWith("nn")
    )
      return "no"
    if (language.toLowerCase().startsWith("pt")) return "br"
    if (language.toLowerCase().startsWith("bs")) return "bs"
  }

  return "en"
}

function parseLocale(value: unknown): Locale | null {
  if (!value) return null
  if (typeof value !== "string") return null
  if ((LOCALES as readonly string[]).includes(value)) return value as Locale
  return null
}

function parseRecord(value: unknown) {
  if (!value || typeof value !== "object") return null
  if (Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function parseStored(value: unknown) {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function pickLocale(value: unknown): Locale | null {
  const direct = parseLocale(value)
  if (direct) return direct

  const record = parseRecord(value)
  if (!record) return null

  return parseLocale(record.locale)
}

const isAudit = __OPENCODE_EDITION__ === "audit"

const auditOverrides: Partial<Dictionary> = {
  "desktop.menu.app": "AuditHelper",
  "desktop.menu.help.documentation": "AuditHelper Documentation",
  "desktop.updater.none.message": "You are already using the latest version of AuditHelper",
  "desktop.updater.downloaded.prompt":
    "Version {{version}} of AuditHelper has been downloaded, would you like to install it and relaunch?",
  "desktop.cli.error.sidecarMissing": "AuditHelper CLI binary is missing. Try reinstalling the desktop app.",
  "desktop.cli.installed.message": "CLI installed to {{path}}\n\nRestart your terminal to use the 'audithelper' command.",
}

const base = i18n.flatten({ ...appEn, ...desktopEn })

function build(locale: Locale): Dictionary {
  let dict: Dictionary
  if (locale === "en") dict = base
  else if (locale === "zh") dict = { ...base, ...i18n.flatten(appZh), ...i18n.flatten(desktopZh) }
  else if (locale === "zht") dict = { ...base, ...i18n.flatten(appZht), ...i18n.flatten(desktopZht) }
  else if (locale === "de") dict = { ...base, ...i18n.flatten(appDe), ...i18n.flatten(desktopDe) }
  else if (locale === "es") dict = { ...base, ...i18n.flatten(appEs), ...i18n.flatten(desktopEs) }
  else if (locale === "fr") dict = { ...base, ...i18n.flatten(appFr), ...i18n.flatten(desktopFr) }
  else if (locale === "da") dict = { ...base, ...i18n.flatten(appDa), ...i18n.flatten(desktopDa) }
  else if (locale === "ja") dict = { ...base, ...i18n.flatten(appJa), ...i18n.flatten(desktopJa) }
  else if (locale === "pl") dict = { ...base, ...i18n.flatten(appPl), ...i18n.flatten(desktopPl) }
  else if (locale === "ru") dict = { ...base, ...i18n.flatten(appRu), ...i18n.flatten(desktopRu) }
  else if (locale === "ar") dict = { ...base, ...i18n.flatten(appAr), ...i18n.flatten(desktopAr) }
  else if (locale === "no") dict = { ...base, ...i18n.flatten(appNo), ...i18n.flatten(desktopNo) }
  else if (locale === "br") dict = { ...base, ...i18n.flatten(appBr), ...i18n.flatten(desktopBr) }
  else if (locale === "bs") dict = { ...base, ...i18n.flatten(appBs), ...i18n.flatten(desktopBs) }
  else dict = { ...base, ...i18n.flatten(appKo), ...i18n.flatten(desktopKo) }

  if (isAudit) return { ...dict, ...auditOverrides } as Dictionary
  return dict
}

const state = {
  locale: detectLocale(),
  dict: base as Dictionary,
  init: undefined as Promise<Locale> | undefined,
}

state.dict = build(state.locale)

const translate = i18n.translator(() => state.dict, i18n.resolveTemplate)

export function t(key: keyof Dictionary, params?: Record<string, string | number>) {
  return translate(key, params)
}

export function initI18n(): Promise<Locale> {
  const cached = state.init
  if (cached) return cached

  const promise = (async () => {
    const storeName = isAudit ? "audithelper.global.dat" : "opencode.global.dat"
    const store = await Store.load(storeName).catch(() => null)
    if (!store) return state.locale

    const raw = await store.get("language").catch(() => null)
    const value = parseStored(raw)
    const next = pickLocale(value) ?? state.locale

    state.locale = next
    state.dict = build(next)
    return next
  })().catch(() => state.locale)

  state.init = promise
  return promise
}
