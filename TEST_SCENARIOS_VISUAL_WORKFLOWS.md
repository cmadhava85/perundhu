# 🎬 Test Scenarios - Step-by-Step Visual Workflows

**Visual Test Flows for Manual Testing**

---

## 👤 SCENARIO 1: New User Registration & First Search

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Open App Homepage                                    │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Perundhu Bus Finder              │                        │
│  │ ────────────────────────────────  │                        │
│  │ From: [Select Location]           │                        │
│  │ To: [Select Location]             │                        │
│  │ [Search Button]                   │                        │
│  │                                  │                        │
│  │ [Login] [Register] [Guest]       │                        │
│  └──────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: Click Register                                       │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Create Account                   │                        │
│  │ ────────────────────────────────  │                        │
│  │ Email: [____________]             │                        │
│  │ Password: [____________]          │                        │
│  │ Confirm: [____________]           │                        │
│  │                                  │                        │
│  │ [Register]  [Cancel]             │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Type valid email                                    │
│ ✓ Test: Type strong password (8+ chars, mix upper/lower)   │
│ ✓ Test: Confirm password matches                           │
│ ✓ Test: Click Register                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 3: Confirm Email                                        │
├─────────────────────────────────────────────────────────────┤
│ Expected:                                                    │
│ ✓ Confirmation email arrives                                │
│ ✓ Click link in email → Account activated                  │
│ ✓ Redirected to login page                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 4: Login to Account                                     │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Login                            │                        │
│  │ ────────────────────────────────  │                        │
│  │ Email: [____________]             │                        │
│  │ Password: [____________]          │                        │
│  │ ☐ Remember me                    │                        │
│  │                                  │                        │
│  │ [Login]  [Forgot Password?]      │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Enter email and password                            │
│ ✓ Test: Click Login                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 5: Home Page (Logged In)                                │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Home  Search  Contribute Dashboard                       │
│  │ ────────────────────────────────  │                        │
│  │ From: [Select Location]           │                        │
│  │ To: [Select Location]             │                        │
│  │ [Search]  [Clear]                 │                        │
│  │                                  │                        │
│  │ User: user@email.com  [Logout]   │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: User menu shows                                      │
│ ✓ Test: Navigation tabs visible                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 6: Search for Buses                                     │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ From: [Type "Chennai"]           │                        │
│  │ Suggestions:                     │                        │
│  │ • Chennai Central Station        │                        │
│  │ • Chennai Airport                │                        │
│  │ • Chengalpattu                   │                        │
│  │                                  │                        │
│  │ [Select: Chennai Central]        │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Autocomplete shows suggestions                      │
│ ✓ Test: Select from list                                    │
│ ✓ Test: Repeat for "To" location                            │
│ ✓ Test: Click Search                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 7: View Search Results                                  │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Results: Chennai → Bangalore      │                        │
│  │                                  │                        │
│  │ ┌────────────────────────────┐   │                        │
│  │ │ Route 41A  ★ 4.5           │   │                        │
│  │ │ 6:00 AM → 12:30 PM (6:30h) │   │                        │
│  │ │ ₹450  •  2 seats            │   │                        │
│  │ │ Stops: 15                   │   │                        │
│  │ │ [Details] [Track] [Review] │   │                        │
│  │ └────────────────────────────┘   │                        │
│  │                                  │                        │
│  │ ┌────────────────────────────┐   │                        │
│  │ │ Route 42   ★ 4.2           │   │                        │
│  │ │ 7:00 AM → 1:30 PM (6:30h)  │   │                        │
│  │ │ ₹400  •  1 seat             │   │                        │
│  │ │ Stops: 12                   │   │                        │
│  │ │ [Details] [Track] [Review] │   │                        │
│  │ └────────────────────────────┘   │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: All buses displayed                                  │
│ ✓ Test: Correct sorting (time/price)                        │
│ ✓ Test: Click "Details" for full info                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 8: Track Bus in Real-Time                               │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Route 41A - Live Tracking       │                        │
│  │                                  │                        │
│  │ [Interactive Map]                │                        │
│  │ │ Red bus icon moving            │                        │
│  │ │ on route line                  │                        │
│  │                                  │                        │
│  │ Next Stops:                      │                        │
│  │ 1. Central Station (ETA: 2 min)  │                        │
│  │ 2. Park Station (ETA: 8 min)     │                        │
│  │ 3. Broadway Station (ETA: 15 min)│                        │
│  │                                  │                        │
│  │ [Back] [Share] [Refresh]        │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Map displays with bus marker                        │
│ ✓ Test: Bus position updates every 5-10s                   │
│ ✓ Test: Next stops show ETAs                                │
│ ✓ Test: Click stop for stop details                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 9: View & Leave Review                                  │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Route 41A Reviews                │                        │
│  │                                  │                        │
│  │ Average Rating: ★★★★☆ (4.5/5)   │                        │
│  │ Based on 250 reviews             │                        │
│  │                                  │                        │
│  │ [★★★★★] Write a Review ▼        │                        │
│  │                                  │                        │
│  │ Recent Reviews:                  │                        │
│  │ ★★★★★ "Great service!"          │                        │
│  │ - John D. • 2 days ago           │                        │
│  │                                  │                        │
│  │ ★★★☆☆ "A bit crowded"          │                        │
│  │ - Sarah M. • 1 week ago          │                        │
│  │                                  │                        │
│  │ [Load More Reviews]              │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Click to write review                               │
│ ✓ Test: Select stars                                        │
│ ✓ Test: Type comment                                        │
│ ✓ Test: Submit review                                       │
│ ✓ Test: Review appears in list                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚌 SCENARIO 2: User Contributes New Bus Route

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Navigate to Contribution Section                     │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Home Search [Contribute] Dashboard                       │
│  │ ────────────────────────────────  │                        │
│  │ Help improve Perundhu!           │                        │
│  │                                  │                        │
│  │ What would you like to share?    │                        │
│  │ ☐ New Bus Route                  │                        │
│  │ ☐ Bus Stop Image                 │                        │
│  │ ☐ Report an Issue                │                        │
│  │                                  │                        │
│  │ [Manual Input] [Voice] [Image]   │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Click "New Bus Route"                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: Enter Bus Route Details                              │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Add New Bus Route                │                        │
│  │ ────────────────────────────────  │                        │
│  │                                  │                        │
│  │ Bus Number: [41A________]        │                        │
│  │ Type: [Ordinary ▼]               │                        │
│  │ Operator: [CMRL ▼]               │                        │
│  │                                  │                        │
│  │ Route Name: [____________________] │                        │
│  │ Start Point: [Select Location]   │                        │
│  │ End Point: [Select Location]     │                        │
│  │                                  │                        │
│  │ Departure: [06:00 AM]            │                        │
│  │ Arrival: [12:30 PM]              │                        │
│  │ Duration: [6h 30m]               │                        │
│  │                                  │                        │
│  │ Fare: [₹450_____]                │                        │
│  │ Frequency: [Every 30 min ▼]      │                        │
│  │                                  │                        │
│  │ [Add Stop] [Remove]              │                        │
│  │                                  │                        │
│  │ [Cancel] [Save Draft] [Submit]   │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Fill all required fields                            │
│ ✓ Test: Time validation (arrival > departure)              │
│ ✓ Test: Fare must be positive number                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 3: Add Bus Stops                                        │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Add Stops to Route               │                        │
│  │ ────────────────────────────────  │                        │
│  │                                  │                        │
│  │ Stops (15 total):                │                        │
│  │ 1. Central Station  [6:00 AM]    │                        │
│  │ 2. Park Station     [6:12 AM]    │                        │
│  │ 3. Broadway         [6:25 AM]    │                        │
│  │ ...                             │                        │
│  │ 15. Airport         [12:30 PM]   │                        │
│  │                                  │                        │
│  │ [Add Another Stop] [Remove Last] │                        │
│  │                                  │                        │
│  │ [Back] [Save] [Submit]          │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Add stop - location + time                          │
│ ✓ Test: Times in ascending order                            │
│ ✓ Test: Remove stop functionality                           │
│ ✓ Test: Validation on each stop                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 4: Review Before Submission                             │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Review Your Contribution         │                        │
│  │ ────────────────────────────────  │                        │
│  │                                  │                        │
│  │ Route: 41A (Ordinary)            │                        │
│  │ Chennai Central → Bangalore      │                        │
│  │                                  │                        │
│  │ Schedule: 6:00 AM - 12:30 PM    │                        │
│  │ Duration: 6h 30m                │                        │
│  │ Fare: ₹450                       │                        │
│  │ Stops: 15                        │                        │
│  │                                  │                        │
│  │ Map Preview: [Interactive Map]   │                        │
│  │                                  │                        │
│  │ By submitting, you agree to      │                        │
│  │ our contribution guidelines.     │                        │
│  │                                  │                        │
│  │ [Edit] [Cancel] [Submit]        │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: All data displayed correctly                        │
│ ✓ Test: Edit button works                                   │
│ ✓ Test: Submit creates contribution                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 5: Success Confirmation                                 │
├─────────────────────────────────────────────────────────────┤
│ Expected:                                                    │
│  ┌──────────────────────────────────┐                        │
│  │ ✓ Contribution Submitted!        │                        │
│  │                                  │                        │
│  │ Your route contribution has been │                        │
│  │ submitted for admin review.      │                        │
│  │                                  │                        │
│  │ Route: 41A                       │                        │
│  │ Status: PENDING                  │                        │
│  │ ID: CONTRIB-12345               │                        │
│  │                                  │                        │
│  │ You'll receive email notification│                        │
│  │ when approved/rejected.          │                        │
│  │                                  │                        │
│  │ [View my Contributions]          │                        │
│  │ [Back to Home]                   │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Success message shown                               │
│ ✓ Test: Contribution ID provided                            │
│ ✓ Test: View in dashboard                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 6: Dashboard Shows Pending Contribution                 │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ My Contributions                 │                        │
│  │ ────────────────────────────────  │                        │
│  │                                  │                        │
│  │ Route 41A (PENDING)              │                        │
│  │ Submitted: Jan 8, 2026           │                        │
│  │ Status: Awaiting admin review    │                        │
│  │ Stops: 15 • Fare: ₹450          │                        │
│  │                                  │                        │
│  │ Points Earned:                   │                        │
│  │ • Submission: +10 points         │                        │
│  │ • (Will get more if approved)    │                        │
│  │                                  │                        │
│  │ [View Details] [Edit] [Delete]   │                        │
│  │                                  │                        │
│  │ History:                         │                        │
│  │ (Previous approved/rejected)     │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Contribution appears in list                        │
│ ✓ Test: Status shows "PENDING"                              │
│ ✓ Test: Can view/edit/delete                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ SCENARIO 3: Admin Approves Contributions

