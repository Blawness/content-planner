# Plan: Filter & Search — Content Plan

## File yang akan disentuh

| File | Perubahan |
|---|---|
| `components/features/schedule/utils.ts` | Tambah fungsi `filterRows()` |
| `components/features/schedule/FilterBar.tsx` | Komponen baru (search input + 2 dropdown + badge + reset) |
| `app/dashboard/schedule/page.tsx` | 3 state baru, `filteredRows` derived, update `weekKeys`, `exportToCsv`, render `FilterBar` |
| `components/features/schedule/ContentPlanTable.tsx` | Tidak ada perubahan |

---

## 1. `filterRows` — tambah ke `utils.ts`

```ts
export function filterRows(
  rows: ContentPlanRow[],
  query: string,
  status: string,
  format: string
): ContentPlanRow[] {
  const q = query.trim().toLowerCase()
  return rows.filter((row) => {
    if (q) {
      const matched =
        row.topic.toLowerCase().includes(q) ||
        row.headline.toLowerCase().includes(q) ||
        row.hook_caption.toLowerCase().includes(q)
      if (!matched) return false
    }
    if (status && row.status !== status) return false
    if (format && row.format !== format) return false
    return true
  })
}
```

---

## 2. `FilterBar` — komponen baru

**Path:** `components/features/schedule/FilterBar.tsx`

**Props:**
```ts
interface FilterBarProps {
  searchQuery: string
  statusFilter: string
  formatFilter: string
  totalCount: number
  filteredCount: number
  isFiltering: boolean
  onSearchChange: (value: string) => void
  onStatusChange: (value: string) => void
  onFormatChange: (value: string) => void
  onReset: () => void
}
```

**UI:**
- Search `<Input>` dengan ikon `Search` di kiri — cari `topic`, `headline`, `hook_caption`
- Status dropdown: `STATUS_OPTIONS` + "Semua Status" (sentinel `'__all__'` → `''`)
- Format dropdown: `FORMAT_OPTIONS` + "Semua Format" (sentinel `'__all__'` → `''`)
- Badge `"X dari Y item"` + tombol Reset `<X />` — hanya muncul saat `isFiltering === true`

---

## 3. Perubahan `page.tsx`

### 3a. State baru (setelah `rows` state)
```ts
const [searchQuery, setSearchQuery]   = useState('')
const [statusFilter, setStatusFilter] = useState('')
const [formatFilter, setFormatFilter] = useState('')
```

### 3b. Derived values (sebelum `weekKeys`)
```ts
const filteredRows = useMemo(
  () => filterRows(rows, searchQuery, statusFilter, formatFilter),
  [rows, searchQuery, statusFilter, formatFilter]
)

const isFiltering = searchQuery.trim() !== '' || statusFilter !== '' || formatFilter !== ''
```

### 3c. Update `weekKeys` — pakai `filteredRows`
```ts
// sebelum:
() => Array.from(new Set(sortRows(rows).map(...)))
// sesudah:
() => Array.from(new Set(sortRows(filteredRows).map(...)))
```

### 3d. Reset handler
```ts
function handleResetFilters() {
  setSearchQuery('')
  setStatusFilter('')
  setFormatFilter('')
}
```

### 3e. Export CSV — pakai `filteredRows`
```tsx
// sebelum:
onClick={() => exportToCsv(rows)}
// sesudah:
onClick={() => exportToCsv(filteredRows)}
```

### 3f. JSX — tambah `FilterBar` di atas tabel, pass `filteredRows` ke tabel

```tsx
{!authLoading && !isUnauthorized && !loadingItems && !pageError && rows.length > 0 ? (
  <>
    <FilterBar
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      formatFilter={formatFilter}
      totalCount={rows.length}
      filteredCount={filteredRows.length}
      isFiltering={isFiltering}
      onSearchChange={setSearchQuery}
      onStatusChange={setStatusFilter}
      onFormatChange={setFormatFilter}
      onReset={handleResetFilters}
    />
    <ContentPlanTable
      rows={filteredRows}   {/* <-- ganti dari rows */}
      weekKeys={weekKeys}
      ...handler props sama...
    />
  </>
) : null}
```

---

## 4. Index mismatch fix

Handler `handleEdit`, `handleDelete`, `handleQuickStatusChange` memakai index ke array `rows`
(full), tapi tabel menerima `filteredRows`. Atasi dengan wrapper di JSX:

```tsx
onEdit={(idx) => {
  const target = filteredRows[idx]
  const realIdx = rows.findIndex((r) => r.id === target.id)
  handleEdit(realIdx)
}}
onDelete={(idx) => {
  const target = filteredRows[idx]
  const realIdx = rows.findIndex((r) => r.id === target.id)
  void handleDelete(realIdx)
}}
onStatusChange={(idx, status) => {
  const target = filteredRows[idx]
  const realIdx = rows.findIndex((r) => r.id === target.id)
  void handleQuickStatusChange(realIdx, status)
}}
```

Tidak perlu refactor signature handler yang sudah ada.
