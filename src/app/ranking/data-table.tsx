'use client'

import {
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  useTable,
} from '@tanstack/react-table'
import { useState } from 'react'

import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { type DataTableFeatures, features } from './data-table-features'

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
}

export const DataTable = <TData extends RowData>({ columns, data }: DataTableProps<TData>) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'position', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useTable({
    features,
    columns,
    data,
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
  })

  const nameColumn = table.getColumn('name')
  const filterValue = nameColumn?.getFilterValue()

  return (
    <div>
      <div className="flex items-center py-4">
        <Input
          className="max-w-sm border-white/15 bg-white/5 text-white placeholder:text-zinc-400"
          placeholder="Buscar atleta"
          value={typeof filterValue === 'string' ? filterValue : ''}
          onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
        />
      </div>
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-white/10 hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-zinc-300">
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-white/10 hover:bg-white/5">
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id}>
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center text-zinc-300" colSpan={columns.length}>
                  Nenhum atleta encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
