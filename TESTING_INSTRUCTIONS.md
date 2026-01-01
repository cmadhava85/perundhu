# Testing Instructions - Form Input Fix

## Quick Test Checklist

### Environment Setup
```bash
# Terminal 1 - Backend
cd backend
./gradlew bootrun

# Terminal 2 - Frontend (dev server)
cd frontend
npm run dev

# Open browser to http://localhost:5173
```

---

## Test 1: Announcement Panel - Character Input ✓

### Steps:
1. Click the **Announcement** button in header (if visible) or navigate to admin panel
2. Click "New Announcement" or similar
3. Click the **Title** field
4. Type the following characters (each should appear):
   - Type 's' → should appear
   - Type 'f' → should appear
   - Type 'k' → should appear
   - Type "test string with s, f, k" → all should appear

### Expected Result:
✅ All characters appear in the title field without blocking

### What to look for:
- No characters missing
- Typing is smooth
- No console errors
- Field updates in real-time

---

## Test 2: Announcement Panel - Description ✓

### Steps:
1. In the same announcement form, click the **Description/Message** field
2. Type: "This form field should accept all characters like s, f, and k"

### Expected Result:
✅ Full text appears in description field

---

## Test 3: Contribute Page - Route Input ✓

### Steps:
1. Navigate to **Contribute** tab/page
2. Scroll to "From Location" field
3. Type a location starting with 's', 'f', or 'k':
   - Try typing "Sri Ranganathaswamy Temple"
   - Or "Flower Market"
   - Or "Kilpauk Garden"

### Expected Result:
✅ All characters appear, autocomplete works

### What to look for:
- Characters appear while typing
- Dropdown suggestions load
- Selection works

---

## Test 4: Contribute Page - Destination ✓

### Steps:
1. Click "To Location" field
2. Type a destination name with 's', 'f', or 'k'
   - Try "Saidapet Station"
   - Or "Fastrans Junction"
   - Or "Kodambakkam Junction"

### Expected Result:
✅ All characters appear

---

## Test 5: Keyboard Shortcuts (Outside Forms) ✓

### These should STILL WORK (don't type in form fields):

1. **Press F key** (outside any form):
   - Look for filters panel to open or focus on search

2. **Press S key** (outside any form):
   - Search field should focus or similar action

3. **Press K key** (outside any form):
   - Quick search or command palette might open

### Expected Result:
✅ Shortcuts work outside forms
✅ Shortcuts don't trigger inside forms

---

## Test 6: Security Features (Production Mode) ✓

### In production (or simulated):

1. **Press F12**:
   - DevTools should NOT open (security feature)
   
2. **Press Ctrl+Shift+I** (Windows/Linux) or Cmd+Option+I (Mac):
   - DevTools should NOT open (security feature)

3. **But in form fields, typing works**:
   - Type "f", "s", "k" in announcement form
   - They should appear (form input not blocked)

### Expected Result:
✅ Security preserved AND form input works

---

## Test 7: Custom Dropdowns (ARIA roles) ✓

### Steps:
1. Find any custom dropdown (not HTML select)
2. Click to open dropdown
3. Try typing to search/filter:
   - Type 's', 'f', 'k'
   - Should filter or navigate options

### Expected Result:
✅ Typing works in custom dropdowns

---

## Test 8: Rich Text Editors (contentEditable) ✓

### Steps:
1. Find any rich text editor (if exists)
2. Click in the editor
3. Type: "Testing contenteditable divs with s, f, k"

### Expected Result:
✅ All text appears in editor

---

## Verification: Check Browser Console

After each test, check the **browser console** (F12 in dev mode or DevTools):

```javascript
// Should see NO errors related to:
// - KeyboardEvent
// - preventDefault
// - Form blocking
// - Input restrictions
```

### Healthy Console Output:
- ✅ No red error messages about keyboard
- ✅ No warnings about form input
- ✅ No security errors

### Unhealthy Console Output:
- ❌ "Cannot type character: s"
- ❌ "preventDefault blocked"
- ❌ "Form input restricted"

---

## Verification: Check Network Requests

