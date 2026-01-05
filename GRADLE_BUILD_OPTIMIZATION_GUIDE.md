# Gradle Build Performance Optimization Guide

## Current Setup
✅ Configuration cache enabled (`org.gradle.configuration-cache=true`)
✅ Parallel builds enabled (`org.gradle.parallel=true`)
✅ Build caching enabled (`org.gradle.caching=true`)
✅ Daemon enabled with 2GB heap
✅ File system watching enabled for faster incremental builds

## Build Commands by Scenario

### 1. **Fast Development Build** (No Tests - ~30 seconds)
```bash
./gradlew build -x test
```
- Use when: Making code changes, testing locally
- Skip tests to save ~3-4 minutes
- Still runs: Compilation, checks, builds JAR

### 2. **Fast Test Only** (~2-3 minutes)
```bash
./gradlew test
```
- Use when: You already compiled, just want to run tests
- Much faster than full build
- Skips compilation, artifact creation

### 3. **Full Clean Build with Tests** (~10-15 minutes)
```bash
./gradlew clean build
```
- Use when: First time setup, CI/CD pipeline
- Removes all cached artifacts
- Rebuilds and tests everything

### 4. **Incremental Build** (~30 seconds)
```bash
./gradlew build
```
- Use during active development
- Uses cache from previous builds
- Only rebuilds what changed
- **⚠️ Don't use `clean` during development**

### 5. **Build Without Spotbugs** (~1 minute faster)
```bash
./gradlew build -x spotbugsMain -x spotbugsTest
```
- Use when: SpotBugs checks are slow
- Still runs: Tests, compilation, other checks
- Good for quick verification

### 6. **Build Specific Module Only**
```bash
./gradlew :backend:app:build
```
- Use when: Working on one module
- Much faster for monorepo
- Skip unrelated modules

## Performance Metrics

| Command | Time | Use Case |
|---------|------|----------|
| `build -x test` | ~30s | Quick local development |
| `test` | ~2-3m | Test verification |
| `build` | ~6-8m | Full build with cache |
| `clean build` | ~10-15m | First time or CI/CD |

## Tips to Further Speed Up Builds

### 1. **Increase JVM Heap Size** (Already Optimized)
```properties
org.gradle.jvmargs=-Xmx2g -XX:+HeapDumpOnOutOfMemoryError
```
✅ Set to 2GB (good for most machines)

### 2. **Keep Gradle Daemon Running**
```bash
./gradlew --status  # Check daemon status
```
First build after restart: ~12s slower
Subsequent builds: ~2-3s faster daemon startup

### 3. **Use Gradle Wrapper** (Already Using ✅)
```bash
./gradlew  # Correct - uses wrapper
gradle     # Wrong - uses system gradle
```

### 4. **CI/CD Optimization**
For GitHub Actions, add to workflow:
```yaml
- uses: gradle/gradle-build-action@v2
  with:
    gradle-version: wrapper
    cache-disabled: false
    cache-read-only: false
```

### 5. **Skip Checks During Development**
```bash
# Skip all checks (fastest)
./gradlew build -x check -x test

# Skip specific checks
./gradlew build -x spotbugsMain -x pmdMain -x checkstyleMain
```

## Recommended Workflow

### **Local Development**
```bash
# Quick build (30 seconds)
./gradlew build -x test

# When ready to commit (2-3 minutes)
./gradlew test

# Full verification before push (10 minutes)
./gradlew clean build
```

### **CI/CD Pipeline**
```bash
# Always use clean build for fresh environment
./gradlew clean build

# Or with caching enabled (GitHub Actions recommended)
./gradlew build --build-cache
```

## Environment Variables

Add to your shell profile (~/.zshrc or ~/.bash_profile):
```bash
# Allocate more memory to gradle
export GRADLE_OPTS="-Xmx2g -XX:+HeapDumpOnOutOfMemoryError"

# Enable gradle daemon by default
export GRADLE_DAEMON=true
```

## Current gradle.properties Configuration

```properties
# Build Performance Optimizations
org.gradle.configuration-cache=true    # Reuse configuration between builds
org.gradle.parallel=true               # Run tasks in parallel
org.gradle.caching=true                # Cache task outputs
org.gradle.daemon=true                 # Keep JVM running between builds
org.gradle.daemon.idletimeout=60000    # 1 minute idle timeout
org.gradle.jvmargs=-Xmx2g              # 2GB heap size
org.gradle.vfs.watch=true              # Watch file system for changes
```

## Troubleshooting Slow Builds

### Gradle Daemon Uses Too Much Memory
```bash
./gradlew --stop  # Stop the daemon
# It will restart automatically next time
```

### Cache is Corrupted
```bash
./gradlew cleanBuildCache
./gradlew build
```

### Out of Memory Errors
```bash
# Increase heap size temporarily
GRADLE_OPTS="-Xmx3g" ./gradlew build
```

## Summary

| Scenario | Command | Time |
|----------|---------|------|
| 🚀 Quick dev build | `./gradlew build -x test` | ~30s |
| ✅ Test code | `./gradlew test` | ~2-3m |
| 🔄 Incremental build | `./gradlew build` | ~6-8m |
| 🧹 Full clean build | `./gradlew clean build` | ~10-15m |
| ⚡ CI/CD build | `./gradlew clean build --build-cache` | ~8-10m |

**Pro Tip:** During development, use `./gradlew build -x test` + `./gradlew test` separately. This is faster than running both together!
