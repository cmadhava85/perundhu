# Multi-City Terminal Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER/ADMIN INTERFACE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  SearchResults Component          Admin Approval Panel           │
│  ┌─────────────────────┐         ┌──────────────────────┐       │
│  │ From: Coimbatore    │         │ Validate Terminal    │       │
│  │ To: Bangalore       │         │ Before Approval      │       │
│  │ [Search]            │         │ [Verification]       │       │
│  └────────┬────────────┘         └──────────┬───────────┘       │
│           │                                  │                   │
│           └──────────────┬───────────────────┘                   │
│                          │                                       │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│            FRONTEND - React Query Hook Layer                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  useTerminalResolution(source, destination, enabled)            │
│  ┌────────────────────────────────────────────────────┐         │
│  │ 1. Build API URL with source & destination        │         │
│  │ 2. Call GET /api/v1/terminals/resolve             │         │
│  │ 3. Cache response by [source, destination]        │         │
│  │ 4. Return TerminalInfo object                      │         │
│  └────────────────────┬───────────────────────────────┘         │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ↓ HTTP GET
┌─────────────────────────────────────────────────────────────────┐
│           BACKEND - REST Controller Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  TerminalController                                              │
│  ┌──────────────────────────────────────────────────┐           │
│  │ @GetMapping("/api/v1/terminals/resolve")        │           │
│  │ public TerminalResolutionResult resolve(        │           │
│  │   String source, String destination)            │           │
│  │ {                                                │           │
│  │   return terminalResolutionService.resolve(...) │           │
│  │ }                                                │           │
│  └────────────────────┬─────────────────────────────┘           │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│      BACKEND - Service Layer (TerminalResolutionService)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  resolveTerminal(source, destination)                           │
│  ├─ Normalize locations                                          │
│  └─ resolveTerminalForAnyCity(source, destination)             │
│     │                                                            │
│     ├─ isChennaiGeneric(source)?                               │
│     │  └─ findTerminalForDestination(destination)              │
│     │                                                            │
│     ├─ isCoimbatoreGeneric(source)?                            │
│     │  └─ findCoimbatoreTerminalForDestination(destination)   │
│     │     ├─ Check northern routes → GANDHIPURAM              │
│     │     ├─ Check southern routes → SINGANALLUR              │
│     │     ├─ Check western routes → UKKADAM                   │
│     │     └─ Default → GANDHIPURAM                             │
│     │                                                            │
│     ├─ isTirupatiGeneric(source)?                              │
│     │  └─ findTirupatiTerminalForDestination(destination)      │
│     │     ├─ Check inter-state routes → TIRUPATI_CENTRAL      │
│     │     ├─ Check local routes → TIRUPATI_MOFFUSIL           │
│     │     └─ Default → TIRUPATI_CENTRAL                        │
│     │                                                            │
│     └─ isSalemGeneric(source)?                                 │
│        └─ findSalemTerminalForDestination(destination)         │
│           ├─ Check northern routes → SALEM_CENTRAL             │
│           ├─ Check southern routes → SALEM_MOFFUSIL            │
│           └─ Default → SALEM_CENTRAL                            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│      Terminal Database (In-Memory Map)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Terminals Map                  Destination Mapping              │
│  ┌──────────────────────┐       ┌─────────────────────┐         │
│  │ KOYEMBEDU            │       │ GANDHIPURAM         │         │
│  │ KILAMBAKKAM          │       │ → ["bangalore"...] │         │
│  │ MADHAVARAM           │       │                     │         │
│  │ POONAMALLEE          │       │ SINGANALLUR         │         │
│  │ GANDHIPURAM          │       │ → ["madurai"...]    │         │
│  │ SINGANALLUR          │       │                     │         │
│  │ UKKADAM              │       │ TIRUPATI_CENTRAL    │         │
│  │ TIRUPATI_CENTRAL     │       │ → ["hyderabad"...]  │         │
│  │ TIRUPATI_MOFFUSIL    │       │                     │         │
│  │ SALEM_CENTRAL        │       │ SALEM_CENTRAL       │         │
│  │ SALEM_MOFFUSIL       │       │ → ["bangalore"...]  │         │
│  └──────────────────────┘       └─────────────────────┘         │
│                                                                   │
│  Each Terminal Object:                                           │
│  ┌────────────────────────────────────────┐                    │
│  │ terminalId: "GANDHIPURAM_CBS"          │                    │
│  │ name: "Gandhipuram"                    │                    │
│  │ city: "Coimbatore"                     │                    │
│  │ displayName: "Gandhipuram Central..."  │                    │
│  │ address: "Gandhipuram, Coimbatore..."  │                    │
│  │ latitude: 11.0036                      │                    │
│  │ longitude: 76.9462                     │                    │
│  │ servesStates: ["Tamil Nadu", ...]      │                    │
│  │ majorDestinations: ["Bangalore", ...]  │                    │
│  │ terminalType: INTER_STATE              │                    │
│  │ operatedBy: "TNSTC"                    │                    │
│  └────────────────────────────────────────┘                    │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                        ↑
                        │ Return Terminal
