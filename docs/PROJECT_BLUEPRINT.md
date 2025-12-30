📱 Project Blueprint: Service Booking App (Philippines)
1. Project Overview
A multi-vendor marketplace app connecting service providers (barbers, salons, nail techs) with clients in the Philippines. The app handles discovery, booking, schedule management, and payments (Digital & Cash).

Target Market: Philippines Monetization: Commission-based (Platform fee per booking). Strategy: "Prepaid Wallet" for businesses to ensure commission collection on cash bookings. Manual Top-Up verification to minimize fees.

2. Tech Stack & Constraints
Framework: React Native (Expo Managed Workflow).

Language: TypeScript.

Styling: Standard React Native StyleSheet (No Tailwind/NativeWind). Keep styles clean and separated at the bottom of files.

Backend/Database: Supabase (PostgreSQL).

Navigation: React Navigation (Stack & Tab).

Maps: react-native-maps (Google Maps API).

Date/Time: Store all times in UTC in the database. Display times in Asia/Manila on the frontend.

3. Database Schema (Supabase / PostgreSQL)
⚠️ AI Instruction:

Use DECIMAL or NUMERIC types for all monetary values.

Audit Columns: Every table MUST have created_at, updated_at, created_by (UUID), and updated_by (UUID).

Triggers: Generate a SQL trigger to automatically update updated_at on every row change.

A. Core Users
profiles

id (UUID, PK) - Links to Supabase Auth.

email (Text)

full_name (Text)

phone_number (Text) - Required.

role (Enum: 'customer', 'business_owner', 'admin')

avatar_url (Text)

Audit: created_at, updated_at, created_by, updated_by

B. Business Data
businesses

id (UUID, PK)

owner_id (FK -> profiles.id)

name (Text)

description (Text)

address_text (Text)

latitude (Float)

longitude (Float)

phone_number (Text) - Public contact number.

accepts_cash (Boolean)

wallet_balance (Decimal, default 0.00) - Critical for cash commissions.

commission_rate (Decimal) - Default platform fee (e.g., 0.10).

is_verified (Boolean)

Audit: created_at, updated_at, created_by, updated_by

business_hours

id, business_id

day_of_week (Int: 0-6)

open_time, close_time (Time)

is_closed (Boolean)

Audit: created_at, updated_at, created_by, updated_by

services

id, business_id

name (Text)

description (Text)

price (Decimal)

duration_minutes (Int)

sale_price (Decimal, Nullable)

is_on_sale (Boolean)

Audit: created_at, updated_at, created_by, updated_by

portfolio_items (Gallery)

id, business_id

image_url (Text)

description (Text)

service_id (UUID, Nullable)

Audit: created_at, updated_at, created_by, updated_by

C. Financials & Booking
coupons

id, business_id

code (Text, Unique per business)

discount_type (Enum: 'percentage', 'fixed')

value (Decimal)

min_spend (Decimal)

usage_limit (Int)

expires_at (Timestamp)

Audit: created_at, updated_at, created_by, updated_by

wallet_transactions (The Ledger)

id, business_id

amount (Decimal)

type (Enum: 'top_up', 'commission_deduction', 'refund', 'withdrawal')

status (Enum: 'pending', 'approved', 'rejected') - Updated for manual flow.

reference_id (Text)

proof_image_url (Text) - New: Stores the screenshot of the GCash receipt.

admin_notes (Text) - New: Reason for rejection or approval notes.

Audit: created_at, updated_at, created_by, updated_by

bookings

id (UUID, PK)

customer_id (FK), business_id (FK), service_id (FK)

start_time (Timestamp UTC)

end_time (Timestamp UTC)

status (Enum: 'pending_approval', 'confirmed', 'completed', 'cancelled', 'no_show', 'declined')

payment_method (Enum: 'cash', 'digital_wallet')

payment_status (Enum: 'unpaid', 'paid', 'refunded')

Financial Breakdown:

original_price (Decimal)

discount_amount (Decimal)

voucher_code_used (Text)

tip_amount (Decimal)

