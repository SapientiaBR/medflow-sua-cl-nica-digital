

## Issues and Fixes

### 1. "Gerar Receita" and "Gerar Pedido de Exames" buttons do nothing
In `Consultation.tsx` (lines 149-150), both buttons have no `onClick` handler. They need to:
- Collect selected exams from `form` state (for pedido de exames) or conduta text (for receita)
- Create a document in the `documents` table with proper type (`receita` or `pedido_exame`)
- Show a toast confirming creation
- Optionally, the document content should be formatted from the form data

### 2. Consultation notes (medical_records) not visible anywhere
The `PatientDetail.tsx` "Histórico" tab only shows appointment date/status. The actual consultation content saved in `medical_records` is not displayed. Fix:
- Add a section in the "Histórico" tab (or a new "Prontuário" tab) that shows each medical_record's content (queixa, HMA, medicamentos, antecedentes, exame físico, conduta) with the date
- Medical records are already fetched in `PatientDetail.tsx` (line 59-66) but only used for evolution charts

### 3. Time picker restricted to :00 and :30
In `Agenda.tsx`, the new appointment modal (line 472) and edit modal (line 381) use `<Input type="time">` which allows any minute. Replace with a `<Select>` dropdown that only offers times in 30-minute intervals (e.g., 07:00, 07:30, 08:00, ... 19:00, 19:30).

---

### Technical Details

**Consultation.tsx changes:**
- Add state for receita/pedido content (textarea in a Dialog)
- On "Gerar Receita" click: open a dialog pre-filled with medications from `form.medicamentos`, let doctor edit, then insert into `documents` table with `type: 'receita'`
- On "Gerar Pedido de Exames" click: auto-generate content from checked exams in `form`, insert into `documents` with `type: 'pedido_exame'`
- Both save `appointment_id` and `patient_id` references

**PatientDetail.tsx changes:**
- In the "Histórico" tab, for each appointment with status `realizada`, show the linked medical_record content below the appointment card
- Display fields: queixa, HMA, conduta, peso, PA, exams requested
- Or add expandable accordion per appointment

**Agenda.tsx changes:**
- Generate time slots array: `['07:00', '07:30', '08:00', ..., '20:00']`
- Replace `<Input type="time">` with `<Select>` using these slots in both new appointment and edit appointment dialogs

