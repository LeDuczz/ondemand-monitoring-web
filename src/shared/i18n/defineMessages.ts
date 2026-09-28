// `defineMessages` pairs a Vietnamese message tree with its English
// translation and forces both sides to share the exact same shape (keys,
// nesting, function arities) at compile time.
//
// A message value may be:
//   - a string literal ("Đăng nhập")
//   - a function returning a string, e.g. (n: number) => `${n} mission`
//   - a nested object/record of the above (including index signatures like
//     `Record<OrderStatus, string>`)
//
// `vi`'s type is inferred as written (so string literal types stay narrow
// and readable at the call site), then widened for `en` so that e.g.
// `vi: { title: 'Đăng nhập' }` and `en: { title: 'Login' }` both type-check
// even though the literal string types differ.
//
// Usage:
//   const messages = defineMessages({
//     vi: { title: 'Đăng nhập', count: (n: number) => `${n} mission` },
//     en: { title: 'Login', count: (n: number) => `${n} missions` },
//   })
//   // messages.vi / messages.en : { title: string; count: (n: number) => string }
//
//   // then in a component:
//   const { t } = useI18n(messages)
//   <h1>{t.title}</h1>

/** Recursively widens string literal types to `string`, keeps function and
 * object shapes, so `en` only has to match `vi`'s structure, not its exact
 * literal values. */
export type DeepWiden<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : T extends object
      ? { [K in keyof T]: DeepWiden<T[K]> }
      : T

export function defineMessages<T>(messages: { vi: T; en: DeepWiden<T> }): {
  vi: T
  en: DeepWiden<T>
} {
  return messages
}
