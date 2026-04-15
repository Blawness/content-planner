# Quick Start - Content Plan Streaming Generator

## 🚀 Cara Cepat Mulai Testing

### 1. Update Dependencies (jika diperlukan)
```bash
cd content-planner
npm install  # atau skip jika sudah up-to-date
```

### 2. Jalankan Dev Server
```bash
npm run dev
# Tunggu sampai "ready - started server on..."
```

### 3. Buka di Browser
```
http://localhost:3000/dashboard/schedule
```

### 4. Test Generate
1. Click **"✨ Buka AI Generator"**
2. Isi form:
   ```
   Niche: Digital Marketing
   Platform: Instagram
   Konten per Minggu: 3
   Durasi (Minggu): 2
   ```
3. Click **"✨ Generate & Tambah"**
4. **Lihat progress real-time** ✨

## 📊 Apa yang Harus Anda Lihat

### Progress Updates (dalam 8-10 detik)
```
🚀 Starting... 6 konten akan digenerate
[░░░░░░░░░░░░░░░░░░░░]  0/6

↓ (1-2 detik)

⏳ Generating request 1...
[████░░░░░░░░░░░░░░░░]  2/6

↓ (1 detik)

✅ Konten 1/6 selesai
[████░░░░░░░░░░░░░░░░]  1/6

↓ (1 detik)

✅ Konten 2/6 selesai
[████████░░░░░░░░░░░░]  2/6

↓ (repeat until...)

✨ Selesai! Generated 6/6 konten
[████████████████████]  6/6
```

### Table Updates
- Items muncul **satu-per-satu** di tabel
- Bukan tunggu semua selesai baru keluar

## 🔍 Debugging

### Jika Ada Masalah

**1. Check Browser Console** (DevTools → Console)
```
Cari error messages atau warnings
```

**2. Check Network Tab** (DevTools → Network)
```
Cari request ke /api/ai/generate-schedule-stream
Response harus berupa text/event-stream
```

**3. Check Backend Logs** (Terminal dev server)
```
Cari logs seperti:
"Starting stream: target X items"
"Request 1: need X items"
"parsed X items, total now: Y"
```

## ✅ Expected Behavior

- ✅ Progress bar smooth fill
- ✅ Counter updates: 0/6 → 1/6 → 2/6 → ... → 6/6
- ✅ Messages change real-time
- ✅ Form fields disabled saat loading
- ✅ Button text shows progress: "⏳ 3/6..."
- ✅ No console errors
- ✅ Modal closes after complete

## ❌ Common Issues & Fixes

### Issue: "No progress shown"
**Check:**
- Network working? (check DevTools Network)
- Backend running? (check terminal for errors)
- AuthToken valid? (check console for auth errors)

**Fix:**
- Restart dev server: `npm run dev`
- Check `.env` file auth setup
- Check browser console for errors

### Issue: "Items not in table"
**Check:**
- Is stream events being received? (check Network tab)
- Are callbacks triggered? (add console.log in onItem)

**Fix:**
- Check Network tab response
- Check browser console
- Restart dev server

### Issue: "Stuck loading forever"
**Check:**
- Is request timeout? (Network tab shows pending)
- Is backend API responding? (check backend logs)

**Fix:**
- Refresh page
- Check API keys in .env
- Check backend for errors

## 🧪 Quick Test Scenarios

### Scenario 1: Small Test (FASTEST)
```
Settings:
- Niche: Tech
- Platform: Instagram  
- Konten per Minggu: 1
- Durasi: 1 minggu
Total: 1 konten (very fast)
```

### Scenario 2: Medium Test (RECOMMENDED)
```
Settings:
- Niche: Digital Marketing
- Platform: Instagram
- Konten per Minggu: 3
- Durasi: 2 minggu
Total: 6 konten (~8-10 seconds)
```

### Scenario 3: Large Test
```
Settings:
- Niche: E-commerce
- Platform: TikTok
- Konten per Minggu: 7
- Durasi: 2 minggu
Total: 14 konten (~20-30 seconds)
```

## 📈 Performance Expectations

| Total Items | Est. Time | Batches |
|-------------|-----------|---------|
| 1-3        | 2-4s      | 1       |
| 3-6        | 6-10s     | 2-3     |
| 6-10       | 10-15s    | 3-4     |
| 10-14      | 15-20s    | 4-5     |
| 14+        | 20-30s    | 5+      |

## 📚 Documentation Files

Created new docs:
- 📋 `IMPLEMENTATION_SUMMARY.md` - Detailed overview
- 🧪 `TESTING_GUIDE.md` - Comprehensive test cases
- 📊 `BEFORE_AFTER_COMPARISON.md` - Visual comparison
- 🎯 `STREAMING_IMPLEMENTATION.md` - Technical details

## 🎬 Demo Flow

1. **Open Dashboard** → Schedule page
2. **Click** "✨ Buka AI Generator"
3. **Fill** form (use Scenario 2 above)
4. **Click** "✨ Generate & Tambah"
5. **Watch** progress update real-time
6. **See** items appear in table
7. **Wait** for "✨ Selesai!" message
8. **Close** modal automatically

## 💡 Pro Tips

- **Use 1 item** first to test basic flow (fastest)
- **Check browser console** if anything looks wrong
- **Check Network tab** to see SSE events
- **Check backend logs** for generation details
- **Refresh** if modal gets stuck
- **Test multiple times** to verify consistency

## 🔗 Key Files Modified

1. `app/dashboard/schedule/page.tsx` - Main UI
2. `app/api/ai/generate-schedule-stream/route.ts` - Backend SSE
3. `hooks/useGenerateScheduleStream.ts` - Frontend hook
4. `lib/api/ai.ts` - API client function

## 🎯 Success Criteria

After testing, you should see:
- [ ] Progress updates in real-time
- [ ] Counter incrementing (1/6, 2/6, etc)
- [ ] Items appearing in table one-by-one
- [ ] No console errors
- [ ] Form disabled during loading
- [ ] Modal closes on success

---

**Ready?** Run `npm run dev` and test it out! 🚀

Questions? Check the detailed docs above! 📚
