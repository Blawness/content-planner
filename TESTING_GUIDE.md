# Testing Guide - Content Plan Streaming Generator

## Setup & Prerequisites

```bash
# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# Navigate to: http://localhost:3000/dashboard/schedule
```

## Manual Testing Steps

### 1. Basic Flow Test

1. **Navigate** ke Dashboard > Schedule
2. **Click** tombol "✨ Buka AI Generator"
3. **Fill form**:
   - Niche: `Digital Marketing` (atau sesuai niche Anda)
   - Platform: `Instagram`
   - Ide/Campaign: `Social Media Tips` (opsional)
   - Label Periode: `April 2026` (opsional)
   - Konten per Minggu: `3`
   - Durasi (Minggu): `2` → Total = 6 konten

4. **Click** "✨ Generate & Tambah"

### 2. Observable Behaviors (Streaming)

Saat generate berjalan, Anda akan melihat:

✅ **Progress Box** (biru):
```
⏳ Generating request 1...
[████░░░░░░░░░░░░░░░] 3/6
```

✅ **Real-time Updates**:
- "🚀 Starting... 6 konten akan digenerate"
- "⏳ Generating request 1..."
- "✅ Konten 1/6 selesai"
- "✅ Konten 2/6 selesai"
- ... (terus sampai 6)

✅ **Button Updates**:
- Button text: "⏳ 3/6..." (shows progress)
- Button & form: disabled during loading

✅ **Table Updates**:
- Konten ditambah ke tabel **saat diterima** (bukan setelah semua selesai)
- User bisa lihat items muncul satu-per-satu

### 3. Error Handling Test

**Test case A: Missing required field**
- Hapus Niche
- Click generate
- Expected: Error message muncul

**Test case B: Network error** (simulate)
- DevTools → Network → Throttle
- Set to "Offline"
- Click generate
- Expected: Error message, graceful fallback

### 4. Form Disable During Loading

Saat loading:
- ✅ Input fields opacity faded
- ✅ Cannot type in inputs
- ✅ Can click "Batal" but disabled visually

### 5. Multiple Consecutive Generations

- Generate 3 konten (6 items total)
- Setelah selesai, generate lagi 2 konten
- Expected: Berfungsi normal, tidak ada issue

## Expected Behavior Details

### Progress Counter
```
Format: "X/Y"
Example: "3/6" = 3 konten dari 6 total sudah digenerate
Updates: Setiap item completion
```

### Messages Timeline
```
1. Start: "🚀 Starting... 6 konten akan digenerate"
2. During: "⏳ Generating request 1..."
3. Item: "✅ Konten 1/6 selesai"
4. Item: "✅ Konten 2/6 selesai"
   ...
5. Complete: "✨ Selesai! Generated 6/6 konten"
```

### Progress Bar Visual
```
Start (0%):     [░░░░░░░░░░░░░░░░░░░░]
Mid (50%):      [████████░░░░░░░░░░░░]
Complete (100%): [████████████████████]
```

## Debugging

### Check Console Logs

**Backend logs** (terminal where dev server runs):
```
Request 1: need 6 items, requesting 2 items for weeks 1-1
Request 1: parsed 2 items, total now: 2
Request 2: need 4 items, requesting 3 items for weeks 1-2
...
```

**Browser console** (DevTools):
```javascript
// Should see stream events parsed
{type: "start", total: 6}
{type: "progress", message: "Generating request 1...", generated: 0, total: 6}
{type: "item", data: {...}, count: 1, total: 6}
// ... etc
```

### Enable Network Tab

1. DevTools → Network tab
2. Filter: `XHR/Fetch`
3. Look for: `/api/ai/generate-schedule-stream`
4. Response should show:
```
data: {"type":"start","total":6}
data: {"type":"progress",...}
data: {"type":"item",...}
...
```

## Troubleshooting

### Issue: No progress shown
**Check:**
- Browser console for errors
- Network tab for failed request
- Backend console for API errors

### Issue: Items not appearing in table
**Check:**
- Form data validation
- Stream parsing in hook
- Check if `onItem` callback triggered

### Issue: Stuck on loading
**Check:**
- Network → Request timeout?
- Backend → Max requests reached?
- Try Cancel button

### Issue: Form not disabled
**Check:**
- `loading` state properly set?
- `disabled={loading}` attribute present?

## Performance Notes

- Initial request might take 2-3 seconds
- Each item adds ~100ms for visual feedback
- Progress updates smooth due to transition-all
- No page freeze/janky behavior expected

## Success Criteria

- [ ] Progress visible during generation
- [ ] Counter increments correctly
- [ ] Items appear in table in real-time
- [ ] Form disabled while generating
- [ ] Error handling works
- [ ] No console errors
- [ ] Can cancel mid-stream
- [ ] Can generate multiple times sequentially

## Edge Cases to Test

1. **Generate very small (1 content)**
   - Should complete quickly
   - Progress might jump 0→1→complete

2. **Generate large (28 items = 14/week × 2 weeks)**
   - Should show multiple requests
   - Progress incremental

3. **Close modal while generating**
   - Should cleanup connection
   - No dangling requests

4. **Rapid clicks of "Generate"**
   - Should prevent double submission
   - Old request cancelled cleanly

5. **Slow network**
   - Progress still visible
   - Can see slow updates