When creating/saving announcements:

1. Open **DevTools → Network tab**
2. Submit announcement form
3. Look for API request (POST to `/api/v1/announcements`)
4. Check response:
   - ✅ Status 201 (Created) or 200 (OK)
   - ❌ Status 401 (Unauthorized) = Auth issue
   - ❌ Status 500 (Server Error) = Backend error

### Expected Headers:
```
Authorization: Basic [base64 encoded credentials]
Content-Type: application/json
```

---

## Quick Regression Test

Make sure existing functionality still works:

- [ ] Search/filtering with keyboard shortcuts work outside forms
- [ ] Page navigation works
- [ ] Dropdown selections work
- [ ] Form submissions work
- [ ] No console errors
- [ ] No infinite loops or crashes
- [ ] Page loading speed normal

---

## Problem: Characters Still Blocked?

If you still can't type 's', 'f', or 'k':

### Debug Steps:
1. **Clear cache first**:
   - Browser: Cmd+Shift+Delete (all files)
   - Then refresh page

2. **Check if frontend was rebuilt**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Verify you're using new build**:
   - Open DevTools → Network
   - Disable cache
   - Reload page
   - Look for updated js file timestamps

4. **Check if correct files were modified**:
   ```bash
   # Verify fixes are in source
   grep -n "const isFormControl" frontend/src/components/KeyboardShortcuts.tsx
   grep -n "const isFormField" frontend/src/utils/reactSecurity.ts
   grep -n "sessionStorage.getItem" frontend/src/services/announcementService.ts
   ```

5. **Check browser console**:
   - Any errors during form input?
   - Any preventDefault() messages?

6. **Try different browser**:
   - Chrome, Firefox, Safari
   - Rules out browser-specific cache issues

---

## Problem: API Requests Failing (401)?

If announcement API returns 401 Unauthorized:

### Debug Steps:
1. **Check if logged in**:
   - Can you see user info in header?
   - Check sessionStorage (DevTools → Application → sessionStorage)
   - Look for `admin_auth_credentials` key

2. **Verify auth header is set**:
   - Open DevTools → Network
   - Make API call
   - Click on request
   - Check "Authorization" header in Request Headers
   - Should show `Basic [encoded]`

3. **Check backend is running**:
   ```bash
   curl http://localhost:8080/api/v1/announcements
   ```
   - If connection refused, backend is down

4. **Check CORS**:
   - If "CORS error" in console, backend CORS settings issue
   - Check backend application.properties CORS config

---

## Success Indicators ✅

When fixes are working correctly, you should see:

1. ✅ All characters ('s', 'f', 'k') appear in forms
2. ✅ No errors in console
3. ✅ API requests succeed (200/201 status)
4. ✅ Keyboard shortcuts work outside forms
5. ✅ Security features still protect the app
6. ✅ Page performance is normal
7. ✅ All form submissions work
8. ✅ Dropdowns and menus function correctly

---

## Reporting Issues

If you find any problems:

1. **Note the specific issue**:
   - Which form field?
   - Which character(s) blocked?
   - What browser/OS?

2. **Check console error**:
   - Copy exact error message
   - Include stack trace

3. **Provide reproduction steps**:
   - Exact steps to reproduce
   - Screenshots if helpful

4. **Check files are updated**:
   - Verify source files contain fixes
   - Verify build was run
   - Verify new assets loaded in browser

---

## Test Completion

When all tests pass, the fix is complete! ✅

Mark this checklist when you're done:
- [ ] Test 1: Announcement title accepts 's', 'f', 'k'
- [ ] Test 2: Announcement description accepts all characters
- [ ] Test 3: Contribute page "from" field works
- [ ] Test 4: Contribute page "to" field works
- [ ] Test 5: Keyboard shortcuts work outside forms
- [ ] Test 6: Security features still work (F12 blocked in prod)
- [ ] Test 7: Custom dropdowns work
- [ ] Test 8: Rich text editors work
- [ ] Console: No form-related errors
- [ ] Network: API requests succeed
- [ ] Regression: Existing features still work

**All tests passing = Issue Resolved ✅**
