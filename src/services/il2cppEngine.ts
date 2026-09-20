import {
  ProcessDescriptor,
  AssemblyDescriptor,
  NamespaceDescriptor,
  ClassInfoDescriptor,
  FieldDescriptor,
  MethodDescriptor,
  SymbolSearchDescriptor,
  SymbolKind,
  SearchMatchMode,
  StorageDumpMeta,
  DumpParseProgress,
} from '../types';

class Il2cppEngine {
  private currentProcess: ProcessDescriptor | null = {
    pid: 0,
    name: 'No dump loaded',
    appName: 'Storage Dump Engine',
    startTicks: Math.floor(Date.now() / 1000),
    unityVersion: 'Unknown',
    arch: 'arm64-v8a',
  };

  private storageMeta: StorageDumpMeta = {
    dumpCsFileName: null,
    il2cppHFileName: null,
    baseAddressHex: '0x0',
    staticFieldsOffsetHex: '0xB8',
    totalClasses: 0,
    totalMethods: 0,
    totalFields: 0,
    totalTypeInfos: 0,
    loadedAt: Date.now(),
  };

  private assemblies: AssemblyDescriptor[] = [];
  private namespaces: NamespaceDescriptor[] = [];
  private classes: ClassInfoDescriptor[] = [];
  private fields: Record<number, FieldDescriptor[]> = {};
  private methods: Record<number, MethodDescriptor[]> = {};
  private callRelations: Array<{
    fromClass: number;
    fromMethod: number;
    toClass: number;
    toMethod: number;
    callSiteRva?: string;
  }> = [];

  // Fast Index Maps for O(1) Lookups in 50k+ class dumps
  private classByNameMap = new Map<string, ClassInfoDescriptor>();
  private classByIndexMap = new Map<number, ClassInfoDescriptor>();

  constructor() {
    this.rebuildIndexMaps();
  }

  private rebuildIndexMaps(): void {
    this.classByNameMap.clear();
    this.classByIndexMap.clear();
    for (const c of this.classes) {
      this.classByIndexMap.set(c.index, c);
      this.classByNameMap.set(c.name.toLowerCase(), c);
      if (c.namespaceName) {
        this.classByNameMap.set(`${c.namespaceName.toLowerCase()}.${c.name.toLowerCase()}`, c);
      }
    }
  }

  // Storage Dump Metadata API
  public getStorageMeta(): StorageDumpMeta {
    return { ...this.storageMeta };
  }

  public getCurrentProcess(): ProcessDescriptor | null {
    return this.currentProcess;
  }

  public getAssemblies(): AssemblyDescriptor[] {
    return this.assemblies;
  }

  public getAssembly(index: number): AssemblyDescriptor | undefined {
    return this.assemblies.find((a) => a.index === index);
  }

  public getNamespaces(assemblyIndex: number): NamespaceDescriptor[] {
    return this.namespaces.filter((ns) => ns.assemblyIndex === assemblyIndex);
  }

  public getClasses(assemblyIndex: number, namespaceName?: string): ClassInfoDescriptor[] {
    return this.classes.filter(
      (c) =>
        c.assemblyIndex === assemblyIndex &&
        (namespaceName === undefined || c.namespaceName === namespaceName)
    );
  }

  public getClass(classIndex: number): ClassInfoDescriptor | undefined {
    return this.classByIndexMap.get(classIndex) || this.classes.find((c) => c.index === classIndex);
  }

  public findClassIndexForTarget(className: string, namespaceName?: string): number | undefined {
    if (!className) return undefined;
    const cleanClass = className.trim().toLowerCase();
    const cleanNs = namespaceName?.trim().toLowerCase();

    if (cleanNs) {
      const fullKey = `${cleanNs}.${cleanClass}`;
      const match = this.classByNameMap.get(fullKey);
      if (match) return match.index;
    }

    const directMatch = this.classByNameMap.get(cleanClass);
    if (directMatch) return directMatch.index;

    const found = this.classes.find((c) => {
      const nameEq = c.name.toLowerCase() === cleanClass;
      if (!nameEq) return false;
      if (cleanNs) {
        return (c.namespaceName || '').toLowerCase() === cleanNs;
      }
      return true;
    });

    return found ? found.index : undefined;
  }

  public getFields(classIndex: number): FieldDescriptor[] {
    return this.fields[classIndex] || [];
  }

  public getMethods(classIndex: number): MethodDescriptor[] {
    return this.methods[classIndex] || [];
  }

  public getClassCounts(classIndex: number): { fieldCount: number; methodCount: number } {
    const f = this.fields[classIndex];
    const m = this.methods[classIndex];
    return {
      fieldCount: f ? f.length : 0,
      methodCount: m ? m.length : 0,
    };
  }

  public getMethod(classIndex: number, methodIndex: number): MethodDescriptor | undefined {
    const list = this.methods[classIndex];
    return list?.find((m) => m.index === methodIndex);
  }

  public getCalls(classIndex: number, methodIndex: number): {
    classIndex: number;
    methodIndex: number;
    callSiteRva?: string;
  }[] {
    const rels = this.callRelations.filter(
      (r) => r.fromClass === classIndex && r.fromMethod === methodIndex
    );
    return rels.map((r) => ({
      classIndex: r.toClass,
      methodIndex: r.toMethod,
      callSiteRva: r.callSiteRva,
    }));
  }

