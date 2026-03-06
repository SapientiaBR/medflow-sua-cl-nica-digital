

## Plan: Fix Build Errors and Implement 5 Features

### 1. Fix Build Error (Settings.tsx)
The `doctors` table has `clinic_address`, `pix_key`, `faq_notes` columns in the DB but the auto-generated types.ts is stale. Cast `doctor` as `any` in lines 30-32 of Settings.tsx to bypass TypeScript until types regenerate.

### 2. Document Detail View (Documents.tsx)
- Add state `selectedDoc` and a `Dialog` to show document content when clicking a document card
- Display the document header (doctor info), content text, type badge
- Add "Imprimir" button that calls `window.print()` or opens a print-friendly view

### 3. WhatsApp & Email Buttons (Documents.tsx)
- **WhatsApp**: Open `https://wa.me/{patient_phone}?text={encoded_content}` in new tab
- **Email**: Open `mailto:{patient_email}?subject={title}&body={content}` in new tab
- Need to fetch patient phone/email - update the documents query to include `patients(name, phone, email)`

### 4. Profile Photo Upload (Settings.tsx)
- Create a storage bucket `avatars` for profile photos
- Add hidden `<input type="file">` triggered by the "Alterar Foto" button
- Upload to storage, get public URL, update `doctors.avatar_url`
- Display the avatar image if `doctor?.avatar_url` exists, otherwise show the Stethoscope icon

### 5. Dashboard: Replace Week Chart with Visual Calendar (Dashboard.tsx)
- Remove the `BarChart` "Consultas da Semana" section
- Replace with a mini calendar showing the current week as a row of day cards
- Each day card shows the date, day name, and count of appointments
- Clicking a day navigates to `/agenda`
- Today's card is highlighted

### 6. Revenue Hidden Behind Eye Icon (Dashboard.tsx)
- Add `useState` for `showRevenue` (default `false`)
- When hidden, show `R$ •••••` instead of the actual value
- Add an `Eye`/`EyeOff` icon button to toggle visibility

---

### Technical: Database Migration
- Create storage bucket `avatars` with public access for avatar URLs

### Files to Edit
- `src/pages/Settings.tsx` — fix type cast, add photo upload
- `src/pages/Documents.tsx` — add detail dialog, WhatsApp/email handlers
- `src/pages/Dashboard.tsx` — replace chart, add revenue toggle

