<p align="center">
  <img src="branding/il2cppmanager-play-icon.svg" width="112" alt="IL2CppManager logo">
</p>

<h1 align="center">IL2CppManager (Web Edition)</h1>

<p align="center">
  <strong>Inspect Unity IL2CPP runtime metadata and native disassembly in your browser.</strong><br>
  A modern, responsive React & TypeScript reverse-engineering workbench for browsing metadata, reading ARM64 instructions, and tracing recursive method call relationships.
</p>

<p align="center">
  <a href="#features"><img alt="React 18" src="https://img.shields.io/badge/React-18-1C1C1E?style=flat-square&amp;logo=react"></a>
  <a href="#features"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-1C1C1E?style=flat-square&amp;logo=typescript"></a>
  <a href="#features"><img alt="Tailwind CSS" src="https://img.shields.io/badge/TailwindCSS-v4-1C1C1E?style=flat-square&amp;logo=tailwindcss"></a>
  <a href="LICENSE"><img alt="Apache License 2.0" src="https://img.shields.io/badge/License-Apache_2.0-1C1C1E?style=flat-square"></a>
</p>

---

## Features

- **Hierarchical Metadata Browser:** Navigate through Assemblies, Namespaces, Classes, TypeDef sizes, Fields with memory offsets, and Methods with RVAs/VAs.
- **Interactive Call Graph:** Interactive pan, zoom, draggable nodes, fit-to-screen, Bezier call arrows, and recursive expansion of callers and callees.
- **ARM64 Native Disassembler:** Inspect decoded machine bytes, mnemonics, operands, branch jumps, and direct method invocation targets.
- **Precision Symbol Search:** Filter in current directory level or search everywhere across classes, fields, methods, and RVAs with exact and case-sensitive matching.
- **Process Switcher:** Attach to active Unity game processes or enter custom process PIDs.
- **Metadata Dump Generator:** Export standard `dump.cs` C# class headers with offsets and RVAs.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Credits and License

IL2CppManager is released under the [Apache License 2.0](LICENSE).

