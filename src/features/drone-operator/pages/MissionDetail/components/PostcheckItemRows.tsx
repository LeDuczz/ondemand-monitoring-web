import { useI18n } from '../../../../../shared/i18n'
import {
  viCheckMessage,
  viCheckName,
} from '../../../../../shared/lib/checkText'
import type { PostflightCheckStatus } from '../types'
import { postcheckItemRowsMessages } from './PostcheckItemRows.messages'

type PostflightItem = NonNullable<PostflightCheckStatus['items']>[number]

function inspectionLabel(
  status: string | null | undefined,
  t: typeof postcheckItemRowsMessages.vi,
) {
  if (status === 'PASS') return t.pass
  if (status === 'WARN') return t.warn
  if (status === 'FAIL') return t.fail
  return t.unknown
}

export function PostcheckItemRows({ items }: { items: PostflightItem[] }) {
  const { t } = useI18n(postcheckItemRowsMessages)

  return (
    <div
      style={{
        border: '1px solid var(--bd)',
        borderRadius: 7,
        overflow: 'hidden',
      }}
    >
      {items.map((item, idx) => {
        const isFail = item.status === 'FAIL'
        const isWarn = item.status === 'WARN'
        return (
          <div
            key={item.id ?? `${item.checkType}-${idx}`}
            style={{
              display: 'grid',
              gridTemplateColumns: '18px 1fr auto',
              gap: 6,
              alignItems: 'center',
              padding: '7px 10px',
              borderBottom:
                idx < items.length - 1 ? '1px solid var(--bd)' : 'none',
              background: isFail ? 'var(--red-bg)' : '#fff',
              fontSize: 12,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                color: isFail
                  ? 'var(--red-fg)'
                  : isWarn
                    ? 'var(--yellow-fg)'
                    : 'var(--green-fg)',
                fontSize: 13,
              }}
            >
              {isFail ? '✗' : isWarn ? '!' : '✓'}
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  color: isFail ? 'var(--red-fg)' : 'var(--tx)',
                }}
              >
                {viCheckName(item.checkName ?? item.checkType)}
              </div>
              {item.message && (
                <div
                  style={{
                    fontSize: 11,
                    color: isFail ? 'var(--red-fg)' : 'var(--tx3)',
                    marginTop: 1,
                    lineHeight: 1.35,
                  }}
                >
                  {viCheckMessage(item.message)}
                </div>
              )}
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 11.5,
                color: isFail
                  ? 'var(--red-fg)'
                  : isWarn
                    ? 'var(--yellow-fg)'
                    : 'var(--green-fg)',
                whiteSpace: 'nowrap',
              }}
            >
              {inspectionLabel(item.status, t)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
