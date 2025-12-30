Based on the PROJECT_BLUEPRINT.md, here is the comprehensive list of necessary screens, categorized by User Role.

🔐 1. Authentication & Onboarding (Shared)
Splash Screen: Initial loading state, checking session.

Login Screen: Email/Password entry.

Sign Up Screen: User registration with Role Selection (Customer vs. Business Owner).

Forgot Password Screen: Standard recovery flow.

👤 2. Customer Screens
Focus: Discovery, Booking, and Booking Management.

Discovery Phase
Home Feed (List View): List of businesses with filters (Category, Rating).

Map View: Google Maps integration showing business pins based on latitude/longitude.

Business Profile:

Details: Name, Description, Address, Rating.

Services Tab: List of services with prices and "Book" button.

Portfolio Tab: Grid of images (portfolio_items).

Reviews Tab: List of past reviews.

Booking Phase
Slot Selection: Calendar and Time picker (Displaying times in Asia/Manila).

Checkout / Confirm Booking:

Summary of Service, Date, Time.

Payment Method Selector:

Logic: Disable "Pay at Venue" (Cash) if the business wallet balance is too low.

Options: GCash (Digital) or Cash.

Coupon Code Input.

Management Phase
My Bookings List: Tabs for "Upcoming", "Completed", "Cancelled".

Booking Details:

Status indicator.

Contact Info: Displays businesses.phone_number.

"Cancel Booking" button.

"Write Review" button (visible only if status is completed).

🏢 3. Business Owner Screens
Focus: Shop Management, Schedule, and Financials.

Shop Setup & Management
Create/Edit Business Profile:

Inputs: Name, Description, Phone (Public).

Location Picker: Map interface to set Latitude/Longitude.

Business Hours Setup.

Service Management: List of services (Add/Edit/Delete/Toggle Sale).

Portfolio Manager: Upload images to Supabase Storage.

Coupon Manager: Create and manage discount codes.

Booking Management
Dashboard (Home):

Today's Appointments.

Pending Approvals (Cash bookings).

Booking Request Screen:

Accept / Decline buttons.

Decline Reason Modal: If "Decline" is tapped, this modal must appear to capture the reason.

Active Booking Details:

Customer Info: Displays profiles.phone_number.

Action: "Mark as Completed" or "No Show".

💰 Wallet & Financials (Critical)
Wallet Dashboard:

Display wallet_balance.

"Top Up" button.

Transaction History List (Commissions, Top-ups).

Top-Up Request Form:

Instruction text: "Send GCash to 0917-XXX-XXXX".

Input: Amount.

Proof Upload: Image picker to upload the GCash receipt screenshot (proof_image_url).

Submit button.

🛡️ 4. Admin Screens
Focus: Verification and Financial Control. (Note: The blueprint mentions this could be Web or App, but here are the App screens if you build a mobile admin interface).

Admin Dashboard: Overview of pending verifications.

Wallet Top-Up Requests (Queue):

List of pending wallet transactions.

Top-Up Review Detail:

View Proof Image (Zoomable).

Action: "Approve" (Increments balance) or "Reject" (With admin notes).

Business Verification Queue: List of unverified businesses to review.

⚙️ 5. Settings & Profile (Shared)
Edit Profile: Change Name, Phone Number, Avatar.

Change Password.

Logout.