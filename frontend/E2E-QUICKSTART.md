# 🎯 E2E QUICK START - NO MORE HEADACHES!

## The ONLY command you need:

```bash
./run-e2e.sh
```

That's it! The script handles everything.

## What it does:
1. ✅ Kills any existing dev servers
2. ✅ Starts fresh dev server
3. ✅ Waits for it to be ready
4. ✅ Runs all tests
5. ✅ Cleans up automatically

## Run specific tests:

```bash
# Just smoke tests
./run-e2e.sh smoke.spec.ts

# Only on desktop
./run-e2e.sh --project=chromium

# Specific test with UI
npx playwright test smoke.spec.ts --ui
```

## Common Issues:

**Script won't run?**
```bash
chmod +x run-e2e.sh
```

**Port still busy?**
```bash
pkill -f vite
```

**Want to see the browser?**
```bash
# Start dev server first
npm run dev

# Then in another terminal
npx playwright test --headed
```

## File Structure:

```
tests/e2e/
  ├── smoke.spec.ts          # 3 basic tests  
  ├── app-connectivity.spec.ts  # 2 connection tests
  └── simple.spec.ts         # 4 interaction tests
```

**Total: 20 tests (10 tests × 2 browsers)**

---

**🎉 That's it! No build needed, no preview server issues, just works!**
