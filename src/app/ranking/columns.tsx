'use client'

import { type Column, createColumnHelper } from '@tanstack/react-table'
import { ArrowUpDown } from 'lucide-react'

import { Button } from '@/components/ui/button'

import type { DataTableFeatures } from './data-table-features'

export interface Athlete {
  position: number
  name: string
  points: number
}

const columnHelper = createColumnHelper<DataTableFeatures, Athlete>()

const pointsFormat = new Intl.NumberFormat('pt-BR')

interface SortableHeaderProps<TValue> {
  column: Column<DataTableFeatures, Athlete, TValue>
  label: string
  align?: 'end'
}

const SortableHeader = <TValue,>({ align, column, label }: SortableHeaderProps<TValue>) => (
  <Button
    className={align === 'end' ? 'ml-auto' : undefined}
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
    cell: ({ getValue }) => <span className="tabular-nums">{getValue()}</span>,
    sortFn: 'basic',
  }),
  columnHelper.accessor('name', {
    header: ({ column }) => <SortableHeader column={column} label="Atleta" />,
    filterFn: 'includesString',
    sortFn: 'text',
  }),
  columnHelper.accessor('points', {
    header: ({ column }) => <SortableHeader align="end" column={column} label="Pontos" />,
    cell: ({ getValue }) => (
      <div className="text-right font-medium tabular-nums">{pointsFormat.format(getValue())}</div>
    ),
    sortFn: 'basic',
  }),
])
