# PPN Tax System & IDR Currency Implementation

## Implemented Features

### 1. Database Changes
- ✅ Created `tax_settings` table for PPN configuration
- ✅ Added tax columns to `transactions` table:
  - `subtotal`: Base amount before tax
  - `tax_amount`: PPN amount
  - `tax_rate`: Tax percentage (11%)
  - `service_charge`: Optional service charge
  - `final_amount`: Grand total
- ✅ Created `calculate_transaction_total()` function for tax calculations
- ✅ Inserted default PPN 11% setting

### 2. Currency Formatting
- ✅ Created `src/lib/currency.ts` utility with:
  - `formatIDR()`: Format amounts as "IDR X,XXX"
  - `calculatePPN()`: Calculate 11% tax
  - `calculateServiceCharge()`: Calculate service charge
  - `calculateTotal()`: Complete breakdown calculation

### 3. Updated Components
✅ Files updated with `formatIDR()`:
- `src/components/dashboard/AccountantDashboard.tsx`
- `src/components/dashboard/CashierDashboard.tsx`
- `src/components/dashboard/OwnerDashboard.tsx`
- `src/components/dashboard/AddItemsToRoomDialog.tsx`
- `src/components/dashboard/RoomCard.tsx`

### 4. Translation Updates
- ✅ Changed "Rp" to "IDR" in translations (id.ts, en.ts)
- ✅ Added PPN-related translations:
  - `subtotal`: "Subtotal"
  - `ppn`: "PPN (11%)" / "VAT (11%)"
  - `service_charge`: "Service Charge"
  - `final_total`: "Total Akhir" / "Final Total"

## Remaining Files to Update

The following files still need to be updated with `formatIDR()`:

1. **src/components/dashboard/RoomDetailDialog.tsx**
   - Lines with "Rp" currency formatting
   - Add PPN calculation display
   - Show tax breakdown (Subtotal + PPN = Total)

2. **src/components/dashboard/RealtimeRevenueChart.tsx**
   - Update revenue display to IDR

3. **src/components/dashboard/RoleSpecificWidget.tsx**
   - Update all revenue/expense displays to IDR

4. **src/components/inventory/ProductList.tsx**
   - Update product price display

5. **src/components/purchase/PurchaseOrderList.tsx**
   - Update order total display

6. **src/components/dashboard/CashierDashboard.tsx**
   - Update `endRoomSession()` to calculate and save PPN
   - Use `calculateTotal()` utility function

## Tax Calculation Formula

```
Subtotal = Room Cost + Items Cost
Service Charge = Subtotal × (Service Charge Rate / 100)
Taxable Amount = Subtotal + Service Charge
PPN (11%) = Taxable Amount × 0.11
Final Amount = Taxable Amount + PPN
```

## Security Note

One security warning remains:
- **Leaked Password Protection Disabled**: User needs to enable this in Supabase Auth settings (not fixable via SQL)

## Next Steps

1. Update remaining components with `formatIDR()`
2. Add PPN display to RoomDetailDialog
3. Update CashierDashboard to save tax calculations
4. Create tax settings management UI for owners
5. Add tax report generation feature
