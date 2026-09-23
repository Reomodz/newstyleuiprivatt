import {
  AssemblyDescriptor,
  NamespaceDescriptor,
  ClassInfoDescriptor,
  FieldDescriptor,
  MethodDescriptor,
  DumpParseProgress,
} from '../types';

export interface WorkerParseDumpRequest {
  type: 'PARSE_DUMP_CS';
  file: File;
  baseAddressHex?: string;
  classCounterStart?: number;
}

export interface WorkerProgressMessage {
  type: 'PROGRESS';
  progress: DumpParseProgress;
}

export interface WorkerSuccessMessage {
  type: 'SUCCESS';
  data: {
    assemblies: AssemblyDescriptor[];
    namespaces: NamespaceDescriptor[];
    classes: ClassInfoDescriptor[];
    fields: Record<number, FieldDescriptor[]>;
    methods: Record<number, MethodDescriptor[]>;
    classesCount: number;
    methodsCount: number;
    fieldsCount: number;
    assembliesCount: number;
    totalTypeInfos: number;
    fileName: string;
    totalBytes: number;
  };
}

export interface WorkerErrorMessage {
  type: 'ERROR';
  error: string;
}

export type WorkerOutgoingMessage =
  | WorkerProgressMessage
  | WorkerSuccessMessage
  | WorkerErrorMessage;

// Global scope in a Web Worker
const ctx = self as unknown as {
  onmessage: ((e: MessageEvent<WorkerParseDumpRequest>) => void) | null;
  postMessage: (message: WorkerOutgoingMessage) => void;
};

ctx.onmessage = async (e: MessageEvent<WorkerParseDumpRequest>) => {
  const data = e.data;
  if (!data || data.type !== 'PARSE_DUMP_CS') return;

  const { file, baseAddressHex, classCounterStart = 0 } = data;

  try {
    const totalBytes = file.size;
    // 4MB chunk size in worker for optimal I/O and zero UI lag
    const CHUNK_SIZE = 4 * 1024 * 1024;
    let offset = 0;
    const decoder = new TextDecoder('utf-8');
    let remainder = '';

    let currentAsmName = 'Assembly-CSharp.dll';
    let currentAsmIdx = 0;
    let currentNamespace = '';
    let currentClass: ClassInfoDescriptor | null = null;
    let classCounter = classCounterStart;
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

    const baseAddr = baseAddressHex
      ? parseInt(baseAddressHex, 16)
      : 0x78f1e0b000;

    // Optimized precompiled regex patterns
    const asmRegex1 = /^\/\/\s*(?:Assembly:\s*|Image:\s*|Image\s*\d+:\s*)?([a-zA-Z0-9_.-]+(?:\.dll)?)/i;
    const asmRegex2 = /^\/\/\s*([a-zA-Z0-9_.-]+(?:\.dll)?)$/i;
    const nsCommentRegex = /^\/\/\s*Namespace:\s*([a-zA-Z0-9_.]*)/i;
    const nsRegex = /^namespace\s+([a-zA-Z0-9_.]+)\s*\{?/;
    const classRegex = /^(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:abstract\s+|sealed\s+|static\s+)?(class|struct|enum|interface)\s+([a-zA-Z0-9_.<>]+)(?:\s*:\s*([a-zA-Z0-9_.<>]+))?/;
    const methodRegex = /(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:static\s+|virtual\s+|override\s+|abstract\s+|extern\s+|unsafe\s+)*([a-zA-Z0-9_<>.[\]&*?]+)\s+([a-zA-Z0-9_.<>]+)\s*\((.*?)\)\s*;?(?:\s*\/\/\s*(?:RVA:\s*)?(0x[0-9a-fA-F]+|\d+))?(?:\s*\/\/\s*typeinfo\s*(0x[0-9a-fA-F]+))?/;
    const fieldRegex = /(?:\[.*?\]\s*)*(?:public|private|internal|protected)?\s*(?:static\s+|readonly\s+|const\s+|volatile\s+|unsafe\s+|fixed\s+)*([a-zA-Z0-9_<>.[\]&*?]+)\s+([a-zA-Z0-9_<>]+)(?:\s*=\s*[^;/]+)?\s*;\s*(?:\/\/\s*(?:Offset:\s*)?(0x[0-9a-fA-F]+|\d+))?/;

    let lastProgressTime = performance.now();

    while (offset < totalBytes) {
      const slice = file.slice(offset, Math.min(offset + CHUNK_SIZE, totalBytes));
      const buffer = await slice.arrayBuffer();
      offset += slice.size;

      let chunkText = remainder + decoder.decode(buffer, { stream: offset < totalBytes });
      if (offset === slice.size) {
        // Strip UTF-8 BOM if present at the start of the file
        chunkText = chunkText.replace(/^\uFEFF/, '');
      }

      const lines = chunkText.split(/\r?\n/);
      // Keep last incomplete line for next iteration if not EOF
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

        // Namespace declaration
        if (line.startsWith('namespace ')) {
          const nsMatch = line.match(nsRegex);
          if (nsMatch) {
            currentNamespace = nsMatch[1].trim();
            getOrCreateNamespace(currentAsmIdx, currentNamespace);
            continue;
          }
        }

        // Strip trailing comment for class structure checks
        const lineNoComment = line.split('//')[0].trim();

        // Class / Struct / Enum / Interface
        if (
          !lineNoComment.includes('(') &&
          !lineNoComment.includes(';') &&
          !lineNoComment.includes('=') &&
          (lineNoComment.includes('class ') ||
            lineNoComment.includes('struct ') ||
            lineNoComment.includes('enum ') ||
            lineNoComment.includes('interface '))
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

        // Method parsing
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

        // Field parsing
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

      // Send progress to main thread every 40ms to keep UI snappy without queue flood
      const now = performance.now();
      if (now - lastProgressTime > 40 || offset >= totalBytes) {
        ctx.postMessage({
          type: 'PROGRESS',
          progress: {
            fileName: file.name,
            fileSizeMb: Number((totalBytes / (1024 * 1024)).toFixed(2)),
            percent: Math.min(99, Math.round((offset / totalBytes) * 100)),
            processedBytes: offset,
            totalBytes,
            classesCount: parsedClasses,
            methodsCount: parsedMethods,
            fieldsCount: parsedFields,
            stage: `⚡ [Web Worker] Streaming ${file.name} (${Number((offset / (1024 * 1024)).toFixed(1))} MB / ${Number((totalBytes / (1024 * 1024)).toFixed(1))} MB)...`,
          },
        } as WorkerProgressMessage);
        lastProgressTime = now;
      }
    }

    const totalTypeInfos = newClasses.filter((c) => !!c.typeInfoHex).length;
    const assembliesList = Array.from(assemblyMap.values());
    const namespacesList = Array.from(namespaceMap.values());

    ctx.postMessage({
      type: 'SUCCESS',
      data: {
        assemblies: assembliesList,
        namespaces: namespacesList,
        classes: newClasses,
        fields: newFields,
        methods: newMethods,
        classesCount: parsedClasses,
        methodsCount: parsedMethods,
        fieldsCount: parsedFields,
        assembliesCount: assembliesList.length,
        totalTypeInfos,
        fileName: file.name,
        totalBytes,
      },
    } as WorkerSuccessMessage);
  } catch (err) {
    ctx.postMessage({
      type: 'ERROR',
      error: err instanceof Error ? err.message : String(err),
    } as WorkerErrorMessage);
  }
};
