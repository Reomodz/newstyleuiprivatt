# IL2CppManager

> **High-Performance Unity IL2CPP Metadata Inspector, Offset Watchlist Engine & Native Code Generator**  
> Built for Android (Native Capacitor), Tablet & Desktop Web with React 18, TypeScript & Tailwind CSS.

---

## ⚡ Overview

**IL2CppManager** is a modern reverse-engineering workspace designed for inspecting Unity IL2CPP metadata dumps (`dump.cs`, `il2cpp.h`), tracking target fields and method RVAs across game updates, organizing watchlist profiles with hierarchical groups and subgroups, and exporting resolved offsets directly into production-ready C++, C#, Cheat Engine, or custom template formats.

---

## 🚀 Key Feature Modules

### 1. Storage Dump Hub & High-Speed Parsing Engine
- **Instant Chunked Streaming Parser:** Stream and parse multi-megabyte `dump.cs` and `il2cpp.h` files without freezing the browser or mobile UI.
- **Symbol Indexing:** Automatically extracts assemblies (`Assembly-CSharp.dll`, `UnityEngine.CoreModule.dll`, etc.), namespaces, classes, struct memory sizes, field offset pointers, and method RVAs.
- **Zero-Offset Persistence:** Stores symbol definitions cleanly with real-time dynamic resolution against loaded dumps.

### 2. Profiles, Watchlists & Group Hierarchy
- **Modular Profile System:** Create and switch between profiles for different games, mods, or patch versions.
- **Hierarchical Grouping:** Organize targets into **Groups** and nested **Subgroups** (e.g., `Player / Movement`, `Combat / Weapons`).
- **Persistent Group Collapse Memory:** Remembers your open/collapsed group view per-profile across navigation, tab switches, and app restarts.
- **Drag-and-Drop & Manual Ordering:** Easily reorder targets and groups using smooth touch/mouse drag handles or optional Chevron Up/Down reorder buttons.
- **Fallback Resolution Chains:** Specify alternate class and member names so offsets automatically resolve even if developers rename or obfuscate classes in future game patches.

### 3. Hierarchical Assembly Browser
- **4-Tier Drilldown:** Browse through **Assemblies ➔ Namespaces ➔ Classes ➔ Fields & Methods**.
- **Context-Aware Search Engine:**
  - **Class View Search:** Automatically locks search to **CURRENT LEVEL** inside class field/method views to prevent clutter.
  - **Everywhere Global Search:** High-speed lookup across all assemblies for classes, methods, fields, and RVA hex signatures.
  - **Auto-Reset on Navigation:** Search queries automatically reset when switching tabs (Fields ↔ Methods), clicking cancel, or navigating with breadcrumbs.
- **One-Tap Target Saving:** Directly save any field or method from the browser into your active watchlist profile.
- **Dynamic Header Switcher:** The top bar dynamically displays your active profile name or section with one-tap switching back from the browser.

### 4. Code Exporter & Custom Template Engine
- **Multi-Preset Exporter:**
  - **C++ `constexpr`:** `constexpr uintptr_t {name} = {offset};`
  - **C# Constants / Struct Fields:** `public const int {name} = {offset};`
  - **Cheat Engine INI Format**
- **Dynamic Template Tag Placeholders:**
  - `+{name}` — Custom target alias or member identifier
  - `+{offset}` — Resolved field offset or method RVA hex (e.g., `0x1A0`)
  - `+{rva}` — Method RVA hex
  - `+{member}` — Clean member symbol name
  - `+{group}` — Target group name
  - `+{subgroup}` — Target subgroup name
  - `+{kind}` — Target kind (`FIELD` or `METHOD`)
  - `+{type}` — Field data type or method return type
  - `+{comment}` — Code comments & developer notes
  - `+\n` — Multiline line breaks
- **Scan History:** Keeps a timestamped history of previous offset resolutions with instant copy and file export.

### 5. Customization, Glass Atmosphere & Card Settings
- **Theme Modes & Vibrant Accents:**
  - Night theme with 6 accent palettes: *Indigo Pulse*, *Neon Cyan*, *Matrix Emerald*, *Cyber Amber*, *Crimson Red*, and *Deep Violet*.