  public getCallers(classIndex: number, methodIndex: number): {
    classIndex: number;
    methodIndex: number;
    callSiteRva?: string;
  }[] {
    const rels = this.callRelations.filter(
      (r) => r.toClass === classIndex && r.toMethod === methodIndex
    );
    return rels.map((r) => ({
      classIndex: r.fromClass,
      methodIndex: r.fromMethod,
      callSiteRva: r.callSiteRva,
    }));
  }

  public searchEverywhere(
    query: string,
    matchMode: SearchMatchMode = SearchMatchMode.CONTAINS,
    matchCase: boolean = false
  ): SymbolSearchDescriptor[] {
    if (!query.trim()) return [];

    const cleanQuery = matchCase ? query.trim() : query.trim().toLowerCase();
    const testMatch = (target: string | undefined | null): boolean => {
      if (!target) return false;
      const val = matchCase ? target : target.toLowerCase();
      if (matchMode === SearchMatchMode.EXACT) {
        return val === cleanQuery;
      }
      return val.includes(cleanQuery);
    };

    const MAX_SEARCH_RESULTS = 150;
    const results: SymbolSearchDescriptor[] = [];

    // Search classes
    for (const cls of this.classes) {
      const fullQualifiedName = cls.namespaceName ? `${cls.namespaceName}.${cls.name}` : cls.name;
      if (
        testMatch(cls.name) ||
        testMatch(fullQualifiedName) ||
        testMatch(cls.namespaceName) ||
        testMatch(cls.assemblyName) ||
        (cls.typeInfoHex && testMatch(cls.typeInfoHex))
      ) {
        results.push({
          id: `class_${cls.index}`,
          kind: SymbolKind.CLASS,
          classIndex: cls.index,
          memberIndex: -1,
          name: cls.name,
          assemblyName: cls.assemblyName,
          ownerName: cls.namespaceName || 'global',
          signature: `class ${fullQualifiedName}`,
          typeInfoLabel: cls.typeInfoHex,
        });
        if (results.length >= MAX_SEARCH_RESULTS) return results;
      }
    }

    // Search fields
    for (const [classIdxStr, fieldList] of Object.entries(this.fields)) {
      const classIdx = Number(classIdxStr);
      const cls = this.getClass(classIdx);
      if (!cls) continue;

      for (const field of fieldList) {
        if (
          testMatch(field.name) ||
          testMatch(field.typeName) ||
          (field.offset !== undefined && testMatch(`0x${field.offset.toString(16)}`))
        ) {
          results.push({
            id: `field_${classIdx}_${field.index}`,
            kind: SymbolKind.FIELD,
            classIndex: classIdx,
            memberIndex: field.index,
            name: field.name,
            assemblyName: cls.assemblyName,
            ownerName: `${cls.namespaceName ? cls.namespaceName + '.' : ''}${cls.name}`,
            signature: `${field.typeName || 'var'} ${field.name}`,
            offsetLabel: field.offset !== undefined ? `0x${field.offset.toString(16).toUpperCase()}` : undefined,
          });
          if (results.length >= MAX_SEARCH_RESULTS) return results;
        }
      }
    }

    // Search methods
    for (const [classIdxStr, methodList] of Object.entries(this.methods)) {
      const classIdx = Number(classIdxStr);
      const cls = this.getClass(classIdx);
      if (!cls) continue;

      for (const method of methodList) {
        if (
          testMatch(method.name) ||
          testMatch(method.signature) ||
          (method.rva !== undefined && testMatch(`0x${method.rva.toString(16)}`)) ||
          (method.typeInfoHex && testMatch(method.typeInfoHex))
        ) {
          results.push({
            id: `method_${classIdx}_${method.index}`,
            kind: SymbolKind.METHOD,
            classIndex: classIdx,
            memberIndex: method.index,
            name: method.name,
            assemblyName: cls.assemblyName,
            ownerName: `${cls.namespaceName ? cls.namespaceName + '.' : ''}${cls.name}`,
            signature: method.signature || method.name,
            rvaLabel: method.rva !== undefined ? `0x${method.rva.toString(16).toUpperCase()}` : undefined,
            addressLabel: method.address !== undefined ? `0x${method.address.toString(16).toUpperCase()}` : undefined,
            typeInfoLabel: method.typeInfoHex || cls.typeInfoHex,
          });
          if (results.length >= MAX_SEARCH_RESULTS) return results;
        }
      }
    }

    return results;
  }

