import { motion } from 'motion/react'

import { UiIcon } from '@/clima/icons/UiIcon'
import { motionTokens } from '@/clima/theme/motion'
import type { Place } from '@/clima/weather/types'

import { PlainIconButton } from './primitives'
import { SettingsMenu } from './SettingsMenu'

interface FloatingNavProps {
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
export const FloatingNav = ({
  places,
  index,
  onSelect,
  onLocate,
  locating,
  onSearch,
  onOpenList,
  listOpen,
  settings,
}: FloatingNavProps) => {
  return (
    <nav aria-label="Navegação" className="floatnav">
      <PlainIconButton
        icon="location"
        label="Minha localização"
        pressed={locating}
        onClick={onLocate}
      />
      <PlainIconButton icon="search" label="Buscar cidade" onClick={onSearch} />

      {places.length > 1 && (
        <div aria-label="Cidades salvas" className="pager" role="tablist">
          {places.map((p, i) => {
            const active = i === index
            return (
              <button
                key={p.id}
                aria-label={p.name}
                aria-selected={active}
                className="pager__dot"
                role="tab"
                type="button"
                onClick={() => onSelect(i)}
              >
                {p.id === 'here' ? (
                  <motion.span
                    animate={{ opacity: active ? 1 : 0.45 }}
                    className="pager__glyph"
                    transition={motionTokens.system.fast}
                  >
                    <UiIcon name="location" size={10} />
                  </motion.span>
                ) : (
                  <motion.span
                    animate={{ scale: active ? 1 : 0.78, opacity: active ? 1 : 0.4 }}
                    className="pager__mark"
                    initial={false}
                    transition={motionTokens.system.fast}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      <PlainIconButton icon="list" label="Cidades" pressed={listOpen} onClick={onOpenList} />
      <SettingsMenu {...settings} />
    </nav>
  )
}