- **Custom Wallpaper Backgrounds:**
  - Choose from preset wallpapers or provide custom URLs.
  - Fine-tune **Background Dim (0–90%)**, **Glass Blur (0–25px)**, and **Card Opacity (50–100%)**.
  - Glass-morphic translucent styling applies consistently across cards, group containers, and subgroup cards.
- **Card Customization Modal:**
  - Density toggle (Compact vs. Comfortable).
  - Tablet & Desktop layout (List vs. Side-by-side Grid).
  - Field visibility toggles: Fallbacks, Assembly `.dll` tags, Custom Names, Kind Badges, Comments multiline expansion, Resolved Offsets, and Up/Down reorder buttons.

---

## 📂 Project Architecture

```
├── branding/                      # App icons and graphics
├── docs/                          # Documentation & visual guides
├── src/
│   ├── components/                # React UI Components
│   │   ├── dashboard/             # Storage Dump & Profile Sidebar views
│   │   │   ├── DashboardHeader.tsx
│   │   │   └── ProfileSidebar.tsx # Profile watchlist with group collapse memory
│   │   ├── modals/                # Settings, Edit & Creation Modals
│   │   │   ├── MakeGroupModal.tsx
│   │   │   ├── MakeSubgroupModal.tsx
│   │   │   └── settings/          # Theme & Card Customization modals
│   │   ├── targets/               # Target card components
│   │   │   ├── TargetCard.tsx     # Individual target card with optional reorder buttons
│   │   │   ├── TargetGroupCard.tsx
│   │   │   └── TargetSubgroupCard.tsx # Translucent subgroup card container
│   │   ├── MainDashboard.tsx      # Main dashboard controller
│   │   ├── ManagerBrowser.tsx     # 4-tier Assembly Metadata browser
│   │   └── ManagerHeader.tsx      # Dynamic header bar with context-aware tab indicator
│   ├── hooks/                     # Custom React Hooks
│   │   ├── useAppSettings.ts      # Wallpaper, theme & glass styling settings
│   │   ├── useMemoryScanner.ts    # Offset scanner and scan history persistence
│   │   └── useWatchlistManager.ts # Profile and target CRUD management
│   ├── services/                  # Business Logic & Parsers
│   │   └── Il2CppEngine.ts        # Fast zero-allocation dump.cs & il2cpp.h parser
│   ├── types/                     # TypeScript Interfaces & Enums
│   │   ├── index.ts               # Core target, profile, and browser types
│   │   └── theme.ts               # Theme, wallpaper, and accent color types
│   ├── App.tsx                    # Top-level application container
│   ├── index.css                  # Tailwind CSS & custom glass styling engine
│   └── main.tsx                   # App entry point
├── capacitor.config.json          # Android Capacitor configuration
├── package.json                   # Dependencies and npm scripts
└── tsconfig.json                  # TypeScript configuration
```

---

## 🛠️ Build & Development Guide

### Prerequisites
- **Node.js:** v18.0.0 or later
- **npm:** v9.0.0 or later
- **Android Studio / SDK:** (Required only for building local Android APKs)

### 1. Development Mode
Start the local Vite development server:
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

### 2. Web Production Build
Compile TypeScript and bundle the static web application:
```bash
npm run build
```
The optimized bundle will be generated in the `dist/` directory.

### 3. Building Android APK (Capacitor)

#### Local Build:
```bash
# 1. Build the web distribution
npm run build

# 2. Sync web assets with the native Android project
npx cap sync android

# 3. Build the Debug APK using Gradle
cd android
./gradlew assembleDebug

# Output APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### GitHub Actions Automated Build:
A pre-configured CI workflow (`.github/workflows/build-apk.yml`) is available to automatically compile and publish the Android APK artifact upon pushing to the repository.

---

## 💡 Tips & Shortcuts

- **Quick Navigation:** Click on the dynamic header button in the top bar to jump straight back to your active profile from anywhere in the browser.
- **Direct Symbol Inspection:** Click the **Eye icon** on any target card to immediately jump to its definition inside the Assembly Browser.
- **Multi-Line Comments:** Enable *Expand All Descriptions & Comments* in **Target Card Settings** to view complete unclipped reverse-engineering notes on mobile touch screens.
- **Custom Background Tuning:** Set your card opacity slider to `80%` and glass blur to `12px` for an immersive translucent glass UI over custom wallpapers.

---

## 📄 License

IL2CppManager is licensed under the [Apache License 2.0](LICENSE).
