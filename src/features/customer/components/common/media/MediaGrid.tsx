import type { MediaItem } from '../../../lib/media/types'
import { MediaCard } from './MediaCard'

type Props = { items: MediaItem[]; onOpen: (item: MediaItem) => void }

export function MediaGrid({ items, onOpen }: Props) {
  return (
    <ul className="md-grid">
      {items.map((item) => (
        <li key={item.id}>
          <MediaCard item={item} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}
