import { motion } from 'motion/react'
import { UiIcon } from '../icons/UiIcon'
import { motionTokens } from '../theme/motion'
import type { Place } from '../weather/types'
import { PlainIconButton } from './primitives'
import { SettingsMenu } from './SettingsMenu'

interface Props {
  places: Place[]
  index: number
  onSelect: (i: number) => void
  onLocate: () => void
  locating: boolean
  onSearch: () => void
  onOpenList: () => void
  listOpen: boolean
  settings: React.ComponentProps<typeof SettingsMenu>
}

/** Dark translucent floating navigation: location · search · pages · cities · settings. */
export function FloatingNav({
  places,
  index,
  onSelect,
  onLocate,
  locating,
  onSearch,
  onOpenList,
  listOpen,
  settings,
}: Props) {
  return (
    <nav className="floatnav" aria-label="Navegação">
      <PlainIconButton
        icon="location"
        label="Minha localização"
        onClick={onLocate}
        pressed={locating}
      />
      <PlainIconButton icon="search" label="Buscar cidade" onClick={onSearch} />

      {places.length > 1 && (
        <div className="pager" role="tablist" aria-label="Cidades salvas">
          {places.map((p, i) => {
            const active = i === index
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={p.name}
                className="pager__dot"
                onClick={() => onSelect(i)}
              >
                {p.id === 'here' ? (
                  <motion.span
                    className="pager__glyph"
                    animate={{ opacity: active ? 1 : 0.45 }}
                    transition={motionTokens.system.fast}
                  >
                    <UiIcon name="location" size={10} />
                  </motion.span>
                ) : (
                  <motion.span
                    className="pager__mark"
                    initial={false}
                    animate={{ scale: active ? 1 : 0.78, opacity: active ? 1 : 0.4 }}
                    transition={motionTokens.system.fast}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      <PlainIconButton icon="list" label="Cidades" onClick={onOpenList} pressed={listOpen} />
      <SettingsMenu {...settings} />
    </nav>
  )
}