┌─────────────────────────────────────────────────────────────────┐
│    TerminalResolutionResult                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│ {                                                                │
│   "terminal": { ... BusTerminal object ... },                   │
│   "resolvedSource": "Gandhipuram",                              │
│   "originalSource": "Coimbatore",                               │
│   "destination": "Bangalore",                                   │
│   "needsTerminalInfo": true,                                    │
│   "message": "Buses to Bangalore depart from Gandhipuram..."   │
│ }                                                                │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
                        │
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│         FRONTEND - TerminalInfoAlert Component                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Display:                                                        │
│  ┌──────────────────────────────────────────┐                  │
│  │ Terminal Information                     │                  │
│  │ ───────────────────────────────────────  │                  │
│  │ Gandhipuram Central Bus Stand            │                  │
│  │ Gandhipuram, Coimbatore, TN 641012       │                  │
│  │                                          │                  │
│  │ [View on Map] (opens with coordinates)  │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Sequence

```
USER SEARCHES: "Coimbatore" → "Bangalore"

Client                    Server                  Database
  │                          │                        │
  ├─ Search form             │                        │
  │  (source, destination)   │                        │
  │                          │                        │
  ├─ useTerminalResolution() │                        │
  │  hook triggered          │                        │
  │                          │                        │
  ├─ GET /api/v1/terminals/  │                        │
  │  resolve?source=...      │                        │
  ├──────────────────────────>                        │
  │                          │                        │
  │                  Controller receives request     │
  │                          │                        │
  │                  resolve(source, destination)    │
  │                          │                        │
  │                  Service processes:              │
  │                    1. Normalize inputs            │
  │                    2. Detect city → Coimbatore   │
  │                    3. Find finder method         │
  │                    4. Call terminal finder      │
  │                    5. Match destination keywords │
  │                          │                        │
  │                  Access Terminal Map             │
  │                          ├──────────────────────> │
  │                          │  Get GANDHIPURAM       │
  │                          │  object                │
  │                          <──────────────────────┤ │
  │                          │                        │
  │                  Build response:                 │
  │                    {terminal, message, ...}      │
  │                          │                        │
  │  <──────────────────────│                        │
  │  HTTP 200 + JSON         │                        │
  │                          │                        │
  ├─ Cache result            │                        │
  │  [source, destination]   │                        │
  │                          │                        │
  ├─ TerminalInfoAlert       │                        │
  │  component renders       │                        │
  │                          │                        │
  └─ Display to user         │                        │
     "Buses to Bangalore     │                        │
      depart from            │                        │
      Gandhipuram..."        │                        │

```

---

## City Routing Decision Tree

