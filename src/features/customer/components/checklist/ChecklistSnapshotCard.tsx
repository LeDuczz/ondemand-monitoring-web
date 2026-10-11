import type { ReactNode } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { Card } from '../../../../shared/components/ui'
import { checklistMessages } from '../../lib/checklist/messages'
import type { ChecklistSnapshot } from '../../lib/checklist/types'
import './Checklist.css'

export function ChecklistSnapshotCard({
  items = [],
  snapshotAt,
  title,
}: {
  items?: ChecklistSnapshot[]
  snapshotAt?: string | null
  /** Optional heading node (e.g. with an icon chip); defaults to the plain title. */
  title?: ReactNode
}) {
  const { t } = useI18n(checklistMessages)
  return (
    <div role="region" aria-label={t.title}>
      <Card className="checklist-card" title={title ?? t.title}>
        <p className="checklist-lock">{t.locked}</p>
        <p className="checklist-hint">{t.history}</p>
        {items.length ? (
          <ol className="checklist-snapshot">
            {[...items]
              .sort(
                (a, b) =>
                  a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
              )
              .map((item) => (
                <li key={item.id}>{item.content}</li>
              ))}
          </ol>
        ) : (
          <p>{snapshotAt ? t.emptySnapshot : t.legacy}</p>
        )}
      </Card>
    </div>
  )
}
