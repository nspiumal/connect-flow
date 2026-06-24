/**
 * Language / i18n utility
 *
 * Text values are stored in /public/en.json.
 * Call `initLang()` once at app startup (already done in main.tsx).
 * Use `t(key)` anywhere in the UI to retrieve the localised string.
 */

type LangMap = Record<string, string>;

let _lang: LangMap = {};
let _initialized = false;

/**
 * Load the translation file from the public folder.
 * Must be awaited before the app renders.
 */
export async function initLang(): Promise<void> {
  if (_initialized) return;
  try {
    const res = await fetch("/en.json");
    if (!res.ok) throw new Error(`Failed to load language file: ${res.status}`);
    _lang = (await res.json()) as LangMap;
    _initialized = true;
  } catch (err) {
    console.error("[lang] Could not load /en.json – falling back to empty map.", err);
    _lang = {};
    _initialized = true;
  }
}

/**
 * Translate a key to the corresponding text value.
 * Falls back to the key itself if not found.
 *
 * @example
 *   t("SIGN_IN")          // → "Sign In"
 *   t("NO_USERS_FOUND")   // → "No users found"
 */
export function t(key: string): string {
  return _lang[key] ?? key;
}

/**
 * Returns the raw language map (read-only reference).
 * Useful for passing all strings as a prop to components.
 */
export function getLang(): Readonly<LangMap> {
  return _lang;
}