platform_fee (Decimal)

final_total (Decimal)

decline_reason (Text, Nullable) - Required if status is 'declined'.

Audit: created_at, updated_at, created_by, updated_by

D. Social & Logs
reviews

id, booking_id, customer_id, business_id

rating (Int 1-5), comment (Text)

Audit: created_at, updated_at, created_by, updated_by

audit_logs

id, user_id, action, details (JSON)

Audit: created_at, updated_at, created_by, updated_by

4. Key Business Logic
A. Manual Wallet Top-Up (No Gateway Fees)
Instruction: Business sees "Send GCash to 0917-XXX-XXXX".

Submission: Business enters Amount and uploads a Screenshot of the receipt (proof_image_url).

Creation: Insert wallet_transactions with status pending.

Verification (Admin Side):

Admin reviews the screenshot.

If Valid: Admin clicks "Approve". System updates status to approved AND increments businesses.wallet_balance.

If Invalid: Admin clicks "Reject" (with reason). Status becomes rejected. Balance is unchanged.

B. Booking Flow & Payment
Selection: Customer selects Service + Date + Time.

Payment Method Check:

App checks businesses.accepts_cash.

If true: Checks businesses.wallet_balance.

If wallet_balance >= Commission Fee: Show "Pay at Venue".

If wallet_balance < Commission Fee: Hide "Pay at Venue" (or show disabled with tooltip).

If false: Only show "Pay Now (GCash)".

Booking Creation:

Digital Payment: Status defaults to confirmed. (Commission split automatically via gateway).

Cash Payment: Status defaults to pending_approval. Immediately deduct commission from wallet_balance.

Note: If the booking is later Cancelled or Declined, the commission must be refunded to the wallet automatically.

Pricing Calculation: (Base Price - Coupon Discount) + Tip = Final Total.

C. The "Decline" Rule
If a Business Owner rejects a booking with status: pending_approval (Cash bookings), the UI must prompt for a "Reason for Decline".

This reason is saved to bookings.decline_reason and sent to the customer via notification.

D. Contact Visibility
Booking Details Screen (Customer View): Must display the businesses.phone_number.

Booking Details Screen (Business View): Must display the profiles.phone_number of the customer.

Action: Tap number to open phone dialer/SMS.

5. Implementation Roadmap
Phase 1: Foundation
Initialize Expo project.

Setup Supabase client & Database tables (Ensure all tables have Audit columns).

Create Auth Screens (Login/Signup).

Phase 2: Business & Discovery
Create "Add Business" flow (Location Pinning + Portfolio Upload).

Create "Add Service" flow.

Customer Home Feed (Map View & List View).

Phase 3: The Wallet & Financials (Critical)
Wallet UI: Screen for Business to see Balance, History, and "Top Up Request" form.

Image Upload: Implement Supabase Storage for uploading "Proof of Payment" screenshots.

Admin Dashboard (Web or App): Simple view for YOU to see pending Top-Ups and click "Approve/Reject".

Logic: Implement WalletService to handle manual approval (DB Triggers or Admin Function).

Phase 4: The Booking Engine
Implement AvailabilityService: Check overlapping times in DB.

Build Booking Checkout Screen:

Logic: Hide "Cash" option if Business Wallet is low.

Booking Details UI: Ensure Phone Numbers are visible for both parties.

Phase 5: Management & Rules
Business Dashboard: "Accept/Decline" logic with Mandatory Decline Reason.

Customer "My Bookings" page.

Reviews & Ratings.

6. Coding Guidelines for AI
StyleSheet: Do not use external styling libraries. Use StyleSheet.create({}) at the bottom of the component file.

Clean Components: Separate Logic (Hooks) from UI (Components) where possible.

Strict Typing: Define TypeScript interfaces for all Supabase tables.

Error Handling: Always wrap Supabase calls in try/catch blocks and alert the user on error.

Timezone: All frontend dates must be formatted to Asia/Manila before display.

Audit Data: When inserting/updating data, always ensure created_by or updated_by is populated with the current User ID.