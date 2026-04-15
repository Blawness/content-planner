# Content Plan Generator - Streaming Implementation

## Ringkasan Perubahan

Implementasi **Server-Sent Events (SSE)** untuk generate konten secara streaming dengan progress real-time.

## File-file Baru

### 1. `/app/api/ai/generate-schedule-stream/route.ts`
- Endpoint baru untuk generate schedule dengan SSE
- Mengirim progress update untuk setiap batch konten
- Event types:
  - `start`: Awal generate (total items)
  - `progress`: Update progress saat request API
  - `item`: Setiap konten selesai (includes generated item)
  - `complete`: Selesai semua (total count)
  - `error`: Error handling

### 2. `/hooks/useGenerateScheduleStream.ts`
- Custom React hook untuk handle SSE connection
- Menerima callbacks untuk setiap event stream
- Menggunakan ReadableStream untuk parse streaming response
- Support cancel operation

## File-file Termodifikasi

### 1. `/app/dashboard/schedule/page.tsx`
**Perubahan:**
- Import hook: `useGenerateScheduleStream`
- Hapus import: `generateSchedule` dari lib/api/ai
- Tambah state baru:
  - `streamProgress`: Track progress (current/total)
  - `streamMessage`: Display message
- Replace `handleGenerateAi` function dengan yang menggunakan hook
- Add progress UI:
  - Progress bar dengan counter
  - Loading message updates
  - Disable form saat loading
- Real-time update: Items ditambah ke table saat diterima

### 2. `/lib/api/ai.ts`
- Tambah function: `generateScheduleStream()`
- Wrapper untuk SSE endpoint

## Cara Kerja

### Flow Diagram
```
User Submit Form
    ↓
generateScheduleStream() hook
    ↓
POST /api/ai/generate-schedule-stream
    ↓
Backend Loop (multiple small batches)
    ↓
Backend mengirim SSE messages
    ↓
Hook parse stream
    ↓
Trigger callbacks
    ↓
Frontend update:
  - Progress counter
  - Loading message
  - Add items ke table real-time
    ↓
Complete
```

## User Experience

### Sebelum
- Loading state: "⏳ Requesting X items (multiple batches)..."
- User tunggu sampai selesai semua
- Tidak tahu progress detail

### Setelah
- Loading dimulai: "🚀 Starting... X konten akan digenerate"
- Progress update: "⏳ Generating request N..."
- Item completion: "✅ Konten 3/9 selesai" (real-time)
- Completion: "✨ Selesai! Generated X/X konten"
- Progress bar visual dengan counter

### UI Improvements
- ✅ Progress bar dengan persentase
- ✅ Counter: "3/9"
- ✅ Form disabled saat loading
- ✅ Buttons updated (Batal disabled, Generate button shows progress)
- ✅ Items ditambah ke table saat streaming

## Technical Details

### SSE Event Format
```javascript
// Client menerima:
data: {"type":"start","total":9}
data: {"type":"progress","message":"Generating request 1...","generated":0,"total":9}
data: {"type":"item","data":{...ContentPlanRow},"count":1,"total":9}
data: {"type":"item","data":{...ContentPlanRow},"count":2,"total":9}
// ... more items
data: {"type":"complete","total":9,"message":"Selesai! Generated 9/9 konten"}
```

### Performance
- **Sequential processing**: Menghindari rate limiting
- **Small batches**: 1-3 items per request
- **Real-time feedback**: User tahu progress
- **Memory efficient**: Items added incrementally

## Error Handling

- Network error: Caught dan ditampilkan
- Parse error: Graceful fallback
- API error: Return partial results jika ada
- Stream timeout: Auto cleanup

## Testing Checklist

- [ ] Form submit mengirim request correct payload
- [ ] SSE events diterima dengan format valid
- [ ] Progress bar update smooth
- [ ] Items ditambah ke table real-time
- [ ] Error handling works
- [ ] Cancel/Close modal while generating (graceful)
- [ ] Multiple consecutive generations work

## Future Improvements

1. **Persistence**: Save stream history ke DB
2. **Retry logic**: Auto-retry failed batches
3. **WebSocket fallback**: Untuk browser tanpa SSE
4. **Download progress**: Export mid-stream
5. **Batch control**: User bisa adjust batch size during generation
