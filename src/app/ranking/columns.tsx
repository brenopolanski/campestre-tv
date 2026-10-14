'use client'

import { type Column, createColumnHelper } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { DataTableFeatures } from './data-table-features'
import { formatPoints } from './format'
import { RankBadge } from './rank-badge'

export interface Athlete {
  position: number
  name: string
  points: number
}

const columnHelper = createColumnHelper<DataTableFeatures, Athlete>()

interface SortableHeaderProps<TValue> {
  column: Column<DataTableFeatures, Athlete, TValue>
  label: string
  align?: 'end'
}

const SortableHeader = <TValue,>({ align, column, label }: SortableHeaderProps<TValue>) => (
  <Button
    className={
      align === 'end'
        ? 'ml-auto text-zinc-300 hover:bg-white/10 hover:text-white'
        : 'text-zinc-300 hover:bg-white/10 hover:text-white'
    }
    size="sm"
    variant="ghost"
    onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
  >
    {label}
    <ArrowUpDown />
  </Button>
)

export const columns = columnHelper.columns([
  columnHelper.accessor('position', {
    header: ({ column }) => <SortableHeader column={column} label="Posição" />,
    cell: ({ getValue }) => <RankBadge position={getValue()} />,
    sortFn: 'basic',
  }),
  columnHelper.accessor('name', {
    header: ({ column }) => <SortableHeader column={column} label="Atleta" />,
    cell: ({ getValue }) => (
      <span className="block max-w-48 truncate sm:max-w-md">{getValue()}</span>
    ),
    filterFn: 'includesString',
    sortFn: 'text',
  }),
  columnHelper.accessor('points', {
    header: ({ column }) => <SortableHeader align="end" column={column} label="Pontos" />,
    cell: ({ getValue }) => (
      <div className="text-right">
        <span className="inline-flex min-w-14 justify-center rounded-full bg-zinc-700 px-3 py-1 text-sm font-medium text-zinc-50 tabular-nums">
          {formatPoints(getValue())}
        </span>
      </div>
    ),
    sortFn: 'basic',
  }),
])