```
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Admin Dashboard Access                               │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ [Admin Mode] Perundhu            │                        │
│  │ ────────────────────────────────  │                        │
│  │ [Routes] [Images] [Issues]       │                        │
│  │ [Users] [Analytics] [Settings]   │                        │
│  │                                  │                        │
│  │ Admin: admin@perundhu.com        │                        │
│  │ [Settings] [Logout]              │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Admin-only interface                                │
│ ✓ Test: All admin tabs visible                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 2: View Pending Contributions                           │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Routes → Pending Contributions   │                        │
│  │ ────────────────────────────────  │                        │
│  │ Filter: [All ▼] Sort: [Date ▼]   │                        │
│  │ Search: [_________________]      │                        │
│  │                                  │                        │
│  │ Showing 5 of 12 pending:         │                        │
│  │                                  │                        │
│  │ ┌────────────────────────────┐   │                        │
│  │ │ Route 41A                  │   │                        │
│  │ │ Submitted: Jan 8, 2026      │   │                        │
│  │ │ User: testuser@email.com   │   │                        │
│  │ │ Stops: 15 • Fare: ₹450    │   │                        │
│  │ │ [View] [Approve] [Reject]  │   │                        │
│  │ └────────────────────────────┘   │                        │
│  │                                  │                        │
│  │ ┌────────────────────────────┐   │                        │
│  │ │ Route 42                   │   │                        │
│  │ │ Submitted: Jan 7, 2026      │   │                        │
│  │ │ User: another@email.com    │   │                        │
│  │ │ Stops: 12 • Fare: ₹400    │   │                        │
│  │ │ [View] [Approve] [Reject]  │   │                        │
│  │ └────────────────────────────┘   │                        │
│  │                                  │                        │
│  │ [Previous] [Next]                │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: All pending items shown                             │
│ ✓ Test: Pagination works                                    │
│ ✓ Test: Search filters results                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 3: View Contribution Details                            │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Route 41A - Details              │                        │
│  │ ────────────────────────────────  │                        │
│  │                                  │                        │
│  │ Submitted by: testuser@email    │                        │
│  │ Submission Date: Jan 8, 2026     │                        │
│  │ Status: PENDING                  │                        │
│  │ Confidence: High                 │                        │
│  │                                  │                        │
│  │ Bus Details:                     │                        │
│  │ • Number: 41A                    │                        │
│  │ • Type: Ordinary                 │                        │
│  │ • Route: Chennai Central → BLR  │                        │
│  │ • Duration: 6h 30m              │                        │
│  │ • Fare: ₹450                     │                        │
│  │                                  │                        │
│  │ Stops (15):                      │                        │
│  │ 1. Central Station  6:00 AM      │                        │
│  │ 2. Park Station     6:12 AM      │                        │
│  │ ...                             │                        │
│  │ 15. Airport        12:30 PM      │                        │
│  │                                  │                        │
│  │ Map Preview: [Interactive Map]   │                        │
│  │                                  │                        │
│  │ Admin Notes: [_________________] │                        │
│  │ [Save Notes]                     │                        │
│  │                                  │                        │
│  │ [Back] [Edit] [Approve] [Reject] │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: All details visible                                 │
│ ✓ Test: Can add admin notes                                 │
│ ✓ Test: Map shows route                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 4: Approve Contribution                                 │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Approve Contribution             │                        │
│  │ ────────────────────────────────  │                        │
│  │                                  │                        │
│  │ Route 41A                        │                        │
│  │ Status: PENDING → APPROVED       │                        │
│  │                                  │                        │
│  │ Comments (optional):             │                        │
│  │ [Good quality data, thanks!]     │                        │
│  │                                  │                        │
│  │ Points to Award:                 │                        │
│  │ • Contribution: +50 points       │                        │
│  │ • (User will see this reward)    │                        │
│  │                                  │                        │
│  │ [Cancel] [Approve]               │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Click Approve button                                │
│ ✓ Test: Confirmation shown                                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 5: Approval Confirmation                                │
├─────────────────────────────────────────────────────────────┤
│ Expected:                                                    │
│  ┌──────────────────────────────────┐                        │
│  │ ✓ Contribution Approved!         │                        │
│  │                                  │                        │
│  │ Route 41A is now active.         │                        │
│  │ User will be notified via email. │                        │
│  │                                  │                        │
│  │ Route now searchable:            │                        │
│  │ • Appears in search results      │                        │
│  │ • Users can track bus            │                        │
│  │ • Users can review               │                        │
│  │                                  │                        │
│  │ User Reward: +50 points          │                        │
│  │                                  │                        │
│  │ [View in System] [Next Item]     │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Status changes to APPROVED                          │
│ ✓ Test: User receives email                                 │
│ ✓ Test: Route appears in search                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Step 6: Verify Route in System                               │
├─────────────────────────────────────────────────────────────┤
│ Expected:                                                    │
│ ✓ Search Chennai → Bangalore                                │
│ ✓ Route 41A appears in results                              │
│ ✓ All stops visible                                         │
│ ✓ Can track in real-time                                    │
│ ✓ Can leave reviews                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 SCENARIO 4: Testing Analytics (Admin)

```
┌─────────────────────────────────────────────────────────────┐
│ Admin Analytics Dashboard                                    │
├─────────────────────────────────────────────────────────────┤
│ Expected View:                                               │
│  ┌──────────────────────────────────┐                        │
│  │ Analytics Dashboard              │                        │
│  │ ────────────────────────────────  │                        │
│  │                                  │                        │
│  │ Date Range: [Jan 1] - [Jan 31]   │                        │
│  │                                  │                        │
│  │ ┌─ Contributions ──────────────┐ │                        │
│  │ │ Total: 125                    │ │                        │
│  │ │ Route: 95 (Pending: 12)      │ │                        │
│  │ │ Image: 30 (Pending: 8)       │ │                        │
│  │ │                               │ │                        │
│  │ │ Approval Rate: 85%            │ │                        │
│  │ │ [Chart: Bar graph showing     │ │                        │
│  │ │  trend over time]             │ │                        │
│  │ └─────────────────────────────┘ │                        │
│  │                                  │                        │
│  │ ┌─ Users ──────────────────────┐ │                        │
│  │ │ Active Users: 2,450           │ │                        │
│  │ │ New Users: 145                │ │                        │
│  │ │ Returning: 89%                │ │                        │
│  │ │                               │ │                        │
│  │ │ [Chart: Line graph showing    │ │                        │
│  │ │  growth trend]                │ │                        │
│  │ └─────────────────────────────┘ │                        │
│  │                                  │                        │
│  │ ┌─ Popular Routes ──────────────┐ │                        │
│  │ │ 1. Route 41A - 5,234 searches  │ │                        │
│  │ │ 2. Route 42  - 4,890 searches  │ │                        │
│  │ │ 3. Route 40  - 3,456 searches  │ │                        │
│  │ │ [Chart: Top routes by views]   │ │                        │
│  │ └─────────────────────────────┘ │                        │
│  │                                  │                        │
│  │ [Export as CSV] [Export as PDF]  │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Charts render correctly                             │
│ ✓ Test: Data accurate and current                           │
│ ✓ Test: Date range filter works                             │
│ ✓ Test: Export functionality                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚨 SCENARIO 5: Error Handling Tests

