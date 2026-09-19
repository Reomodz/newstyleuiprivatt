import {
  ProcessDescriptor,
  AssemblyDescriptor,
  NamespaceDescriptor,
  ClassInfoDescriptor,
  FieldDescriptor,
  MethodDescriptor,
  InstructionDescriptor,
  InstructionFlowKind,
  SymbolSearchDescriptor,
  SymbolKind,
  SearchMatchMode,
  CallGraphNodeViewData,
  CallGraphEdgeViewData,
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
  private instructions: Record<string, InstructionDescriptor[]> = {};
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

  public getInstructions(classIndex: number, methodIndex: number): InstructionDescriptor[] {
    const key = `${classIndex}_${methodIndex}`;
    if (this.instructions[key]) {
      return this.instructions[key];
    }

    // Realistic ARM64 disassembly generation based on method RVA and base address
    const method = this.getMethod(classIndex, methodIndex);
    const baseRva = method?.rva ?? 0x01800000 + classIndex * 0x1000 + methodIndex * 0x100;
    const baseAddr = this.storageMeta.baseAddressHex ? parseInt(this.storageMeta.baseAddressHex, 16) : 0x78f1e0b000;
    const baseVa = method?.address ?? (baseAddr + baseRva);

    const generated: InstructionDescriptor[] = [
      {
        address: baseVa,
        rva: baseRva,
        bytes: 'FD 7B BE A9',
        mnemonic: 'stp',
        operands: 'x29, x30, [sp, #-32]!',
        flowKind: InstructionFlowKind.NONE,
      },
      {
        address: baseVa + 4,
        rva: baseRva + 4,
        bytes: 'FD 03 00 91',
        mnemonic: 'mov',
        operands: 'x29, sp',
        flowKind: InstructionFlowKind.NONE,
      },
      {
        address: baseVa + 8,
        rva: baseRva + 8,
        bytes: 'F3 03 00 AA',
        mnemonic: 'mov',
        operands: 'x19, x0',
        flowKind: InstructionFlowKind.NONE,
      },
      {
        address: baseVa + 12,
        rva: baseRva + 12,
        bytes: '60 02 40 F9',
        mnemonic: 'ldr',
        operands: 'x0, [x19, #0x20]',
        flowKind: InstructionFlowKind.NONE,
      },
      {
        address: baseVa + 16,
        rva: baseRva + 16,
        bytes: '1F 00 00 F1',
        mnemonic: 'cmp',
        operands: 'x0, #0',
        flowKind: InstructionFlowKind.NONE,
      },
      {
        address: baseVa + 20,
        rva: baseRva + 20,
        bytes: '20 00 00 54',
        mnemonic: 'b.ne',
        operands: `0x${(baseRva + 28).toString(16).toUpperCase()}`,
        flowKind: InstructionFlowKind.DIRECT_BRANCH,
        targetInstructionIndex: 7,
      },
      {
        address: baseVa + 24,
        rva: baseRva + 24,
        bytes: 'E0 03 13 AA',
        mnemonic: 'mov',
        operands: 'x0, x19',
        flowKind: InstructionFlowKind.NONE,
      },
      {
        address: baseVa + 28,
        rva: baseRva + 28,
        bytes: 'FD 7B C2 A8',
        mnemonic: 'ldp',
        operands: 'x29, x30, [sp], #32',
        flowKind: InstructionFlowKind.NONE,
      },
      {
        address: baseVa + 32,
        rva: baseRva + 32,
        bytes: 'C0 03 5F D6',
        mnemonic: 'ret',
        operands: '',
        flowKind: InstructionFlowKind.NONE,
      },
    ];

    this.instructions[key] = generated;
    return generated;
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

  public buildCallGraph(
    rootClassIndex: number,
    rootMethodIndex: number
  ): {
    nodes: CallGraphNodeViewData[];
    edges: CallGraphEdgeViewData[];
  } {
    const rootMethod = this.getMethod(rootClassIndex, rootMethodIndex);
    const rootClass = this.getClass(rootClassIndex);
    const rootId = `node_${rootClassIndex}_${rootMethodIndex}`;

    if (!rootMethod || !rootClass) {
      return { nodes: [], edges: [] };
    }

    const rootCallers = this.getCallers(rootClassIndex, rootMethodIndex);
    const rootCalls = this.getCalls(rootClassIndex, rootMethodIndex);

    const rootNode: CallGraphNodeViewData = {
      id: rootId,
      classIndex: rootClassIndex,
      methodIndex: rootMethodIndex,
      name: rootMethod.name,
      ownerName: `${rootClass.namespaceName ? rootClass.namespaceName + '.' : ''}${rootClass.name}`,
      signature: rootMethod.signature || rootMethod.name,
      address: rootMethod.address || 0x78f1e0b000,
      addressLabel: rootMethod.address
        ? `0x${rootMethod.address.toString(16).toUpperCase()}`
        : '0x78F1E0B000',
      rva: rootMethod.rva,
      rvaLabel: rootMethod.rva !== undefined ? `0x${rootMethod.rva.toString(16).toUpperCase()}` : undefined,
      isRoot: true,
      canOpen: true,
      depth: 0,
      callerCount: rootCallers.length,
      callCount: rootCalls.length,
      callsExpanded: true,
      callersExpanded: false,
    };

    const nodes: CallGraphNodeViewData[] = [rootNode];
    const edges: CallGraphEdgeViewData[] = [];

    // Automatically expand direct calls for the root
    for (const call of rootCalls) {
      const targetMethod = this.getMethod(call.classIndex, call.methodIndex);
      const targetClass = this.getClass(call.classIndex);
      if (!targetMethod || !targetClass) continue;

      const targetId = `node_${call.classIndex}_${call.methodIndex}`;
      const targetCallers = this.getCallers(call.classIndex, call.methodIndex);
      const targetCalls = this.getCalls(call.classIndex, call.methodIndex);

      if (!nodes.some((n) => n.id === targetId)) {
        nodes.push({
          id: targetId,
          classIndex: call.classIndex,
          methodIndex: call.methodIndex,
          name: targetMethod.name,
          ownerName: `${targetClass.namespaceName ? targetClass.namespaceName + '.' : ''}${targetClass.name}`,
          signature: targetMethod.signature || targetMethod.name,
          address: targetMethod.address || 0x78f1e0b000,
          addressLabel: targetMethod.address
            ? `0x${targetMethod.address.toString(16).toUpperCase()}`
            : '0x78F1E0B000',
          rva: targetMethod.rva,
          rvaLabel: targetMethod.rva !== undefined
            ? `0x${targetMethod.rva.toString(16).toUpperCase()}`
            : undefined,
          isRoot: false,
          canOpen: true,
          depth: 1,
          callerCount: targetCallers.length,
          callCount: targetCalls.length,
          callsExpanded: false,
          callersExpanded: false,
        });
      }

      edges.push({
        id: `edge_${rootId}_${targetId}`,
        fromNodeId: rootId,
        toNodeId: targetId,
        callSiteRva: call.callSiteRva,
      });
    }

    return { nodes, edges };
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
    const CHUNK_SIZE = 4 * 1024 * 1024; // 4 MB chunks
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
    const asmRegex1 = /^\/\/\s*(?:Assembly:\s*|Image:\s*|Image\s*\d+:\s*)?([a-zA-Z0-9_.-]+\.dll)/i;
    const asmRegex2 = /^\/\/\s*([a-zA-Z0-9_.-]+\.dll)$/i;
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

      const chunkText = remainder + decoder.decode(buffer, { stream: offset < totalBytes });
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
            currentAsmName = asmMatch[1].trim();
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

        // Class / Struct / Enum / Interface
        if (
          !line.includes('(') &&
          !line.includes(';') &&
          !line.includes('=') &&
          (line.includes('class ') || line.includes('struct ') || line.includes('enum ') || line.includes('interface '))
        ) {
          const classMatch = line.match(classRegex);
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
    let typeInfosCount = 0;
    let methodsLinked = 0;
    let currentImageName = 'Assembly-CSharp.dll';

    const baseRegex = /(?:Base\s*Address:?|IL2CPP_BASE_ADDRESS)\s*(0x[0-9a-fA-F]+)/i;
    const staticOffsetRegex = /(?:static_fields\s*offset:?|IL2CPP_STATIC_FIELDS_OFFSET)\s*(0x[0-9a-fA-F]+)/i;
    const imgRegex = /^\/\/\s*Image:\s*([a-zA-Z0-9_.-]+\.dll)/i;
    const typeInfoRegex = /static\s+const\s+uintptr_t\s+(?:t_)?([a-zA-Z0-9_]+)_TypeInfo\s*=\s*(0x[0-9a-fA-F]+);/;
    const methodPtrRegex = /static\s+const\s+uintptr_t\s+m_([a-zA-Z0-9_]+)_([a-zA-Z0-9_]+)\s*=\s*(0x[0-9a-fA-F]+);(?:\s*\/\/\s*typeinfo\s*(0x[0-9a-fA-F]+))?/;

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

        if (line.startsWith('//')) {
          const imgMatch = line.match(imgRegex);
          if (imgMatch) {
            currentImageName = imgMatch[1].trim();
            continue;
          }
        }

        // Base address & Static fields offset
        if (line.includes('Address') || line.includes('ADDRESS')) {
          const baseMatch = line.match(baseRegex);
          if (baseMatch) {
            detectedBaseAddress = baseMatch[1].toUpperCase();
          }
        }
        if (line.includes('static_fields') || line.includes('STATIC_FIELDS')) {
          const staticOffsetMatch = line.match(staticOffsetRegex);
          if (staticOffsetMatch) {
            detectedStaticOffset = staticOffsetMatch[1].toUpperCase();
          }
        }

        // TypeInfo pointer: static const uintptr_t t_..._TypeInfo = 0x...;
        if (line.includes('_TypeInfo')) {
          const typeInfoMatch = line.match(typeInfoRegex);
          if (typeInfoMatch) {
            const typeName = typeInfoMatch[1];
            const typeInfoHex = typeInfoMatch[2];
            typeInfosCount++;

            // Fast O(1) class lookup
            const matchingClass = this.classByNameMap.get(typeName.toLowerCase());
            if (matchingClass) {
              matchingClass.typeInfoHex = typeInfoHex;
            } else {
              let asm = this.assemblies.find((a) => a.name === currentImageName);
              if (!asm) {
                asm = { index: this.assemblies.length, name: currentImageName, classCount: 0 };
                this.assemblies.push(asm);
              }
              asm.classCount = (asm.classCount || 0) + 1;

              const newClass: ClassInfoDescriptor = {
                index: this.classes.length,
                name: typeName,
                namespaceName: '',
                assemblyIndex: asm.index,
                assemblyName: asm.name,
                flags: 0x100001,
                token: 0x02000000 + this.classes.length,
                bitfield: 1,
                typeInfoHex,
              };
              this.classes.push(newClass);
              this.classByNameMap.set(typeName.toLowerCase(), newClass);
              this.classByIndexMap.set(newClass.index, newClass);
              this.fields[newClass.index] = [];
              this.methods[newClass.index] = [];
            }
            continue;
          }
        }

        // Method RVA & TypeInfo: static const uintptr_t m_Class_Method = 0x...;
        if (line.includes('m_') && line.includes('uintptr_t')) {
          const methodPtrMatch = line.match(methodPtrRegex);
          if (methodPtrMatch) {
            const className = methodPtrMatch[1];
            const methodName = methodPtrMatch[2];
            const rva = parseInt(methodPtrMatch[3], 16);
            const typeInfoHex = methodPtrMatch[4];
            methodsLinked++;

            const matchingClass = this.classByNameMap.get(className.toLowerCase());
            if (matchingClass) {
              const classMethods = this.methods[matchingClass.index] || [];
              const existingMethod = classMethods.find((m) => m.name === methodName);
              if (existingMethod) {
                existingMethod.rva = rva;
                if (typeInfoHex) existingMethod.typeInfoHex = typeInfoHex;
              } else {
                const baseAddr = detectedBaseAddress
                  ? parseInt(detectedBaseAddress, 16)
                  : (this.storageMeta.baseAddressHex ? parseInt(this.storageMeta.baseAddressHex, 16) : 0x78f1e0b000);
                const newM: MethodDescriptor = {
                  index: classMethods.length,
                  classIndex: matchingClass.index,
                  name: methodName,
                  signature: `public void ${methodName}()`,
                  rva,
                  address: baseAddr + rva,
                  typeInfoHex,
                };
                classMethods.push(newM);
                this.methods[matchingClass.index] = classMethods;
              }
            }
          }
        }
      }

      // Yield every 20ms to keep 60fps responsiveness
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
            typeInfosCount,
            stage: `Streaming ${file.name} (${Number((offset / (1024 * 1024)).toFixed(1))} MB / ${Number((totalBytes / (1024 * 1024)).toFixed(1))} MB)...`,
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 0));
        lastYieldTime = performance.now();
      }
    }

    this.rebuildIndexMaps();

    this.storageMeta = {
      ...this.storageMeta,
      il2cppHFileName: file.name,
      baseAddressHex: detectedBaseAddress || this.storageMeta.baseAddressHex,
      staticFieldsOffsetHex: detectedStaticOffset || this.storageMeta.staticFieldsOffsetHex,
      totalTypeInfos: this.classes.filter((c) => !!c.typeInfoHex).length,
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
        typeInfosCount,
        stage: 'Linking complete!',
      });
    }

    return {
      typeInfosCount,
      methodsLinked,
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
    let typeInfosCount = 0;
    let methodsLinked = 0;

    let currentImageName = 'Assembly-CSharp.dll';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const baseMatch = line.match(/(?:Base\s*Address:?|IL2CPP_BASE_ADDRESS)\s*(0x[0-9a-fA-F]+)/i);
      if (baseMatch) {
        detectedBaseAddress = baseMatch[1].toUpperCase();
      }

      const staticOffsetMatch = line.match(
        /(?:static_fields\s*offset:?|IL2CPP_STATIC_FIELDS_OFFSET)\s*(0x[0-9a-fA-F]+)/i
      );
      if (staticOffsetMatch) {
        detectedStaticOffset = staticOffsetMatch[1].toUpperCase();
      }

      const imageMatch = line.match(/^\/\/\s*Image:\s*([a-zA-Z0-9_.-]+\.dll)/i);
      if (imageMatch) {
        currentImageName = imageMatch[1].trim();
        continue;
      }

      const typeInfoMatch = line.match(
        /static\s+const\s+uintptr_t\s+(?:t_)?([a-zA-Z0-9_]+)_TypeInfo\s*=\s*(0x[0-9a-fA-F]+);/
      );
      if (typeInfoMatch) {
        const typeName = typeInfoMatch[1];
        const typeInfoHex = typeInfoMatch[2];
        typeInfosCount++;

        const matchingClass = this.classByNameMap.get(typeName.toLowerCase());
        if (matchingClass) {
          matchingClass.typeInfoHex = typeInfoHex;
        } else {
          let asm = this.assemblies.find((a) => a.name === currentImageName);
          if (!asm) {
            asm = { index: this.assemblies.length, name: currentImageName, classCount: 0 };
            this.assemblies.push(asm);
          }
          asm.classCount = (asm.classCount || 0) + 1;

          const newClass: ClassInfoDescriptor = {
            index: this.classes.length,
            name: typeName,
            namespaceName: '',
            assemblyIndex: asm.index,
            assemblyName: asm.name,
            flags: 0x100001,
            token: 0x02000000 + this.classes.length,
            bitfield: 1,
            typeInfoHex,
          };
          this.classes.push(newClass);
          this.classByNameMap.set(typeName.toLowerCase(), newClass);
          this.classByIndexMap.set(newClass.index, newClass);
          this.fields[newClass.index] = [];
          this.methods[newClass.index] = [];
        }
        continue;
      }

      const methodPtrMatch = line.match(
        /static\s+const\s+uintptr_t\s+m_([a-zA-Z0-9_]+)_([a-zA-Z0-9_]+)\s*=\s*(0x[0-9a-fA-F]+);(?:\s*\/\/\s*typeinfo\s*(0x[0-9a-fA-F]+))?/
      );
      if (methodPtrMatch) {
        const className = methodPtrMatch[1];
        const methodName = methodPtrMatch[2];
        const rva = parseInt(methodPtrMatch[3], 16);
        const typeInfoHex = methodPtrMatch[4];
        methodsLinked++;

        const matchingClass = this.classByNameMap.get(className.toLowerCase());
        if (matchingClass) {
          const classMethods = this.methods[matchingClass.index] || [];
          const existingMethod = classMethods.find((m) => m.name === methodName);
          if (existingMethod) {
            existingMethod.rva = rva;
            if (typeInfoHex) existingMethod.typeInfoHex = typeInfoHex;
          } else {
            const baseAddr = detectedBaseAddress ? parseInt(detectedBaseAddress, 16) : 0x78f1e0b000;
            const newM: MethodDescriptor = {
              index: classMethods.length,
              classIndex: matchingClass.index,
              name: methodName,
              signature: `public void ${methodName}()`,
              rva,
              address: baseAddr + rva,
              typeInfoHex,
            };
            classMethods.push(newM);
            this.methods[matchingClass.index] = classMethods;
          }
        }
      }
    }

    this.rebuildIndexMaps();

    this.storageMeta = {
      ...this.storageMeta,
      il2cppHFileName: headerFileName,
      baseAddressHex: detectedBaseAddress || this.storageMeta.baseAddressHex,
      staticFieldsOffsetHex: detectedStaticOffset || this.storageMeta.staticFieldsOffsetHex,
      totalTypeInfos: this.classes.filter((c) => !!c.typeInfoHex).length,
      loadedAt: Date.now(),
    };

    return {
      typeInfosCount,
      methodsLinked,
      baseAddressHex: detectedBaseAddress,
      staticOffsetHex: detectedStaticOffset,
    };
  }
}

export const il2cppEngine = new Il2cppEngine();
