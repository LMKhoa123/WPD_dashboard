# Hướng Dẫn Cập Nhật Format VNĐ và Ngày Giờ Việt Nam

## ✅ Đã Hoàn Thành

1. ✅ `lib/utils.ts` - Đã thêm utility functions
2. ✅ `app/(dashboard)/payments/page.tsx`
3. ✅ `components/payments/payment-detail-dialog.tsx`
4. ✅ `components/payments/create-payment-dialog.tsx`
5. ✅ `app/(dashboard)/service-packages/page.tsx`
6. ✅ `app/(dashboard)/inventory/page.tsx` - Đã fix null check
7. ✅ `app/(dashboard)/center-auto-parts/page.tsx` - Đã fix null check

## 📝 Cần Cập Nhật

### Bước 1: Thêm Import
Vào đầu mỗi file, thêm:
```typescript
import { formatVND, formatDateTime, formatDate, formatDateFull, formatNumber } from "@/lib/utils"
```

### Bước 2: Thay Thế Patterns

#### Pattern 1: Tiền tệ
```typescript
// TÌM:
new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
const formatVnd = (v: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)
formatVnd(value)

// THAY BẰNG:
formatVND(amount)
```

#### Pattern 2: Ngày giờ đầy đủ
```typescript
// TÌM:
new Date(dateString).toLocaleString("vi-VN")
new Date(dateString).toLocaleString()

// THAY BẰNG:
formatDateTime(dateString)
```

#### Pattern 3: Chỉ ngày
```typescript
// TÌM:
new Date(dateString).toLocaleDateString("vi-VN")
new Date(dateString).toLocaleDateString()

// THAY BẰNG:
formatDate(dateString)
```

#### Pattern 4: Ngày đầy đủ (có thứ)
```typescript
// TÌM:
new Date(dateString).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

// THAY BẰNG:
formatDateFull(dateString)
```

#### Pattern 5: Số với dấu phân cách
```typescript
// TÌM:
number.toLocaleString("vi-VN")
number.toLocaleString()

// THAY BẰNG:
formatNumber(number)
```

## 📋 Danh Sách Files Cần Update

### High Priority (Có tiền và ngày giờ)

#### 1. Payment Components
- [ ] `components/payments/create-payment-manual-dialog.tsx`

#### 2. Service Package Components
- [ ] `components/service-packages/service-package-detail-dialog.tsx`

#### 3. Vehicle Pages
- [ ] `app/(dashboard)/vehicles/page.tsx`
- [ ] `app/(dashboard)/vehicles/[id]/page.tsx`
- [ ] `app/(dashboard)/vehicle-subscriptions/page.tsx`
- [ ] `components/subscriptions/vehicle-subscription-detail-dialog.tsx`

#### 4. Service Records
- [ ] `app/(dashboard)/service-records/page.tsx`
- [ ] `app/(dashboard)/service-records/board/page.tsx`
- [ ] `app/(dashboard)/technician/service-records/page.tsx`
- [ ] `components/service-records/all-suggested-parts-dialog.tsx`
- [ ] `components/service-records/service-record-dialog.tsx`
- [ ] `components/service-records/suggest-parts-dialog.tsx`

#### 5. Appointments
- [ ] `app/(dashboard)/appointments/page.tsx`
- [ ] `app/(dashboard)/appointments/[id]/page.tsx`
- [ ] `components/appointments/appointment-dialog.tsx`

#### 6. Customers
- [ ] `app/(dashboard)/customers/page.tsx`
- [ ] `app/(dashboard)/customers/[id]/page.tsx`

#### 7. Staff & Users
- [ ] `app/(dashboard)/staff/[id]/page.tsx`
- [ ] `app/(dashboard)/users/page.tsx`

#### 8. Others
- [ ] `app/(dashboard)/page.tsx` (Dashboard)
- [ ] `app/(dashboard)/profile/page.tsx`
- [ ] `app/(dashboard)/auto-parts/page.tsx`
- [ ] `app/(dashboard)/centers/page.tsx`
- [ ] `app/(dashboard)/service-checklists/page.tsx`
- [ ] `app/(dashboard)/technician/page.tsx`
- [ ] `app/(dashboard)/technician/shifts/page.tsx`
- [ ] `components/reports/top-customers-table.tsx`
- [ ] `components/staff/calendar-shift-view.tsx`

## 🔧 Script PowerShell Hỗ Trợ

### Thay thế trong một file cụ thể:
```powershell
$file = "app\(dashboard)\vehicles\page.tsx"
$content = Get-Content $file -Raw
$content = $content -replace 'new Intl\.NumberFormat\("vi-VN",\s*\{\s*style:\s*"currency",\s*currency:\s*"VND"\s*\}\)\.format\(([^)]+)\)', 'formatVND($1)'
$content = $content -replace 'new Date\(([^)]+)\)\.toLocaleString\("vi-VN"\)', 'formatDateTime($1)'
$content = $content -replace 'new Date\(([^)]+)\)\.toLocaleDateString\("vi-VN"\)', 'formatDate($1)'
$content = $content -replace '(\w+)\.toLocaleString\("vi-VN"\)', 'formatNumber($1)'
$content | Set-Content $file
```

### Thêm import nếu chưa có:
```powershell
$file = "app\(dashboard)\vehicles\page.tsx"
$content = Get-Content $file -Raw
if ($content -notmatch 'formatVND') {
    $content = $content -replace '(import.*from.*"lucide-react")', "`$1`nimport { formatVND, formatDateTime, formatDate, formatNumber } from `"@/lib/utils`""
    $content | Set-Content $file
}
```

## ⚠️ Lưu Ý Quan Trọng

1. **Backup trước khi thay đổi**: Commit code hiện tại trước khi chạy script
2. **Kiểm tra sau khi update**: Chạy `npm run build` để check errors
3. **Test từng trang**: Kiểm tra UI hiển thị đúng sau khi update
4. **Null checks**: Một số file cần thêm null check cho `part_id` và `center_id`

## 🎯 Kết Quả Mong Đợi

- Tất cả số tiền hiển thị: `100.000 ₫` (thay vì `$100,000`)
- Tất cả ngày giờ theo múi giờ Việt Nam (UTC+7)
- Format ngày: `11/11/2024, 17:30:00`
- Format số: `1.234.567 km`

## 🚀 Cách Thực Hiện Nhanh

1. Chạy script PowerShell để replace patterns tự động
2. Thêm imports vào các file đã replace
3. Check errors bằng VSCode hoặc `npm run build`
4. Sửa các lỗi còn thiếu bằng tay
5. Test UI trên browser

**Thời gian ước tính**: 30-60 phút cho tất cả files
