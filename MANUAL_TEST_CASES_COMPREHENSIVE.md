# 🧪 Comprehensive Manual Test Cases - Perundhu Application

**Version:** 1.0  
**Date:** January 8, 2026  
**Scope:** User & Admin Perspectives Across All Modules

---

## 📑 Table of Contents

1. [User Perspective Tests](#user-perspective-tests)
2. [Admin Perspective Tests](#admin-perspective-tests)
3. [Cross-Module Integration Tests](#cross-module-integration-tests)
4. [Performance & Stress Tests](#performance--stress-tests)
5. [Security & Edge Case Tests](#security--edge-case-tests)

---

## 👥 USER PERSPECTIVE TESTS

### Module 1: Bus Search & Schedule Lookup

#### 1.1 Basic Bus Search
- **TC-U1.1.1:** Search for buses between two Tamil Nadu locations
  - Steps: Open app → Select "From" location → Select "To" location → Click Search
  - Expected: Display buses with schedule, stops, arrival times
  - Validate: Correct route numbers, stops in order, accurate timings

- **TC-U1.1.2:** Search with same source and destination
  - Steps: Select same location for from/to → Search
  - Expected: Display error or helpful message
  - Validate: No infinite loops, graceful error handling

- **TC-U1.1.3:** Search with invalid location
  - Steps: Type non-existent location → Search
  - Expected: "No results found" or autocomplete error message
  - Validate: Clean UI, no server errors (500)

- **TC-U1.1.4:** Clear search filters and start fresh
  - Steps: Perform search → Click clear/reset → Verify form is empty
  - Expected: Form resets, no stale data displayed
  - Validate: UI updates correctly

#### 1.2 Location Autocomplete
- **TC-U1.2.1:** Type location name and select from suggestions
  - Steps: Click "From" field → Type "Chennai" → Select from dropdown
  - Expected: Location appears, suggestions disappear
  - Validate: Correct location loaded, coordinates set

- **TC-U1.2.2:** Autocomplete with partial text
  - Steps: Type "ch" → Verify suggestions appear
  - Expected: Suggestions contain "Chennai", "Chengalpattu", etc.
  - Validate: Case-insensitive search works

- **TC-U1.2.3:** Autocomplete with special characters
  - Steps: Type Tamil characters → Verify suggestions
  - Expected: Suggestions match Tamil location names
  - Validate: Unicode/Tamil character handling works

- **TC-U1.2.4:** Clear location field
  - Steps: Select location → Click X button → Verify field clears
  - Expected: Location cleared, suggestions available again
  - Validate: UI responsive, form reset working

#### 1.3 Bus Schedule Display
- **TC-U1.3.1:** View bus card with all details
  - Steps: Search buses → Examine bus card
  - Expected: Route number, type, departure time, arrival time, fare, stops
  - Validate: All fields populated, formatting correct

- **TC-U1.3.2:** View stop-by-stop route details
  - Steps: Click on bus card → View detailed route
  - Expected: Ordered list of all stops with expected arrival times
  - Validate: Stops in correct sequence, no missing stops

- **TC-U1.3.3:** Multiple results sorting/filtering
  - Steps: Get multiple results → Verify sorting options (time, fare, duration)
  - Expected: Results sortable and filterable
  - Validate: Sorting works correctly, results update

### Module 2: Bus Tracking (Real-Time Location)

#### 2.1 Live Bus Location Tracking
- **TC-U2.1.1:** View live bus position on map
  - Steps: Search bus → Click "Track" button → View map
  - Expected: Red bus marker on map, showing current position
  - Validate: Marker updates every 5-10 seconds, correct location

- **TC-U2.1.2:** Bus not running (offline)
  - Steps: Search for night bus that's not running → Track it
  - Expected: Message "Bus not currently running" or no marker on map
  - Validate: No false data shown, graceful handling

- **TC-U2.1.3:** Map zoom and pan
  - Steps: View tracked bus → Zoom in/out → Pan around
  - Expected: Map responds smoothly to gestures
  - Validate: No lag, mobile-friendly pinch zoom works

- **TC-U2.1.4:** View next stops on tracking screen
  - Steps: Track bus → View upcoming stops
  - Expected: Display next 3-5 stops with ETAs
  - Validate: ETAs realistic based on bus speed

#### 2.2 Route Visualization
- **TC-U2.2.1:** View entire route on map
  - Steps: Track bus → View route polyline
  - Expected: Blue line showing complete route from start to end
  - Validate: Line matches actual bus path, continuous

- **TC-U2.2.2:** Stop markers on route
  - Steps: View route map → Look for stop markers
  - Expected: All stops marked on map, clickable
  - Validate: Clicking stop shows stop details

### Module 3: User Authentication & Profiles

#### 3.1 User Registration
- **TC-U3.1.1:** Register with valid email and password
  - Steps: Click Register → Enter email → Enter password → Confirm password → Register
  - Expected: Account created, confirmation email sent
  - Validate: User can login, email verified

- **TC-U3.1.2:** Register with invalid email format
  - Steps: Enter invalid email → Register
  - Expected: Error message "Invalid email format"
  - Validate: Form doesn't submit

- **TC-U3.1.3:** Register with weak password
  - Steps: Enter password < 8 characters → Register
  - Expected: Error "Password too weak"
  - Validate: Form doesn't submit, hint provided

- **TC-U3.1.4:** Register with existing email
  - Steps: Enter email of existing user → Register
  - Expected: Error "Email already registered"
  - Validate: No duplicate accounts created

#### 3.2 User Login
- **TC-U3.2.1:** Login with correct credentials
  - Steps: Enter email → Enter password → Click Login
  - Expected: Redirect to home, user menu shows email
  - Validate: Session created, token in localStorage

- **TC-U3.2.2:** Login with incorrect password
  - Steps: Enter correct email, wrong password → Login
  - Expected: Error "Invalid credentials"
  - Validate: No sensitive error message leakage

- **TC-U3.2.3:** Login with non-existent email
  - Steps: Enter non-existent email → Login
  - Expected: Error "Invalid credentials" (generic)
  - Validate: No user enumeration possible

- **TC-U3.2.4:** Remember me functionality
  - Steps: Login → Check "Remember me" → Logout → Revisit
  - Expected: Login details pre-filled (safe)
  - Validate: Only email pre-filled, not password

#### 3.3 User Profile
- **TC-U3.3.1:** View user profile details
  - Steps: Login → Click profile → View profile page
  - Expected: Email, join date, contribution count displayed
  - Validate: All data accurate and current

- **TC-U3.3.2:** Edit profile information
  - Steps: Click Edit → Change name → Save
  - Expected: Changes saved, profile updated immediately
  - Validate: Database updated, no 404 errors

- **TC-U3.3.3:** Change password
  - Steps: Click Change Password → Enter old password → New password → Confirm
  - Expected: Password changed, success message shown
  - Validate: Old password no longer works, new password works

- **TC-U3.3.4:** Logout functionality
  - Steps: Click Logout → Confirm
  - Expected: Redirect to home, user session cleared
  - Validate: Can't access protected pages, token deleted

### Module 4: User Contributions

#### 4.1 Route Contribution (Manual)
- **TC-U4.1.1:** Submit new bus route manually
  - Steps: Click Contribute → Select "Manual Route" → Fill form → Submit
  - Expected: Route saved as PENDING, user sees status
  - Validate: Route appears in "My Contributions", admin sees pending request

- **TC-U4.1.2:** Add bus stops to route
  - Steps: Create contribution → Click "Add Stop" → Select location → Add time
  - Expected: Stop added to list, ordered correctly
  - Validate: Can add multiple stops, remove stops

- **TC-U4.1.3:** Submit with incomplete information
  - Steps: Leave required fields empty → Submit
  - Expected: Validation error highlighting empty fields
  - Validate: Form prevents submission

- **TC-U4.1.4:** Cancel contribution
  - Steps: Start contribution → Click Cancel
  - Expected: Unsaved changes lost, redirect to home
  - Validate: No "Are you sure" dialogs missing

#### 4.2 Image Contribution
- **TC-U4.2.1:** Upload bus stop image
  - Steps: Click Contribute → Image → Select image → Add description → Submit
  - Expected: Image uploaded, appears in contributions
  - Validate: Image displayed correctly, file size reasonable

- **TC-U4.2.2:** Upload low-quality image
  - Steps: Upload blurry/dark image → Submit
  - Expected: Upload succeeds, admin reviews quality
  - Validate: No client-side size/quality restrictions (admin reviews)

- **TC-U4.2.3:** Image with duplicate detection
  - Steps: Upload same image twice → Check for duplicates
  - Expected: System may show warning or allow both
  - Validate: No data loss, admin can review

- **TC-U4.2.4:** Cancel image upload
  - Steps: Select image → Click Cancel before submit
  - Expected: Return to contribution list, image not saved
  - Validate: Proper cleanup, no orphaned files

#### 4.3 Voice/OCR Contribution (Advanced)
- **TC-U4.3.1:** Record voice contribution
  - Steps: Click Voice option → Grant microphone permission → Record → Submit
  - Expected: Audio captured, transcribed, saved
  - Validate: Transcription accuracy acceptable, audio stored

- **TC-U4.3.2:** Deny microphone permission
  - Steps: Start voice contribution → Deny permission
  - Expected: User-friendly error message
  - Validate: App doesn't crash, clear next steps shown

#### 4.4 Contribution Status Tracking
- **TC-U4.4.1:** View all user contributions
  - Steps: Login → Click "My Contributions" or Dashboard
  - Expected: List of all contributions with status (PENDING, APPROVED, REJECTED)
  - Validate: Count matches, status accurate

- **TC-U4.4.2:** View contribution details
  - Steps: Click on contribution → View details
  - Expected: Full information displayed, admin comments visible if rejected
  - Validate: All information readable, formatting correct

- **TC-U4.4.3:** Contribution approval notification
  - Steps: Admin approves contribution → Check user dashboard
  - Expected: Status changes to APPROVED, notification received
  - Validate: User sees update within 1 minute, no delay

- **TC-U4.4.4:** Contribution rejection with reason
  - Steps: Admin rejects contribution → Check details
  - Expected: Status REJECTED, reason visible to user
  - Validate: Reason clear and helpful

### Module 5: Reviews & Ratings

#### 5.1 Submit Bus Review
- **TC-U5.1.1:** Leave review with rating and comment
  - Steps: Click Review → Select bus → 5-star rating → Write comment → Submit
  - Expected: Review saved, appears in bus details
  - Validate: Review visible to other users within 1 minute

- **TC-U5.1.2:** Review with only rating (no comment)
  - Steps: Select bus → Give 5 stars → Don't write comment → Submit
  - Expected: Review accepted and saved
  - Validate: Rating updated in bus card

- **TC-U5.1.3:** Review with only comment (no rating)
  - Steps: Write comment → Leave rating blank → Submit
  - Expected: Error "Rating is required"
  - Validate: Validation works, user guided

- **TC-U5.1.4:** Submit profanity/spam review
  - Steps: Write inappropriate content → Submit
  - Expected: Review submitted (admin reviews), or blocked by filter
  - Validate: System handles appropriately, no crashes

#### 5.2 View Reviews
- **TC-U5.2.1:** View all reviews for a bus
  - Steps: Search bus → Click "See reviews"
  - Expected: All reviews displayed, sorted by newest first
  - Validate: Count accurate, timestamps correct

- **TC-U5.2.2:** Filter reviews by rating
  - Steps: Click reviews → Filter by 5 stars only
  - Expected: Show only 5-star reviews
  - Validate: Other ratings hidden, count updated

- **TC-U5.2.3:** View review helpfulness
  - Steps: View review → Click "Helpful" or "Not helpful"
  - Expected: Vote recorded, count updated
  - Validate: Can only vote once per review

#### 5.3 Edit/Delete Own Review
- **TC-U5.3.1:** Edit own review
  - Steps: View own review → Click Edit → Change rating/comment → Save
  - Expected: Review updated, timestamp changed
  - Validate: Other users see updated review within 1 minute

- **TC-U5.3.2:** Delete own review
  - Steps: View own review → Click Delete → Confirm
  - Expected: Review removed, bus rating recalculated
  - Validate: Can't see review anymore, bus stats updated

### Module 6: Announcements & News

#### 6.1 View Announcements
- **TC-U6.1.1:** View app-wide announcements
  - Steps: Open app → Check announcements banner
  - Expected: Important news displayed (if any)
  - Validate: Dismissible, can close banner

- **TC-U6.1.2:** View route-specific announcements
  - Steps: Search route → View details → Check announcements
  - Expected: Relevant announcements shown (delays, schedule changes)
  - Validate: Accurate and timely information

### Module 7: Analytics & History

#### 7.1 User Analytics Dashboard
- **TC-U7.1.1:** View personal statistics
  - Steps: Login → Click Dashboard/Analytics
  - Expected: Show buses tracked, contributions, rewards
  - Validate: Numbers accurate, charts display correctly

- **TC-U7.1.2:** View tracking history
  - Steps: Dashboard → View history → Check past searches
  - Expected: List of recent bus searches with timestamps
  - Validate: Data accurate, can filter by date

### Module 8: Rewards & Gamification (if enabled)

#### 8.1 Rewards Points
- **TC-U8.1.1:** Earn rewards for contribution
  - Steps: Submit approved contribution → Check rewards
  - Expected: Points added to account balance
  - Validate: Points calculation correct

- **TC-U8.1.2:** View reward history
  - Steps: Click Rewards → View transaction history
  - Expected: All earning/spending transactions listed
  - Validate: Ledger accurate, balances match

#### 8.2 Badges & Achievements
- **TC-U8.2.1:** Earn badge for contribution milestone
  - Steps: Submit N approved contributions → Check badges
  - Expected: Badge awarded and displayed
  - Validate: Badge icon visible, description shown

### Module 9: Settings & Preferences

#### 9.1 Language Selection
- **TC-U9.1.1:** Switch language from English to Tamil
  - Steps: Click Settings → Select Language → Tamil
  - Expected: Entire UI translates to Tamil immediately
  - Validate: All text translated, no untranslated strings

- **TC-U9.1.2:** Tamil keyboard input
  - Steps: Switch to Tamil → Type in location field
  - Expected: Tamil characters recognized by autocomplete
  - Validate: Tamil location suggestions appear

#### 9.2 Theme Selection
- **TC-U9.2.1:** Switch to dark mode
  - Steps: Settings → Theme → Dark Mode
  - Expected: UI changes to dark colors immediately
  - Validate: All components styled correctly, no contrast issues

- **TC-U9.2.2:** Theme persistence
  - Steps: Set dark mode → Logout → Login again
  - Expected: Dark mode still selected
  - Validate: Preference saved in localStorage

#### 9.3 Notification Settings
- **TC-U9.3.1:** Enable/disable notifications
  - Steps: Settings → Notifications → Toggle on/off
  - Expected: Setting saved, notifications behavior changes
  - Validate: Browser permission prompt shown if enabling

### Module 10: Search Enhancements

#### 10.1 Connecting Routes
- **TC-U10.1.1:** Find connecting bus routes
  - Steps: Search route → Click "Connecting Routes" if available
  - Expected: Show alternative routes with connections
  - Validate: Valid combinations, reasonable travel times

#### 10.2 Nearby Stops
- **TC-U10.2.1:** Find nearby bus stops
  - Steps: Use location → Show nearby stops
  - Expected: List of stops within radius, sorted by distance
  - Validate: Locations accurate, distances reasonable

### Module 11: Share & Social Features

#### 11.1 Share Route
- **TC-U11.1.1:** Share bus route via URL
  - Steps: View bus route → Click Share → Copy link
  - Expected: Shareable URL generated, works when shared
  - Validate: Recipient sees same route when opening link

- **TC-U11.1.2:** Share via social media (if enabled)
  - Steps: Click Share → Select Facebook/Twitter
  - Expected: Social share dialog opens
  - Validate: Share completes successfully

#### 11.2 Report Bus/Issue
- **TC-U11.2.1:** Report bus issue
  - Steps: View bus → Click Report → Select issue type → Submit
  - Expected: Issue recorded, confirmation shown
  - Validate: Admin receives report, buses status updates

---

## 🛡️ ADMIN PERSPECTIVE TESTS

### Module 1: Admin Authentication

#### 1.1 Admin Login
- **TC-A1.1.1:** Login with admin credentials
  - Steps: Go to /admin → Enter admin email/password → Login
  - Expected: Redirect to Admin Dashboard
  - Validate: Admin-only menu visible, user role verified

- **TC-A1.1.2:** Non-admin user accessing admin panel
  - Steps: Try to access /admin as regular user
  - Expected: Redirect to home or 403 Forbidden
  - Validate: No admin access for non-admins

- **TC-A1.1.3:** Logout from admin panel
  - Steps: Click Logout in admin panel
  - Expected: Redirect to home, admin session cleared
  - Validate: Can't access protected admin routes

### Module 2: Route Management (Admin)

#### 2.1 View Contributions Dashboard
- **TC-A2.1.1:** View all route contributions
  - Steps: Admin Dashboard → Routes → View All
  - Expected: List of all contributions with status
  - Validate: Pagination works, count accurate

- **TC-A2.1.2:** Filter pending contributions
  - Steps: Routes → Filter by "Pending"
  - Expected: Show only PENDING status contributions
  - Validate: Other statuses hidden, count correct

- **TC-A2.1.3:** Search contribution by route number
  - Steps: Routes → Search "41A"
  - Expected: Show contributions for route 41A
  - Validate: Search case-insensitive, partial match works

#### 2.2 Approve Contributions
- **TC-A2.2.1:** Approve route contribution
  - Steps: View pending contribution → Click Approve
  - Expected: Status changes to APPROVED, user notified
  - Validate: Route integrated into system, appears in searches

- **TC-A2.2.2:** Approve with comments
  - Steps: Approve contribution → Add admin comments
  - Expected: Comments saved, visible to user
  - Validate: User sees approval reason in history

#### 2.3 Reject Contributions
- **TC-A2.3.1:** Reject contribution with reason
  - Steps: View contribution → Click Reject → Select reason → Submit
  - Expected: Status changes to REJECTED, user sees reason
  - Validate: Reason helpful, user can resubmit

- **TC-A2.3.2:** Provide feedback on rejection
  - Steps: Reject → Add custom feedback
  - Expected: Feedback sent to user
  - Validate: User receives constructive feedback

#### 2.4 Edit/Delete Contributions
- **TC-A2.4.1:** Edit approved contribution
  - Steps: View approved contribution → Edit details → Save
  - Expected: Changes saved, system updated
  - Validate: Search results reflect changes

- **TC-A2.4.2:** Delete contribution
  - Steps: View contribution → Click Delete → Confirm
  - Expected: Contribution removed from system
  - Validate: No longer searchable, audit log updated

### Module 3: Image Management (Admin)

#### 3.1 Image Review
- **TC-A3.1.1:** View pending images
  - Steps: Admin Dashboard → Images → Pending
  - Expected: Thumbnails of pending images with descriptions
  - Validate: Image previews load, metadata shown

- **TC-A3.1.2:** Preview image details
  - Steps: Click image → View full size
  - Expected: High-resolution image shown with stop location
  - Validate: Image quality acceptable, metadata visible

#### 3.2 Approve/Reject Images
- **TC-A3.2.1:** Approve image contribution
  - Steps: View image → Click Approve
  - Expected: Status APPROVED, image added to stop details
  - Validate: Appears in user searches, audit logged

- **TC-A3.2.2:** Reject with quality feedback
  - Steps: View image → Click Reject → Select quality issue
  - Expected: User notified with specific feedback
  - Validate: User understands why rejected

- **TC-A3.2.3:** Flag image for moderation
  - Steps: View image → Click Flag → Select reason
  - Expected: Image flagged, moved to moderation queue
  - Validate: Can be reviewed separately

### Module 4: Route Issues/Bug Reports (Admin)

#### 4.1 Issue Management
- **TC-A4.1.1:** View all reported issues
  - Steps: Admin Dashboard → Issues → View All
  - Expected: List of all reported issues with status
  - Validate: Priority, date, reporter shown

- **TC-A4.1.2:** Investigate issue details
  - Steps: Click issue → View full report
  - Expected: Issue description, affected route, user notes
  - Validate: All information for troubleshooting present

#### 4.2 Resolve Issues
- **TC-A4.2.1:** Mark issue as resolved
  - Steps: View issue → Click Resolve → Add solution
  - Expected: Status changes to RESOLVED, user notified
  - Validate: User sees resolution explanation

- **TC-A4.2.2:** Reopen resolved issue
  - Steps: View resolved issue → Click Reopen
  - Expected: Status back to OPEN, reason recorded
  - Validate: Audit trail maintained

### Module 5: User Management (Admin)

#### 5.1 User Administration
- **TC-A5.1.1:** View all users
  - Steps: Admin Dashboard → Users
  - Expected: Table of all users with role, status, join date
  - Validate: Search, sort, filter working

- **TC-A5.1.2:** Search user by email
  - Steps: Users → Search "user@example.com"
  - Expected: User profile displayed
  - Validate: Exact match and partial matches shown

#### 5.2 User Role Management
- **TC-A5.2.1:** Promote user to moderator
  - Steps: View user → Click "Change Role" → Select Moderator → Save
  - Expected: User role updated, permissions changed
  - Validate: User can now access moderator features

- **TC-A5.2.2:** Demote user role
  - Steps: View moderator → Demote to User → Save
  - Expected: Role downgraded, permissions restricted
  - Validate: Lost moderator abilities immediately

#### 5.3 User Moderation
- **TC-A5.3.1:** Ban user for violations
  - Steps: View user → Click Ban → Select reason → Save
  - Expected: User status = BANNED, can't login
  - Validate: Ban effective immediately, user notified

- **TC-A5.3.2:** Unban user
  - Steps: View banned user → Click Unban
  - Expected: User status = ACTIVE, can login again
  - Validate: User regains all access

- **TC-A5.3.3:** Warn user
  - Steps: View user → Click Warn → Message
  - Expected: Warning sent, logged in history
  - Validate: User sees warning on next login

### Module 6: Analytics (Admin)

#### 6.1 System Analytics
- **TC-A6.1.1:** View contribution statistics
  - Steps: Dashboard → Analytics → Contributions
  - Expected: Charts showing contribution trends, approval rates
  - Validate: Data accurate, updated regularly

- **TC-A6.1.2:** View user analytics
  - Steps: Analytics → Users
  - Expected: Active users, new registrations, retention metrics
  - Validate: Metrics calculated correctly

- **TC-A6.1.3:** View bus tracking analytics
  - Steps: Analytics → Bus Tracking
  - Expected: Popular routes, peak hours, tracking usage
  - Validate: Real-time data aggregation working

#### 6.2 Reports & Export
- **TC-A6.2.1:** Generate contribution report
  - Steps: Analytics → Contributions → Export as CSV
  - Expected: CSV file downloads with all data
  - Validate: File format correct, data complete

- **TC-A6.2.2:** Generate user analytics report
  - Steps: Analytics → Users → Export as PDF
  - Expected: PDF report generated and downloaded
  - Validate: Formatting readable, data accurate

### Module 7: Settings & Configuration (Admin)

#### 7.1 Feature Flags
- **TC-A7.1.1:** Enable feature flag
  - Steps: Settings → Feature Flags → Enable "Voice Contribution"
  - Expected: Feature becomes available to users immediately
  - Validate: Users see new feature, no restart needed

- **TC-A7.1.2:** Disable feature flag
  - Steps: Settings → Feature Flags → Disable "Voice Contribution"
  - Expected: Feature hidden from users, no impact on existing data
  - Validate: Feature disappears from UI, existing data preserved

- **TC-A7.1.3:** Rate limiting configuration
  - Steps: Settings → Rate Limiting → Set max requests/minute
  - Expected: Setting saved, applied to API
  - Validate: API enforces limit, users get 429 when exceeded

#### 7.2 Email Configuration
- **TC-A7.2.1:** Configure email settings
  - Steps: Settings → Email → Configure SMTP
  - Expected: Settings saved, test email sent
  - Validate: Emails deliver successfully

#### 7.3 Database Maintenance
- **TC-A7.3.1:** View database statistics
  - Steps: Settings → Database → Statistics
  - Expected: Database size, table counts, backup status
  - Validate: Real-time stats accurate

- **TC-A7.3.2:** Trigger database backup
  - Steps: Settings → Database → Backup Now
  - Expected: Backup initiated, status shown
  - Validate: Backup completes, file created

### Module 8: Announcements (Admin)

#### 8.1 Create Announcements
- **TC-A8.1.1:** Create app-wide announcement
  - Steps: Announcements → Create New → Type message → Publish
  - Expected: Announcement visible to all users
  - Validate: Appears in UI within 1 minute, all users see it

- **TC-A8.1.2:** Create route-specific announcement
  - Steps: Announcements → Create → Select route → Message → Publish
  - Expected: Announcement visible only for that route
  - Validate: Shows only for route, not global

#### 8.2 Edit/Delete Announcements
- **TC-A8.2.1:** Edit announcement
  - Steps: View announcement → Click Edit → Change text → Save
  - Expected: Announcement updated for all users
  - Validate: Changes immediate, no caching issues

- **TC-A8.2.2:** Delete announcement
  - Steps: View announcement → Click Delete → Confirm
  - Expected: Announcement removed from system
  - Validate: No longer visible to users

### Module 9: Security & IP Blocking

#### 9.1 IP Blocking
- **TC-A9.1.1:** Block IP address
  - Steps: Security → IP Management → Add IP → Save
  - Expected: IP blocked from accessing API
  - Validate: Requests from IP rejected with 403

- **TC-A9.1.2:** Unblock IP address
  - Steps: Security → IP Management → Remove IP
  - Expected: IP can access API again
  - Validate: Requests accepted, no 403 errors

#### 9.2 Rate Limiting
- **TC-A9.2.1:** Monitor rate limit violations
  - Steps: Security → Rate Limiting → View violations
  - Expected: Show IPs exceeding limits
  - Validate: Data accurate, auto-block working

#### 9.3 Audit Logging
- **TC-A9.3.1:** View admin action logs
  - Steps: Security → Audit Log
  - Expected: All admin actions logged with timestamp and user
  - Validate: Complete audit trail, tamper-proof

---

## 🔗 CROSS-MODULE INTEGRATION TESTS

### Integration Test 1: End-to-End Contribution Flow
**Scenario:** User submits route, admin approves, users search for it
- User creates contribution → Admin sees pending → Admin approves → Route appears in search
- **Expected:** Seamless workflow, no data loss, proper notifications
- **Validate:** Each step completes, user receives confirmation emails

### Integration Test 2: Review Visibility Across Modules
**Scenario:** User leaves review, appears in multiple places
- User writes review → Check bus details → Check user profile → Check analytics
- **Expected:** Review consistent everywhere, count updated
- **Validate:** No data synchronization issues, real-time updates

### Integration Test 3: User Ban Propagation
**Scenario:** Admin bans user, effects cascade
- Admin bans user → User tries to login → User can't access dashboard → Contributions unpublished
- **Expected:** Complete cascade, immediate effect
- **Validate:** No edge cases where banned user has access

### Integration Test 4: Feature Flag Dependency
**Scenario:** Multiple features depend on same flag
- Disable "enableImageContribution" → Check all related UI removed
- **Expected:** Consistent across all modules using flag
- **Validate:** No orphaned UI elements, clean removal

### Integration Test 5: Notification System
**Scenario:** Multiple events trigger notifications
- Contribution approved → Review submitted → Bus delayed → User receives all notifications
- **Expected:** Real-time delivery, no duplicates
- **Validate:** Notification timestamps accurate, delivery logged

---

## ⚡ PERFORMANCE & STRESS TESTS

### Performance Test 1: Search Performance
- **Test:** Search with 1000 results
  - **Expected:** Results load within 2 seconds
  - **Validate:** No timeout, pagination works

### Performance Test 2: Concurrent Users
- **Test:** 100 users searching simultaneously
  - **Expected:** All searches respond within 3 seconds
  - **Validate:** No 503 errors, database connections stable

### Performance Test 3: Large File Upload (Images)
- **Test:** Upload 10MB image
  - **Expected:** Progress bar shows, upload completes in < 30s
  - **Validate:** File stored correctly, thumbnail generated

### Performance Test 4: Analytics Dashboard Load
- **Test:** Load dashboard with 12 months of data
  - **Expected:** Dashboard renders within 3 seconds
  - **Validate:** Charts responsive, no browser lag

### Performance Test 5: Database Query Performance
- **Test:** Admin exports 50,000 records
  - **Expected:** Export completes in < 10 seconds
  - **Validate:** File size reasonable, data complete

---

## 🔐 SECURITY & EDGE CASE TESTS

### Security Test 1: SQL Injection
- **Test:** Try SQL injection in search: `'; DROP TABLE buses; --`
- **Expected:** Treated as literal text, no error
- **Validate:** Database intact, sanitization working

### Security Test 2: XSS Attack
- **Test:** Submit contribution with HTML: `<script>alert('xss')</script>`
- **Expected:** Script doesn't execute, displayed as text
- **Validate:** HTML properly escaped, no malicious execution

### Security Test 3: CSRF Protection
- **Test:** Submit form from different domain
- **Expected:** CSRF token validation fails, request rejected
- **Validate:** 403 Forbidden response

### Security Test 4: Unauthorized Data Access
- **Test:** Try accessing another user's data via URL: `/users/userid123/profile`
- **Expected:** 403 Forbidden or redirect to own profile
- **Validate:** No data leakage, proper authorization

### Security Test 5: Session Hijacking
- **Test:** Use session token on different IP
- **Expected:** Session re-validation triggered, potential security warning
- **Validate:** Session scope limited, IP validation if configured

### Edge Case Test 1: Empty Data
- **Test:** Search with empty location field
- **Expected:** Error message or default behavior
- **Validate:** Graceful handling, no crashes

### Edge Case Test 2: Network Failure
- **Test:** Disconnect network during upload
- **Expected:** Error message, ability to retry
- **Validate:** No orphaned uploads, cleanup proper

### Edge Case Test 3: Timezone Handling
- **Test:** User in different timezone submitting time-based data
- **Expected:** Times stored and displayed correctly in all zones
- **Validate:** No timezone confusion, UTC handling correct

### Edge Case Test 4: Concurrent Edits
- **Test:** Two admins editing same contribution simultaneously
- **Expected:** Last-write-wins or merge conflict notification
- **Validate:** No data corruption, audit log shows conflict

### Edge Case Test 5: Missing Images/Resources
- **Test:** Image URL broken or file deleted
- **Expected:** Placeholder shown, no UI breakage
- **Validate:** Graceful degradation, error logged

---

## 📱 Mobile-Specific Tests

### Mobile Test 1: Responsive Design
- **Test:** Use app on iPhone, iPad, Android phone, Android tablet
- **Expected:** Layout adapts, touch targets appropriately sized
- **Validate:** No horizontal scroll, readable text

### Mobile Test 2: Keyboard Management
- **Test:** Type in search field on mobile
- **Expected:** Keyboard appears/disappears appropriately
- **Validate:** Form visible when keyboard open, no input hidden

### Mobile Test 3: Geolocation
- **Test:** Use "Use Current Location" feature
- **Expected:** Permission prompt, location captured, distance calculated
- **Validate:** Location accuracy within 100m

### Mobile Test 4: Offline Capability (PWA)
- **Test:** Load app, go offline, try to use
- **Expected:** Cached content loads, error for real-time features
- **Validate:** Offline notification shown, graceful degradation

---

## 🌍 Language & Localization Tests

### Localization Test 1: Tamil Language
- **Test:** Switch to Tamil, perform all major flows
- **Expected:** 100% Tamil UI, no English fallback
- **Validate:** Tamil fonts render correctly, RTL text if applicable

### Localization Test 2: Tamil Input
- **Test:** Type Tamil in location field
- **Expected:** Tamil autocomplete suggestions work
- **Validate:** Can type with Tamil keyboard, suggestions accurate

### Localization Test 3: Date/Time Formatting
- **Test:** Check date/time display in Tamil
- **Expected:** Proper localized format (if applicable)
- **Validate:** Readable to Tamil users, culturally appropriate

---

## 📊 Data Validation Tests

### Data Validation 1: Bus Schedule Times
- **Test:** Verify arrival times < departure times
- **Expected:** Invalid data rejected or flagged
- **Validate:** Data integrity maintained

### Data Validation 2: Stop Sequence
- **Test:** Verify stops in geographic order
- **Expected:** Invalid order flagged for admin review
- **Validate:** Route logic preserved

### Data Validation 3: Location Coordinates
- **Test:** Verify coordinates within Tamil Nadu bounds
- **Expected:** Out-of-bounds rejected
- **Validate:** Map display correct

---

## ✅ COMPLETION CHECKLIST

### Before Release:
- [ ] All User Perspective tests passed (Module 1-11)
- [ ] All Admin Perspective tests passed (Module 1-9)
- [ ] All Integration tests passed
- [ ] All Performance tests passed (< thresholds)
- [ ] All Security tests passed (no vulnerabilities)
- [ ] All Mobile tests passed (iOS and Android)
- [ ] All Localization tests passed (Tamil & English)
- [ ] All Data validation tests passed
- [ ] Edge cases handled gracefully
- [ ] No critical bugs (P0/P1)
- [ ] No blocking issues (P2)
- [ ] Performance optimized
- [ ] Security hardened
- [ ] Database backups verified
- [ ] Rollback plan documented

---

## 🎯 Test Execution Strategy

### Phase 1: Unit Testing (Dev)
- Developers test basic functionality before commit
- Estimated: 2-3 days

### Phase 2: Integration Testing (QA)
- QA team tests cross-module flows
- Estimated: 3-5 days

### Phase 3: System Testing (QA)
- Full system functionality testing
- Estimated: 5-7 days

### Phase 4: UAT (Stakeholders)
- Real users test, provide feedback
- Estimated: 3-5 days

### Phase 5: Performance Testing (DevOps)
- Load testing, stress testing, optimization
- Estimated: 2-3 days

### Total Estimated Testing Time: 15-23 days

---

## 📝 Test Execution Template

For each test case, document:
```
Test Case ID: TC-U1.1.1
Test Name: Search for buses between two locations
Status: [ ] PASS [ ] FAIL [ ] BLOCKED
Executed By: ___________
Executed On: ___________
Notes/Issues: _________________________________
```

---

## 🔧 Bug Severity Levels

| Severity | Definition | Example |
|----------|-----------|---------|
| **P0 (Critical)** | App crash, data loss, security breach | "Cannot login at all" |
| **P1 (High)** | Feature completely broken | "Search returns no results" |
| **P2 (Medium)** | Feature partially broken | "Sometimes search slow" |
| **P3 (Low)** | Minor cosmetic issue | "Button text misaligned" |

---

**Document Version:** 1.0  
**Last Updated:** January 8, 2026  
**Next Review:** Before production deployment  
**Owner:** QA Team / Product Management