  public async parseDumpCsFile(
    file: File,
    onProgress?: (progress: DumpParseProgress) => void,
    replaceEntireEngine: boolean = true
  ): Promise<{
    classesCount: number;
    methodsCount: number;
    fieldsCount: number;
    assembliesCount: number;
  }> {
    const totalBytes = file.size;
    const CHUNK_SIZE = 2 * 1024 * 1024; // 2 MB chunks for mobile memory safety
    let offset = 0;
    const decoder = new TextDecoder('utf-8');
    let remainder = '';

    let currentAsmName = 'Assembly-CSharp.dll';
    let currentAsmIdx = 0;
    let currentNamespace = '';
    let currentClass: ClassInfoDescriptor | null = null;
    let classCounter = replaceEntireEngine ? 0 : this.classes.length;
    let fieldCounter = 0;
    let methodCounter = 0;

    let parsedClasses = 0;
    let parsedFields = 0;
    let parsedMethods = 0;

    const assemblyMap = new Map<string, AssemblyDescriptor>();
    const namespaceMap = new Map<string, NamespaceDescriptor>();
    const newClasses: ClassInfoDescriptor[] = [];
    const newFields: Record<number, FieldDescriptor[]> = {};
    const newMethods: Record<number, MethodDescriptor[]> = {};

    const getOrCreateAssembly = (name: string): AssemblyDescriptor => {
      if (!assemblyMap.has(name)) {
        const asm: AssemblyDescriptor = {
          index: assemblyMap.size,
          name,
          classCount: 0,
        };
        assemblyMap.set(name, asm);
      }
      return assemblyMap.get(name)!;
    };

    const getOrCreateNamespace = (asmIndex: number, nsName: string): NamespaceDescriptor => {
      const key = `${asmIndex}::${nsName}`;
      if (!namespaceMap.has(key)) {
        const ns: NamespaceDescriptor = {
          index: namespaceMap.size,
          name: nsName,
          assemblyIndex: asmIndex,
          classCount: 0,
        };
        namespaceMap.set(key, ns);
      }
      return namespaceMap.get(key)!;
    };

    // Initialize default assembly
    getOrCreateAssembly(currentAsmName);

    const baseAddr = this.storageMeta.baseAddressHex
      ? parseInt(this.storageMeta.baseAddressHex, 16)
      : 0x78f1e0b000;

    // Precompiled regexes for maximum performance on 75MB+
    const asmRegex1 = /^\/\/\s*(?:Assembly:\s*|Image:\s*|Image\s*\d+:\s*)?([a-zA-Z0-9_.-]+(?:\.dll)?)/i;
    const asmRegex2 = /^\/\/\s*([a-zA-Z0-9_.-]+(?:\.dll)?)$/i;
    const nsCommentRegex = /^\/\/\s*Namespace:\s*([a-zA-Z0-9_.]*)/i;
    const nsRegex = /^namespace\s+([a-zA-Z0-9_.]+)\s*\{?/;
    const classRegex = /^(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:abstract\s+|sealed\s+|static\s+)?(class|struct|enum|interface)\s+([a-zA-Z0-9_.<>]+)(?:\s*:\s*([a-zA-Z0-9_.<>]+))?/;
    const methodRegex = /(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:static\s+|virtual\s+|override\s+|abstract\s+|extern\s+|unsafe\s+)*([a-zA-Z0-9_<>.[\]&]+)\s+([a-zA-Z0-9_.<>]+)\s*\((.*?)\)\s*;?(?:\s*\/\/\s*(?:RVA:\s*)?(0x[0-9a-fA-F]+|\d+))?(?:\s*\/\/\s*typeinfo\s*(0x[0-9a-fA-F]+))?/;
    const fieldRegex = /(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:static\s+|readonly\s+|const\s+|volatile\s+)*([a-zA-Z0-9_<>.[\]&]+)\s+([a-zA-Z0-9_<>]+)(?:\s*=\s*[^;/]+)?\s*;\s*(?:\/\/\s*(?:Offset:\s*)?(0x[0-9a-fA-F]+|\d+))?/;

    let lastYieldTime = performance.now();

    while (offset < totalBytes) {
      const slice = file.slice(offset, Math.min(offset + CHUNK_SIZE, totalBytes));
      const buffer = await slice.arrayBuffer();
      offset += slice.size;

      let chunkText = remainder + decoder.decode(buffer, { stream: offset < totalBytes });
      if (offset === slice.size) {
        // Strip BOM if present at start of file
        chunkText = chunkText.replace(/^\uFEFF/, '');
      }

      const lines = chunkText.split(/\r?\n/);
      // Keep last partial line for next iteration if not at EOF
      remainder = offset < totalBytes ? lines.pop() || '' : '';

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.trim();
        if (!line) continue;

        // Assembly or Namespace comment (Standard Il2CppDumper format)
        if (line.startsWith('//')) {
          const asmMatch = line.match(asmRegex1) || line.match(asmRegex2);
          if (asmMatch) {
            let asmName = asmMatch[1].trim();
            if (!asmName.endsWith('.dll')) asmName += '.dll';
            currentAsmName = asmName;
            const asm = getOrCreateAssembly(currentAsmName);
            currentAsmIdx = asm.index;
            continue;
          }

          const nsCommentMatch = line.match(nsCommentRegex);
          if (nsCommentMatch) {
            currentNamespace = nsCommentMatch[1] ? nsCommentMatch[1].trim() : '';
            if (currentNamespace) {
              getOrCreateNamespace(currentAsmIdx, currentNamespace);
            }
            continue;
          }
          continue;
        }

        // Namespace
        if (line.startsWith('namespace ')) {
          const nsMatch = line.match(nsRegex);
          if (nsMatch) {
            currentNamespace = nsMatch[1].trim();
            getOrCreateNamespace(currentAsmIdx, currentNamespace);
            continue;
          }
        }

        // Strip trailing comment for class structure checks (e.g. // TypeDefIndex: 123)
        const lineNoComment = line.split('//')[0].trim();

        // Class / Struct / Enum / Interface
        if (
          !lineNoComment.includes('(') &&
          !lineNoComment.includes(';') &&
          !lineNoComment.includes('=') &&
          (lineNoComment.includes('class ') || lineNoComment.includes('struct ') || lineNoComment.includes('enum ') || lineNoComment.includes('interface '))
        ) {
          const classMatch = lineNoComment.match(classRegex) || line.match(classRegex);
          if (classMatch) {
            const kind = classMatch[1];
            let fullClassName = classMatch[2].trim();
            const parentName = classMatch[3]?.trim();

            let resolvedNamespace = currentNamespace;
            let cleanClassName = fullClassName;
            if (fullClassName.includes('.')) {
              const parts = fullClassName.split('.');
              cleanClassName = parts.pop()!;
              resolvedNamespace = parts.join('.');
            }

            const asm = getOrCreateAssembly(currentAsmName);
            asm.classCount = (asm.classCount || 0) + 1;

            const ns = getOrCreateNamespace(asm.index, resolvedNamespace);
            ns.classCount = (ns.classCount || 0) + 1;

            const classIdx = classCounter++;
            currentClass = {
              index: classIdx,
              name: cleanClassName,
              namespaceName: resolvedNamespace,
              assemblyIndex: asm.index,
              assemblyName: asm.name,
              flags: kind === 'enum' ? 0x100100 : kind === 'struct' ? 0x100008 : 0x100001,
              token: 0,
              bitfield: 1,
              parentType: parentName ? { index: 100, typeIndex: 1, name: parentName } : undefined,
            };

            newClasses.push(currentClass);
            newFields[classIdx] = [];
            newMethods[classIdx] = [];
            parsedClasses++;
            continue;
          }
        }

        if (!currentClass) continue;

        // Method
        if (line.includes('(')) {
          const methodMatch = line.match(methodRegex);
          if (methodMatch) {
            const returnType = methodMatch[1];
            const methodName = methodMatch[2];
            const paramsRaw = methodMatch[3];
            const rvaRaw = methodMatch[4];
            const typeInfoHex = methodMatch[5];

            const rva = rvaRaw
              ? parseInt(rvaRaw, rvaRaw.startsWith('0x') ? 16 : 10)
              : undefined;

            const address = rva !== undefined ? baseAddr + rva : undefined;
            const isStatic = line.includes('static ');

            const paramList: { name: string; type: string }[] = [];
            if (paramsRaw && paramsRaw.trim()) {
              const pTokens = paramsRaw.split(',');
              for (let pi = 0; pi < pTokens.length; pi++) {
                const pTrimmed = pTokens[pi].trim();
                const pParts = pTrimmed.split(/\s+/);
                if (pParts.length >= 2) {
                  const pName = pParts[pParts.length - 1];
                  const pType = pParts.slice(0, pParts.length - 1).join(' ');
                  paramList.push({ name: pName, type: pType });
                }
              }
            }

            const method: MethodDescriptor = {
              index: methodCounter++,
              classIndex: currentClass.index,
              name: methodName,
              returnType,
              signature: `${line.split(';')[0].trim()}`,
              parameters: paramList,
              rva,
              address,
              typeInfoHex,
              isStatic,
            };

            if (typeInfoHex && !currentClass.typeInfoHex) {
              currentClass.typeInfoHex = typeInfoHex;
            }

            newMethods[currentClass.index].push(method);
            parsedMethods++;
            continue;
          }
        }

        // Field
        if (line.includes(';')) {
          const fieldMatch = line.match(fieldRegex);
          if (fieldMatch) {
            const typeName = fieldMatch[1];
            const fieldName = fieldMatch[2];
            const offsetRaw = fieldMatch[3];
            const offsetVal = offsetRaw
              ? parseInt(offsetRaw, offsetRaw.startsWith('0x') ? 16 : 10)
              : undefined;

            const isStatic = line.includes('static ') || line.includes('const ');

            const field: FieldDescriptor = {
              index: fieldCounter++,
              name: fieldName,
              typeIndex: 0,
              typeName,
              offset: offsetVal,
              isStatic,
            };

            newFields[currentClass.index].push(field);
            parsedFields++;
            continue;
          }
        }

        if ((line === '}' || line.startsWith('}') || line.startsWith('};')) && currentClass) {
          currentClass = null;
        }
      }

      // Non-blocking time slicing: Yield to browser UI thread every 20ms
      const now = performance.now();
      if (now - lastYieldTime > 20) {
        if (onProgress) {
          onProgress({
            fileName: file.name,
            fileSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
            percent: Math.min(99, Math.round((offset / totalBytes) * 100)),
            processedBytes: offset,
            totalBytes,
            classesCount: parsedClasses,
            methodsCount: parsedMethods,
            fieldsCount: parsedFields,
            stage: `Streaming ${file.name} (${Number((offset / (1024 * 1024)).toFixed(1))} MB / ${Number((totalBytes / (1024 * 1024)).toFixed(1))} MB)...`,
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
        lastYieldTime = performance.now();
      }
    }

    if (parsedClasses > 0) {
      const assembliesList = Array.from(assemblyMap.values());
      const namespacesList = Array.from(namespaceMap.values());

      if (replaceEntireEngine) {
        this.assemblies = assembliesList;
        this.namespaces = namespacesList;
        this.classes = newClasses;
        this.fields = newFields;
        this.methods = newMethods;
      } else {
        this.assemblies = [...assembliesList, ...this.assemblies];
        this.namespaces = [...namespacesList, ...this.namespaces];
        this.classes = [...newClasses, ...this.classes];
        this.fields = { ...this.fields, ...newFields };
        this.methods = { ...this.methods, ...newMethods };
      }

      this.rebuildIndexMaps();

      const totalTypeInfos = this.classes.filter((c) => !!c.typeInfoHex).length;

      this.storageMeta = {
        ...this.storageMeta,
        dumpCsFileName: file.name,
        totalClasses: this.classes.length,
        totalMethods: Object.values(this.methods).reduce((acc, list) => acc + list.length, 0),
        totalFields: Object.values(this.fields).reduce((acc, list) => acc + list.length, 0),
        totalTypeInfos,
        loadedAt: Date.now(),
      };

      this.currentProcess = {
        pid: 1001,
        name: file.name,
        appName: `[Storage Dump] ${file.name}`,
        startTicks: Math.floor(Date.now() / 1000),
        unityVersion: 'IL2CPP ARM64 Dump',
        arch: 'arm64-v8a',
      };
    }

    if (onProgress) {
      onProgress({
        fileName: file.name,
        fileSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
        percent: 100,
        processedBytes: totalBytes,
        totalBytes,
        classesCount: parsedClasses,
        methodsCount: parsedMethods,
        fieldsCount: parsedFields,
        stage: 'Indexing complete!',
      });
    }

    return {
      classesCount: parsedClasses,
      methodsCount: parsedMethods,
      fieldsCount: parsedFields,
      assembliesCount: assemblyMap.size,
    };
  }

  public unloadIl2cppH(): void {
    this.storageMeta = {
      ...this.storageMeta,
      il2cppHFileName: null,
      baseAddressHex: '0x0',
      staticFieldsOffsetHex: '0xB8',
      typeInfoSymbolName: undefined,
      totalTypeInfos: 0,
      loadedAt: Date.now(),
    };
    for (const c of this.classes) {
      delete c.typeInfoHex;
    }
  }

  public unloadDumpCs(): void {
    this.assemblies = [];
    this.namespaces = [];
    this.classes = [];
    this.fields = {};
    this.methods = {};
    this.callRelations = [];
    this.classByNameMap.clear();
    this.classByIndexMap.clear();

    this.storageMeta = {
      ...this.storageMeta,
      dumpCsFileName: null,
      totalClasses: 0,
      totalMethods: 0,
      totalFields: 0,
      totalTypeInfos: 0,
      loadedAt: Date.now(),
    };

    this.currentProcess = {
      pid: 0,
      name: 'No dump loaded',
      appName: 'Storage Dump Engine',
      startTicks: Math.floor(Date.now() / 1000),
      unityVersion: 'Unknown',
      arch: 'arm64-v8a',
    };
  }

  public async parseIl2cppHFile(
    file: File,
    onProgress?: (progress: DumpParseProgress) => void
  ): Promise<{
    typeInfosCount: number;
    methodsLinked: number;
    baseAddressHex?: string;
    staticOffsetHex?: string;
  }> {
    const totalBytes = file.size;
    const CHUNK_SIZE = 4 * 1024 * 1024;
    let offset = 0;
    const decoder = new TextDecoder('utf-8');
    let remainder = '';

    let detectedBaseAddress: string | undefined;
    let detectedStaticOffset: string | undefined;
    let detectedTypeInfoSymbol: string | undefined;

    // Pattern 1: Targeted GameFacade TypeInfo: static const uintptr_t t_GameFacade_TypeInfo = 0xac1e768;
    const gameFacadeRegex = /static\s+const\s+uintptr_t\s+(t_GameFacade_TypeInfo|GameFacade_TypeInfo)\s*=\s*(0x[0-9a-fA-F]+);/i;
    // Pattern 2: General TypeInfo fallback: static const uintptr_t (?:t_)?..._TypeInfo = 0x...;
    const typeInfoRegex = /static\s+const\s+uintptr_t\s+(?:t_)?([a-zA-Z0-9_]+)_TypeInfo\s*=\s*(0x[0-9a-fA-F]+);/i;
    // Pattern 3: Static fields offset: #define IL2CPP_STATIC_FIELDS_OFFSET 0xb8
    const staticOffsetRegex = /(?:#define\s+IL2CPP_STATIC_FIELDS_OFFSET|static_fields\s*offset:?)\s*(0x[0-9a-fA-F]+|[0-9a-fA-F]+)/i;
    // Pattern 4: Base address: #define IL2CPP_BASE_ADDRESS 0x... or Base Address: 0x...
    const baseRegex = /(?:#define\s+IL2CPP_BASE_ADDRESS|Base\s*Address:?)\s*(0x[0-9a-fA-F]+)/i;

    const formatHex = (val: string) => {
      const clean = val.trim();
      if (clean.toLowerCase().startsWith('0x')) {
        return '0x' + clean.slice(2).toUpperCase();
      }
      return '0x' + clean.toUpperCase();
    };

    let lastYieldTime = performance.now();

    while (offset < totalBytes) {
      const slice = file.slice(offset, Math.min(offset + CHUNK_SIZE, totalBytes));
      const buffer = await slice.arrayBuffer();
      offset += slice.size;

      const chunkText = remainder + decoder.decode(buffer, { stream: offset < totalBytes });
      const lines = chunkText.split(/\r?\n/);
      remainder = offset < totalBytes ? lines.pop() || '' : '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // 1. Check for static fields offset
        if (line.includes('STATIC_FIELDS') || line.includes('static_fields')) {
          const staticMatch = line.match(staticOffsetRegex);
          if (staticMatch) {
            detectedStaticOffset = formatHex(staticMatch[1]);
          }
        }

        // 2. Check for targeted GameFacade TypeInfo
        if (line.includes('GameFacade')) {
          const gfMatch = line.match(gameFacadeRegex);
          if (gfMatch) {
            detectedBaseAddress = formatHex(gfMatch[2]);
            detectedTypeInfoSymbol = gfMatch[1];
            // If class already exists in dump.cs, link it without creating new classes
            const matchingClass = this.classByNameMap.get('gamefacade');
            if (matchingClass) {
              matchingClass.typeInfoHex = detectedBaseAddress;
            }
          }
        }

        // 3. Check for general TypeInfo fallback if not yet found
        if (line.includes('_TypeInfo') && !detectedBaseAddress) {
          const tiMatch = line.match(typeInfoRegex);
          if (tiMatch) {
            detectedBaseAddress = formatHex(tiMatch[2]);
            detectedTypeInfoSymbol = tiMatch[1] + '_TypeInfo';
            const matchingClass = this.classByNameMap.get(tiMatch[1].toLowerCase());
            if (matchingClass) {
              matchingClass.typeInfoHex = detectedBaseAddress;
            }
          }
        }

        // 4. Check for general Base Address
        if ((line.includes('BASE_ADDRESS') || line.includes('Address')) && !detectedBaseAddress) {
          const baseMatch = line.match(baseRegex);
          if (baseMatch) {
            detectedBaseAddress = formatHex(baseMatch[1]);
          }
        }
      }

      const now = performance.now();
      if (now - lastYieldTime > 20) {
        if (onProgress) {
          onProgress({
            fileName: file.name,
            fileSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
            percent: Math.min(99, Math.round((offset / totalBytes) * 100)),
            processedBytes: offset,
            totalBytes,
            classesCount: this.classes.length,
            methodsCount: Object.values(this.methods).reduce((a, b) => a + b.length, 0),
            fieldsCount: Object.values(this.fields).reduce((a, b) => a + b.length, 0),
            typeInfosCount: detectedBaseAddress ? 1 : 0,
            stage: `Scanning ${file.name} for TypeInfo & Static Offset...`,
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
        lastYieldTime = performance.now();
      }
    }

    this.storageMeta = {
      ...this.storageMeta,
      il2cppHFileName: file.name,
      baseAddressHex: detectedBaseAddress || this.storageMeta.baseAddressHex || '0x0',
      staticFieldsOffsetHex: detectedStaticOffset || this.storageMeta.staticFieldsOffsetHex || '0xB8',
      typeInfoSymbolName: detectedTypeInfoSymbol || (detectedBaseAddress ? 't_GameFacade_TypeInfo' : undefined),
      totalTypeInfos: detectedBaseAddress ? 1 : 0,
      loadedAt: Date.now(),
    };

    if (onProgress) {
      onProgress({
        fileName: file.name,
        fileSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
        percent: 100,
        processedBytes: totalBytes,
        totalBytes,
        classesCount: this.classes.length,
        methodsCount: Object.values(this.methods).reduce((a, b) => a + b.length, 0),
        fieldsCount: Object.values(this.fields).reduce((a, b) => a + b.length, 0),
        typeInfosCount: detectedBaseAddress ? 1 : 0,
        stage: 'Offsets extracted!',
      });
    }

    return {
      typeInfosCount: detectedBaseAddress ? 1 : 0,
      methodsLinked: 0,
      baseAddressHex: detectedBaseAddress,
      staticOffsetHex: detectedStaticOffset,
    };
  }

  public parseDumpCsText(
    dumpText: string,
    dumpFileName: string = 'dump.cs',
    replaceEntireEngine: boolean = true
  ): {
    classesCount: number;
    methodsCount: number;
    fieldsCount: number;
    assembliesCount: number;
  } {
    const lines = dumpText.split(/\r?\n/);
    let currentAsmName = 'Assembly-CSharp.dll';
    let currentAsmIdx = 0;
    let currentNamespace = '';
    let currentClass: ClassInfoDescriptor | null = null;
    let classCounter = 0;
    let fieldCounter = 0;
    let methodCounter = 0;

    let parsedClasses = 0;
    let parsedFields = 0;
    let parsedMethods = 0;

    const assemblyMap = new Map<string, AssemblyDescriptor>();
    const namespaceMap = new Map<string, NamespaceDescriptor>();
    const newClasses: ClassInfoDescriptor[] = [];
    const newFields: Record<number, FieldDescriptor[]> = {};
    const newMethods: Record<number, MethodDescriptor[]> = {};

    const getOrCreateAssembly = (name: string): AssemblyDescriptor => {
      if (!assemblyMap.has(name)) {
        const asm: AssemblyDescriptor = {
          index: assemblyMap.size,
          name,
          classCount: 0,
        };
        assemblyMap.set(name, asm);
      }
      return assemblyMap.get(name)!;
    };

    const getOrCreateNamespace = (asmIndex: number, nsName: string): NamespaceDescriptor => {
      const key = `${asmIndex}::${nsName}`;
      if (!namespaceMap.has(key)) {
        const ns: NamespaceDescriptor = {
          index: namespaceMap.size,
          name: nsName,
          assemblyIndex: asmIndex,
          classCount: 0,
        };
        namespaceMap.set(key, ns);
      }
      return namespaceMap.get(key)!;
    };

    getOrCreateAssembly(currentAsmName);

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine.trim();
      if (!line) continue;

      const asmMatch =
        line.match(/^\/\/\s*(?:Assembly:\s*|Image:\s*)?([a-zA-Z0-9_.-]+\.dll)/i) ||
        line.match(/^\/\/\s*([a-zA-Z0-9_.-]+\.dll)$/i);

      if (asmMatch) {
        currentAsmName = asmMatch[1].trim();
        const asm = getOrCreateAssembly(currentAsmName);
        currentAsmIdx = asm.index;
        continue;
      }

      const nsMatch = line.match(/^namespace\s+([a-zA-Z0-9_.]+)\s*\{?/);
      if (nsMatch) {
        currentNamespace = nsMatch[1].trim();
        getOrCreateNamespace(currentAsmIdx, currentNamespace);
        continue;
      }

      const classMatch = line.match(
        /^(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:abstract\s+|sealed\s+|static\s+)?(class|struct|enum|interface)\s+([a-zA-Z0-9_.<>]+)(?:\s*:\s*([a-zA-Z0-9_.<>]+))?/
      );

      if (classMatch && !line.includes('(') && !line.includes(';') && !line.includes('=')) {
        const kind = classMatch[1];
        let fullClassName = classMatch[2].trim();
        const parentName = classMatch[3]?.trim();

        let resolvedNamespace = currentNamespace;
        let cleanClassName = fullClassName;
        if (fullClassName.includes('.')) {
          const parts = fullClassName.split('.');
          cleanClassName = parts.pop()!;
          if (!resolvedNamespace) {
            resolvedNamespace = parts.join('.');
          }
        }

        const asm = getOrCreateAssembly(currentAsmName);
        asm.classCount = (asm.classCount || 0) + 1;

        const ns = getOrCreateNamespace(asm.index, resolvedNamespace);
        ns.classCount = (ns.classCount || 0) + 1;

        const classIdx = classCounter++;
        currentClass = {
          index: classIdx,
          name: cleanClassName,
          namespaceName: resolvedNamespace,
          assemblyIndex: asm.index,
          assemblyName: asm.name,
          flags: kind === 'enum' ? 0x100100 : kind === 'struct' ? 0x100008 : 0x100001,
          token: 0,
          bitfield: 1,
          parentType: parentName ? { index: 100, typeIndex: 1, name: parentName } : undefined,
        };

        newClasses.push(currentClass);
        newFields[classIdx] = [];
        newMethods[classIdx] = [];
        parsedClasses++;
        continue;
      }

      if (!currentClass) continue;

      const methodRegex =
        /(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:static\s+|virtual\s+|override\s+|abstract\s+|extern\s+|unsafe\s+)*([a-zA-Z0-9_<>.[\]&]+)\s+([a-zA-Z0-9_.<>]+)\s*\((.*?)\)\s*;?(?:\s*\/\/\s*(?:RVA:\s*)?(0x[0-9a-fA-F]+|\d+))?(?:\s*\/\/\s*typeinfo\s*(0x[0-9a-fA-F]+))?/;

      if (line.includes('(') && !line.startsWith('//')) {
        const methodMatch = line.match(methodRegex);
        if (methodMatch) {
          const returnType = methodMatch[1];
          const methodName = methodMatch[2];
          const paramsRaw = methodMatch[3];
          const rvaRaw = methodMatch[4];
          const typeInfoHex = methodMatch[5];

          const rva = rvaRaw
            ? parseInt(rvaRaw, rvaRaw.startsWith('0x') ? 16 : 10)
            : undefined;

          const baseAddr = this.storageMeta.baseAddressHex
            ? parseInt(this.storageMeta.baseAddressHex, 16)
            : 0x78f1e0b000;
          const address = rva !== undefined ? baseAddr + rva : undefined;
          const isStatic = line.includes('static ');

          const paramList: { name: string; type: string }[] = [];
          if (paramsRaw.trim()) {
            const pTokens = paramsRaw.split(',');
            for (const p of pTokens) {
              const pTrimmed = p.trim();
              const pParts = pTrimmed.split(/\s+/);
              if (pParts.length >= 2) {
                const pName = pParts[pParts.length - 1];
                const pType = pParts.slice(0, pParts.length - 1).join(' ');
                paramList.push({ name: pName, type: pType });
              }
            }
          }

          const method: MethodDescriptor = {
            index: methodCounter++,
            classIndex: currentClass.index,
            name: methodName,
            returnType,
            signature: `${line.split(';')[0].trim()}`,
            parameters: paramList,
            rva,
            address,
            typeInfoHex,
            isStatic,
          };

          if (typeInfoHex && !currentClass.typeInfoHex) {
            currentClass.typeInfoHex = typeInfoHex;
          }

          newMethods[currentClass.index].push(method);
          parsedMethods++;
          continue;
        }
      }

      const fieldRegex =
        /(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:static\s+|readonly\s+|const\s+|volatile\s+)*([a-zA-Z0-9_<>.[\]&]+)\s+([a-zA-Z0-9_<>]+)(?:\s*=\s*[^;/]+)?\s*;\s*(?:\/\/\s*(?:Offset:\s*)?(0x[0-9a-fA-F]+|\d+))?/;

      if (line.includes(';') && !line.includes('(') && !line.startsWith('//')) {
        const fieldMatch = line.match(fieldRegex);
        if (fieldMatch) {
          const typeName = fieldMatch[1];
          const fieldName = fieldMatch[2];
          const offsetRaw = fieldMatch[3];
          const offset = offsetRaw
            ? parseInt(offsetRaw, offsetRaw.startsWith('0x') ? 16 : 10)
            : undefined;

          const isStatic = line.includes('static ') || line.includes('const ');

          const field: FieldDescriptor = {
            index: fieldCounter++,
            name: fieldName,
            typeIndex: 0,
            typeName,
            offset,
            isStatic,
          };

          newFields[currentClass.index].push(field);
          parsedFields++;
          continue;
        }
      }

      if (line === '}' && currentClass) {
        currentClass = null;
      }
    }

    if (parsedClasses > 0) {
      const assembliesList = Array.from(assemblyMap.values());
      const namespacesList = Array.from(namespaceMap.values());

      if (replaceEntireEngine) {
        this.assemblies = assembliesList;
        this.namespaces = namespacesList;
        this.classes = newClasses;
        this.fields = newFields;
        this.methods = newMethods;
      } else {
        this.assemblies = [...assembliesList, ...this.assemblies];
        this.namespaces = [...namespacesList, ...this.namespaces];
        this.classes = [...newClasses, ...this.classes];
        this.fields = { ...this.fields, ...newFields };
        this.methods = { ...this.methods, ...newMethods };
      }

      this.rebuildIndexMaps();

      const totalTypeInfos = newClasses.filter((c) => !!c.typeInfoHex).length;

      this.storageMeta = {
        ...this.storageMeta,
        dumpCsFileName: dumpFileName,
        totalClasses: this.classes.length,
        totalMethods: Object.values(this.methods).reduce((acc, list) => acc + list.length, 0),
        totalFields: Object.values(this.fields).reduce((acc, list) => acc + list.length, 0),
        totalTypeInfos,
        loadedAt: Date.now(),
      };

      this.currentProcess = {
        pid: 1001,
        name: dumpFileName,
        appName: `[Storage Dump] ${dumpFileName}`,
        startTicks: Math.floor(Date.now() / 1000),
        unityVersion: 'IL2CPP ARM64 Dump',
        arch: 'arm64-v8a',
      };
    }

    return {
      classesCount: parsedClasses,
      methodsCount: parsedMethods,
      fieldsCount: parsedFields,
      assembliesCount: assemblyMap.size,
    };
  }

  public parseIl2cppHText(
    headerText: string,
    headerFileName: string = 'il2cpp.h'
  ): {
    typeInfosCount: number;
    methodsLinked: number;
    baseAddressHex?: string;
    staticOffsetHex?: string;
  } {
    const lines = headerText.split(/\r?\n/);
    let detectedBaseAddress: string | undefined;
    let detectedStaticOffset: string | undefined;
    let detectedTypeInfoSymbol: string | undefined;

    const gameFacadeRegex = /static\s+const\s+uintptr_t\s+(t_GameFacade_TypeInfo|GameFacade_TypeInfo)\s*=\s*(0x[0-9a-fA-F]+);/i;
    const typeInfoRegex = /static\s+const\s+uintptr_t\s+(?:t_)?([a-zA-Z0-9_]+)_TypeInfo\s*=\s*(0x[0-9a-fA-F]+);/i;
    const staticOffsetRegex = /(?:#define\s+IL2CPP_STATIC_FIELDS_OFFSET|static_fields\s*offset:?)\s*(0x[0-9a-fA-F]+|[0-9a-fA-F]+)/i;
    const baseRegex = /(?:#define\s+IL2CPP_BASE_ADDRESS|Base\s*Address:?)\s*(0x[0-9a-fA-F]+)/i;

    const formatHex = (val: string) => {
      const clean = val.trim();
      if (clean.toLowerCase().startsWith('0x')) {
        return '0x' + clean.slice(2).toUpperCase();
      }
      return '0x' + clean.toUpperCase();
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      if (line.includes('STATIC_FIELDS') || line.includes('static_fields')) {
        const staticMatch = line.match(staticOffsetRegex);
        if (staticMatch) {
          detectedStaticOffset = formatHex(staticMatch[1]);
        }
      }

      if (line.includes('GameFacade')) {
        const gfMatch = line.match(gameFacadeRegex);
        if (gfMatch) {
          detectedBaseAddress = formatHex(gfMatch[2]);
          detectedTypeInfoSymbol = gfMatch[1];
          const matchingClass = this.classByNameMap.get('gamefacade');
          if (matchingClass) {
            matchingClass.typeInfoHex = detectedBaseAddress;
          }
        }
      }

      if (line.includes('_TypeInfo') && !detectedBaseAddress) {
        const tiMatch = line.match(typeInfoRegex);
        if (tiMatch) {
          detectedBaseAddress = formatHex(tiMatch[2]);
          detectedTypeInfoSymbol = tiMatch[1] + '_TypeInfo';
          const matchingClass = this.classByNameMap.get(tiMatch[1].toLowerCase());
          if (matchingClass) {
            matchingClass.typeInfoHex = detectedBaseAddress;
          }
        }
      }

      if ((line.includes('BASE_ADDRESS') || line.includes('Address')) && !detectedBaseAddress) {
        const baseMatch = line.match(baseRegex);
        if (baseMatch) {
          detectedBaseAddress = formatHex(baseMatch[1]);
        }
      }
    }

    this.storageMeta = {
      ...this.storageMeta,
      il2cppHFileName: headerFileName,
      baseAddressHex: detectedBaseAddress || this.storageMeta.baseAddressHex || '0x0',
      staticFieldsOffsetHex: detectedStaticOffset || this.storageMeta.staticFieldsOffsetHex || '0xB8',
      typeInfoSymbolName: detectedTypeInfoSymbol || (detectedBaseAddress ? 't_GameFacade_TypeInfo' : undefined),
      totalTypeInfos: detectedBaseAddress ? 1 : 0,
      loadedAt: Date.now(),
    };

    return {
      typeInfosCount: detectedBaseAddress ? 1 : 0,
      methodsLinked: 0,
      baseAddressHex: detectedBaseAddress,
      staticOffsetHex: detectedStaticOffset,
    };
  }
}

export const il2cppEngine = new Il2cppEngine();