```
┌─────────────────────────────────────────────────────────────┐
│ Error: Login with wrong password                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐                        │
│  │ ❌ Invalid credentials           │                        │
│  │                                  │                        │
│  │ The email or password you        │                        │
│  │ entered is incorrect.            │                        │
│  │                                  │                        │
│  │ [Forgot Password?] [Try Again]   │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Clear error message                                 │
│ ✓ Test: Generic (no user enumeration)                       │
│ ✓ Test: Helpful links provided                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Error: Network failure during search                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐                        │
│  │ ⚠ Connection Error              │                        │
│  │                                  │                        │
│  │ Unable to fetch bus information. │                        │
│  │                                  │                        │
│  │ This might be due to:            │                        │
│  │ • No internet connection         │                        │
│  │ • Server temporarily unavailable │                        │
│  │                                  │                        │
│  │ [Retry] [Offline Mode] [Help]    │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: User can retry                                      │
│ ✓ Test: Helpful troubleshooting tips                        │
│ ✓ Test: No sensitive error details                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Error: Incomplete form submission                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────┐                        │
│  │ Please correct the errors:       │                        │
│  │                                  │                        │
│  │ 🔴 Bus Number: Required field    │                        │
│  │ 🔴 Route Name: Required field    │                        │
│  │ 🔴 Fare: Invalid number (< 0)   │                        │
│  │                                  │                        │
│  │ [Fix Fields] [Cancel]            │                        │
│  └──────────────────────────────────┘                        │
│ ✓ Test: Specific field errors shown                         │
│ ✓ Test: Fields highlighted in red                           │
│ ✓ Test: Error messages helpful                              │
└─────────────────────────────────────────────────────────────┘
```

---

**Use these visual scenarios as reference while manually testing!**

Each scenario covers the main happy path flow. Make sure to also test:
- Error conditions
- Edge cases
- Mobile responsiveness
- Browser compatibility
- Data persistence (refresh page)
- Concurrent operations (multiple tabs/users)
