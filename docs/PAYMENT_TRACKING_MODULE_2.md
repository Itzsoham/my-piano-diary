# 🎹 My Piano Diary — Payment Tracking System (Full Plan)

---

## 🧠 Goal

Build a **simple, elegant payment tracking system** where:

- Teacher selects **student + month**
- Sees:
  - Expected amount (from lessons)
  - Paid amount
  - Pending amount

- Can:
  - Add payments (full / partial)
  - View payment history

- Dashboard shows:
  - Unpaid students
  - Partial payments
  - Fully paid

---

# 🗂️ Database Design (Prisma)

## ✅ 1. PaymentMonth (Core)

```prisma
model PaymentMonth {
  id             String   @id @default(cuid())
  studentId      String
  month          Int
  year           Int

  expectedAmount Int
  createdAt      DateTime @default(now())

  student        Student  @relation(fields: [studentId], references: [id])
  transactions   PaymentTransaction[]

  @@unique([studentId, month, year])
}
```

---

## ✅ 2. PaymentTransaction

```prisma
model PaymentTransaction {
  id             String   @id @default(cuid())
  paymentMonthId String

  amount         Int
  method         String? // cash, bank, etc
  note           String?
  date           DateTime @default(now())

  paymentMonth   PaymentMonth @relation(fields: [paymentMonthId], references: [id])
}
```

---

## 🔁 Relationship

```
Student → PaymentMonth → PaymentTransaction
```

---

# ⚙️ Backend Logic

---

## 🔹 Core Helper

### getOrCreatePaymentMonth

```ts
function getOrCreatePaymentMonth(studentId, month, year);
```

### Logic:

- Check if exists
- If not:
  - Calculate expected from lessons
  - Create new PaymentMonth

---

## 🔹 Calculate Values

```ts
received = sum(transactions.amount);
pending = expected - received;
```

---

## 🔹 Derived Status (NO DB FIELD)

```ts
if (received === 0) => UNPAID
if (received < expected) => PARTIAL
if (received >= expected) => PAID
```

---

# 🚀 API Endpoints

---

## 1️⃣ Get Payment Summary

```
GET /api/payments?studentId=&month=&year=
```

### Response:

```json
{
  "expected": 5000,
  "received": 3000,
  "pending": 2000,
  "status": "PARTIAL",
  "transactions": [...]
}
```

---

## 2️⃣ Add Payment

```
POST /api/payments
```

### Body:

```json
{
  "studentId": "...",
  "month": 4,
  "year": 2026,
  "amount": 2000,
  "method": "cash",
  "note": "Paid after class"
}
```

### Flow:

1. getOrCreatePaymentMonth
2. Create PaymentTransaction

---

## 3️⃣ Get Dashboard Payment Stats

```
GET /api/payments/dashboard?month=&year=
```

### Response:

```json
{
  "unpaid": 3,
  "partial": 5,
  "paid": 12
}
```

---

## 4️⃣ Get All Students Payment List

```
GET /api/payments/list?month=&year=
```

### Response:

```json
[
  {
    "student": "A",
    "expected": 5000,
    "received": 2000,
    "pending": 3000,
    "status": "PARTIAL"
  }
]
```

---

# 🎨 UI Design (ShadCN + Tailwind)

---

## 🧾 1. Payment Page (Main Feature)

### Layout:

```
[ Student Select ]   [ Month Select ]

------------------------------------

💰 Summary Card:
Expected | Paid | Pending

------------------------------------

➕ Add Payment
[ Amount ] [ Method ] [ Note ] [ Save ]

------------------------------------

📜 Payment History
- ₹1000 (Cash)
- ₹2000 (UPI)
```

---

## 💎 UI Components

### 🔹 Summary Cards (3 mini cards)

- Expected → neutral
- Paid → green
- Pending → red

---

### 🔹 Add Payment Form

- Input (amount)
- Select (method)
- Optional note
- Button → primary

---

### 🔹 Payment History List

- Timeline style OR list
- Small, clean rows
- Date + amount + method

---

# 📊 Dashboard Updates

---

## 🔥 Add New Section

### 💳 Payment Overview

```
Unpaid Students     → 🔴 3
Partial Payments    → 🟡 5
Completed Payments  → 🟢 12
```

---

## 🎯 UI Style

- Small cards (not big)
- Icons + colors
- Matches your existing cards

---

# 📱 Responsiveness

---

## Mobile:

- Stack everything vertically
- Full width cards

## Tablet:

- 2-column layout

## Desktop:

- 3-column summary + side-by-side form + history

---

# 🧠 UX Flow

---

### Step 1:

Teacher selects student + month

### Step 2:

System loads or creates PaymentMonth

### Step 3:

Show summary

### Step 4:

Teacher adds payment

### Step 5:

UI updates instantly

---

# ⚠️ Edge Cases

---

## ❗ No PaymentMonth exists

→ auto create

## ❗ Overpayment

→ allow but show warning

## ❗ No lessons

→ expected = 0

---

# 🧩 Future Enhancements

---

- 📄 Invoice PDF generation
- 🔔 Payment reminders
- 📊 Analytics (monthly trends)
- 💬 Notes per student
- 💳 Online payments

---

# 👑 Final Architecture Summary

---

### ✔ Tables:

- PaymentMonth
- PaymentTransaction

### ✔ Derived:

- status
- pending

### ✔ APIs:

- 4 endpoints

### ✔ UI:

- 1 main page + dashboard widgets

---

# 💛 Final Thought

This system is:

- simple enough for her
- powerful enough for real use
- scalable for SaaS

---

**“My Piano Diary” is not just tracking lessons…
it’s organizing her whole teaching life beautifully. 🎹✨**