```
resolveTerminalForAnyCity(source, destination)
│
├─ isChennaiGeneric(source)?
│  ├─ YES → findTerminalForDestination(destination)
│  │        → Check destination mapping
│  │        → Return Chennai terminal
│  │
│  └─ NO → Continue
│
├─ isCoimbatoreGeneric(source)?
│  ├─ YES → findCoimbatoreTerminalForDestination(destination)
│  │        ├─ "bangalore" in northern? → GANDHIPURAM
│  │        ├─ "madurai" in southern? → SINGANALLUR
│  │        ├─ "palakkad" in western? → UKKADAM
│  │        └─ Default → GANDHIPURAM
│  │
│  └─ NO → Continue
│
├─ isTirupatiGeneric(source)?
│  ├─ YES → findTirupatiTerminalForDestination(destination)
│  │        ├─ "hyderabad" in inter-state? → TIRUPATI_CENTRAL
│  │        ├─ "kalahasti" in local? → TIRUPATI_MOFFUSIL
│  │        └─ Default → TIRUPATI_CENTRAL
│  │
│  └─ NO → Continue
│
├─ isSalemGeneric(source)?
│  ├─ YES → findSalemTerminalForDestination(destination)
│  │        ├─ "bangalore" in northern? → SALEM_CENTRAL
│  │        ├─ "madurai" in southern? → SALEM_MOFFUSIL
│  │        └─ Default → SALEM_CENTRAL
│  │
│  └─ NO → Continue
│
└─ RETURN null (Unknown city)
   → Frontend shows: needsTerminalInfo: false
```

---

## Terminal by City and Route Type

```
COIMBATORE
├─ Inter-State Routes (Northern Direction)
│  └─ GANDHIPURAM Central Bus Stand
│     ├─ Bangalore ✓
│     ├─ Mysore ✓
│     ├─ Hyderabad ✓
│     └─ Salem ✓
│
├─ Intra-State Routes (Southern Direction)
│  └─ SINGANALLUR Bus Terminus
│     ├─ Madurai ✓
│     ├─ Trichy ✓
│     └─ Thanjavur ✓
│
└─ Western Routes
   └─ UKKADAM Bus Terminus
      ├─ Palakkad ✓
      ├─ Palani ✓
      └─ Kodaikanal ✓

TIRUPATI
├─ Inter-State Routes
│  └─ TIRUPATI CENTRAL Bus Terminus
│     ├─ Hyderabad ✓
│     ├─ Chennai ✓
│     └─ Vijayawada ✓
│
└─ Local Routes
   └─ TIRUPATI MOFFUSIL
      ├─ Kalahasti ✓
      └─ Vellore ✓

SALEM
├─ Northern Routes (Inter-State)
│  └─ SALEM CENTRAL Bus Terminus
│     ├─ Bangalore ✓
│     ├─ Hosur ✓
│     └─ Coimbatore ✓
│
└─ Southern Routes (Intra-State)
   └─ SALEM MOFFUSIL
      ├─ Madurai ✓
      ├─ Trichy ✓
      └─ Tirunelveli ✓

CHENNAI
├─ Inter-State (North)
│  └─ KOYEMBEDU
│     ├─ Bangalore ✓
│     └─ Mysore ✓
│
├─ Intra-State (South)
│  └─ KILAMBAKKAM
│     ├─ Madurai ✓
│     └─ Trichy ✓
│
├─ Inter-State (East)
│  └─ MADHAVARAM
│     ├─ Hyderabad ✓
│     └─ Tirupati ✓
│
└─ Suburban
   └─ POONAMALLEE
      └─ Kancheepuram ✓
```

---

## Data Flow Layers

```
┌─────────────────────────────────────────────┐
│ User Interface Layer                        │
│ (SearchResults, AdminApprovalPanel)         │
└──────────────────┬──────────────────────────┘
                   │ useTerminalResolution hook
                   ↓
┌─────────────────────────────────────────────┐
│ API Communication Layer                     │
│ (React Query, HTTP GET)                     │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ REST Controller Layer                       │
│ (TerminalController)                        │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Business Logic Layer                        │
│ (TerminalResolutionService)                 │
│ - City detection                            │
│ - Terminal routing                          │
│ - Destination matching                      │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│ Data Access Layer                           │
│ (Terminal & Destination Maps)               │
│ - In-memory initialized at startup          │
│ - Could be moved to database                │
└─────────────────────────────────────────────┘
```

---

## Summary

The multi-city terminal system uses a **layered architecture** with:
- **Presentation Layer:** React components for user/admin
- **API Layer:** REST endpoints with React Query
- **Service Layer:** Intelligent routing based on city & destination
- **Data Layer:** In-memory terminal database

**Key Innovation:** Recursive city detection → terminal finder → destination matcher pattern enables easy addition of new cities without code duplication.

