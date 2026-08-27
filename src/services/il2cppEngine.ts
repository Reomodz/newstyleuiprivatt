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
} from '../types';
import {
  SAMPLE_PROCESSES,
  SAMPLE_ASSEMBLIES,
  SAMPLE_NAMESPACES,
  SAMPLE_CLASSES,
  SAMPLE_FIELDS,
  SAMPLE_METHODS,
  SAMPLE_INSTRUCTIONS,
  CALL_RELATIONS,
} from '../data/sampleDataset';

class Il2cppEngine {
  private currentProcess: ProcessDescriptor | null = SAMPLE_PROCESSES[0];
  private processes: ProcessDescriptor[] = [...SAMPLE_PROCESSES];
  private assemblies: AssemblyDescriptor[] = [...SAMPLE_ASSEMBLIES];
  private namespaces: NamespaceDescriptor[] = [...SAMPLE_NAMESPACES];
  private classes: ClassInfoDescriptor[] = [...SAMPLE_CLASSES];
  private fields: Record<number, FieldDescriptor[]> = { ...SAMPLE_FIELDS };
  private methods: Record<number, MethodDescriptor[]> = { ...SAMPLE_METHODS };
  private instructions: Record<string, InstructionDescriptor[]> = { ...SAMPLE_INSTRUCTIONS };

  public getCurrentProcess(): ProcessDescriptor | null {
    return this.currentProcess;
  }

  public getProcesses(): ProcessDescriptor[] {
    return this.processes;
  }

  public selectProcess(pid: number): ProcessDescriptor | null {
    const proc = this.processes.find((p) => p.pid === pid);
    if (proc) {
      this.currentProcess = proc;
    }
    return this.currentProcess;
  }

  public addCustomProcess(name: string, appName: string, pid: number): ProcessDescriptor {
    const newProc: ProcessDescriptor = {
      pid,
      name,
      appName,
      startTicks: Math.floor(Date.now() / 1000),
      unityVersion: '2022.3.x',
      arch: 'arm64-v8a',
    };
    this.processes.unshift(newProc);
    this.currentProcess = newProc;
    return newProc;
  }

  public detachProcess(): void {
    this.currentProcess = null;
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
    return this.classes.find((c) => c.index === classIndex);
  }

  public getFields(classIndex: number): FieldDescriptor[] {
    return this.fields[classIndex] || [];
  }

  public getMethods(classIndex: number): MethodDescriptor[] {
    return this.methods[classIndex] || [];
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

    // Generate fallback realistic ARM64 disassembly for any method without pre-baked instructions
    const method = this.getMethod(classIndex, methodIndex);
    const baseRva = method?.rva ?? 0x01800000 + (classIndex * 0x1000) + (methodIndex * 0x100);
    const baseVa = method?.address ?? 0x7B42000000 + baseRva;

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
        operands: 'x0, [x19, #0x18]',
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
    callSiteRva: string;
  }[] {
    return CALL_RELATIONS.filter(
      (rel) => rel.fromClass === classIndex && rel.fromMethod === methodIndex
    ).map((rel) => ({
      classIndex: rel.toClass,
      methodIndex: rel.toMethod,
      callSiteRva: rel.callSiteRva,
    }));
  }

  public getCallers(classIndex: number, methodIndex: number): {
    classIndex: number;
    methodIndex: number;
    callSiteRva: string;
  }[] {
    return CALL_RELATIONS.filter(
      (rel) => rel.toClass === classIndex && rel.toMethod === methodIndex
    ).map((rel) => ({
      classIndex: rel.fromClass,
      methodIndex: rel.fromMethod,
      callSiteRva: rel.callSiteRva,
    }));
  }

  public searchEverywhere(
    query: string,
    matchMode: SearchMatchMode,
    matchCase: boolean
  ): SymbolSearchDescriptor[] {
    if (!query.trim()) return [];

    const term = matchCase ? query.trim() : query.trim().toLowerCase();
    const results: SymbolSearchDescriptor[] = [];

    const testMatch = (value: string | undefined): boolean => {
      if (!value) return false;
      const target = matchCase ? value : value.toLowerCase();
      if (matchMode === SearchMatchMode.EXACT) {
        return target === term;
      }
      return target.includes(term);
    };

    // Search classes
    for (const cls of this.classes) {
      if (testMatch(cls.name) || testMatch(cls.namespaceName)) {
        results.push({
          id: `class_${cls.index}`,
          kind: SymbolKind.CLASS,
          classIndex: cls.index,
          memberIndex: -1,
          name: cls.name,
          assemblyName: cls.assemblyName,
          ownerName: cls.namespaceName || 'global',
          signature: `class ${cls.name}`,
        });
      }
    }

    // Search fields
    for (const [classIdxStr, fieldList] of Object.entries(this.fields)) {
      const classIdx = Number(classIdxStr);
      const cls = this.getClass(classIdx);
      if (!cls) continue;

      for (const field of fieldList) {
        if (testMatch(field.name) || testMatch(field.typeName)) {
          results.push({
            id: `field_${classIdx}_${field.index}`,
            kind: SymbolKind.FIELD,
            classIndex: classIdx,
            memberIndex: field.index,
            name: field.name,
            assemblyName: cls.assemblyName,
            ownerName: `${cls.namespaceName ? cls.namespaceName + '.' : ''}${cls.name}`,
            signature: `${field.typeName || 'var'} ${field.name}`,
            offsetLabel: field.offset !== undefined ? `0x${field.offset.toString(16)}` : undefined,
          });
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
          (method.rva && testMatch(`0x${method.rva.toString(16)}`))
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
            rvaLabel: method.rva ? `0x${method.rva.toString(16).toUpperCase()}` : undefined,
            addressLabel: method.address ? `0x${method.address.toString(16).toUpperCase()}` : undefined,
          });
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
      address: rootMethod.address || 0x7B4282E400,
      addressLabel: rootMethod.address
        ? `0x${rootMethod.address.toString(16).toUpperCase()}`
        : '0x7B4282E400',
      rva: rootMethod.rva,
      rvaLabel: rootMethod.rva ? `0x${rootMethod.rva.toString(16).toUpperCase()}` : undefined,
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
          address: targetMethod.address || 0x7B42000000,
          addressLabel: targetMethod.address
            ? `0x${targetMethod.address.toString(16).toUpperCase()}`
            : '0x7B42000000',
          rva: targetMethod.rva,
          rvaLabel: targetMethod.rva
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

  public generateDumpCs(assemblyFilterIndex?: number): string {
    const lines: string[] = [
      '// ==========================================================================',
      `// Dump generated by IL2CppManager for: ${this.currentProcess?.appName || 'Unity IL2CPP'}`,
      `// Architecture: ${this.currentProcess?.arch || 'arm64-v8a'} | Unity Version: ${this.currentProcess?.unityVersion || '2022.3'}`,
      '// ==========================================================================',
      '',
    ];

    const targetAssemblies =
      assemblyFilterIndex !== undefined
        ? this.assemblies.filter((a) => a.index === assemblyFilterIndex)
        : this.assemblies;

    for (const asm of targetAssemblies) {
      lines.push(`// Assembly: ${asm.name}`);
      lines.push('');

      const asmClasses = this.classes.filter((c) => c.assemblyIndex === asm.index);
      for (const cls of asmClasses) {
        if (cls.namespaceName) {
          lines.push(`namespace ${cls.namespaceName} {`);
        }

        const indent = cls.namespaceName ? '\t' : '';
        lines.push(`${indent}// TypeDefIndex: ${cls.index} | Flags: 0x${cls.flags.toString(16)} | Token: 0x${cls.token.toString(16)}`);
        lines.push(`${indent}public class ${cls.name}${cls.parentType?.name ? ` : ${cls.parentType.name}` : ''} {`);

        // Fields
        const classFields = this.fields[cls.index] || [];
        if (classFields.length > 0) {
          lines.push(`${indent}\t// Fields`);
          for (const f of classFields) {
            const offsetStr = f.offset !== undefined ? `0x${f.offset.toString(16).toUpperCase()}` : '0x0';
            lines.push(
              `${indent}\tpublic ${f.isStatic ? 'static ' : ''}${f.typeName || 'object'} ${f.name}; // ${offsetStr}`
            );
          }
          lines.push('');
        }

        // Methods
        const classMethods = this.methods[cls.index] || [];
        if (classMethods.length > 0) {
          lines.push(`${indent}\t// Methods`);
          for (const m of classMethods) {
            const rvaStr = m.rva ? `0x${m.rva.toString(16).toUpperCase()}` : '0x0';
            const vaStr = m.address ? `0x${m.address.toString(16).toUpperCase()}` : '0x0';
            lines.push(`${indent}\t${m.signature || `public void ${m.name}()`} { } // RVA: ${rvaStr} | VA: ${vaStr}`);
          }
        }

        lines.push(`${indent}}`);
        if (cls.namespaceName) {
          lines.push('}');
        }
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  public parseDumpCsText(dumpText: string, dumpFileName: string = 'dump.cs'): {
    classesCount: number;
    methodsCount: number;
    fieldsCount: number;
  } {
    const lines = dumpText.split(/\r?\n/);
    let currentAsmName = 'StorageAssembly-CSharp.dll';
    let currentAsmIdx = 900;
    let currentNamespace = '';
    let currentClass: ClassInfoDescriptor | null = null;
    let classCounter = 5000;
    let fieldCounter = 20000;
    let methodCounter = 50000;

    let parsedClasses = 0;
    let parsedFields = 0;
    let parsedMethods = 0;

    const newAssemblies: AssemblyDescriptor[] = [
      { index: currentAsmIdx, name: currentAsmName, classCount: 0 },
    ];
    const newNamespaces: NamespaceDescriptor[] = [];
    const newClasses: ClassInfoDescriptor[] = [];
    const newFields: Record<number, FieldDescriptor[]> = {};
    const newMethods: Record<number, MethodDescriptor[]> = {};

    let pendingRva: number | undefined = undefined;
    let pendingVa: number | undefined = undefined;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Assembly header: // Assembly: Assembly-CSharp.dll
      const asmMatch = line.match(/^\/\/\s*Assembly:\s*(.+)$/i);
      if (asmMatch) {
        currentAsmName = asmMatch[1].trim();
        currentAsmIdx++;
        if (!newAssemblies.some((a) => a.name === currentAsmName)) {
          newAssemblies.push({ index: currentAsmIdx, name: currentAsmName, classCount: 0 });
        }
        continue;
      }

      // Namespace line: namespace UnityEngine {
      const nsMatch = line.match(/^namespace\s+([a-zA-Z0-9_.]+)\s*\{?/);
      if (nsMatch) {
        currentNamespace = nsMatch[1].trim();
        if (!newNamespaces.some((n) => n.name === currentNamespace && n.assemblyIndex === currentAsmIdx)) {
          newNamespaces.push({
            index: newNamespaces.length + 100,
            name: currentNamespace,
            assemblyIndex: currentAsmIdx,
          });
        }
        continue;
      }

      // Class line: public class PlayerController : MonoBehaviour
      const classMatch = line.match(/public\s+(?:abstract\s+|sealed\s+|static\s+)?class\s+([a-zA-Z0-9_<>]+)(?:\s*:\s*([a-zA-Z0-9_.]+))?/);
      if (classMatch) {
        const className = classMatch[1].trim();
        const parentName = classMatch[2]?.trim();
        const classIdx = classCounter++;
        currentClass = {
          index: classIdx,
          name: className,
          namespaceName: currentNamespace,
          assemblyIndex: currentAsmIdx,
          assemblyName: currentAsmName,
          flags: 0x100001,
          token: 0x2000000 + classIdx,
          bitfield: 0,
          parentType: parentName ? { index: 0, typeIndex: 0, name: parentName } : undefined,
        };
        newClasses.push(currentClass);
        newFields[classIdx] = [];
        newMethods[classIdx] = [];
        parsedClasses++;
        continue;
      }

      if (!currentClass) continue;

      // Field line with offset comment:
      // e.g. public System.Single moveSpeed; // 0x18
      // or // Offset: 0x18
      const fieldMatch = line.match(/public\s+(?:static\s+)?(?:readonly\s+)?([a-zA-Z0-9_<>.[\]]+)\s+([a-zA-Z0-9_]+)\s*;\s*(?:\/\/\s*(?:Offset:\s*)?(0x[0-9a-fA-F]+|\d+))?/);
      if (fieldMatch && !line.includes('(')) {
        const typeName = fieldMatch[1];
        const fieldName = fieldMatch[2];
        const rawOffset = fieldMatch[3];
        const offset = rawOffset ? parseInt(rawOffset, rawOffset.startsWith('0x') ? 16 : 10) : undefined;
        const isStatic = line.includes('static ');

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

      // Method header comments: // RVA: 0x1A4000 | VA: 0x76B41A4000
      const rvaCommentMatch = line.match(/\/\/\s*RVA:\s*(0x[0-9a-fA-F]+)(?:\s*\|\s*VA:\s*(0x[0-9a-fA-F]+))?/i);
      if (rvaCommentMatch) {
        pendingRva = parseInt(rvaCommentMatch[1], 16);
        if (rvaCommentMatch[2]) {
          pendingVa = parseInt(rvaCommentMatch[2], 16);
        }
      }

      // Method line: public void Update() { } // RVA: 0x1A4000 | VA: 0x76B41A4000
      const methodMatch = line.match(/public\s+(?:static\s+|virtual\s+|override\s+|abstract\s+)*([a-zA-Z0-9_<>.[\]]+)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*(?:\{|\;)?(?:\s*\/\/\s*RVA:\s*(0x[0-9a-fA-F]+))?/);
      if (methodMatch) {
        const returnType = methodMatch[1];
        const methodName = methodMatch[2];
        const paramsRaw = methodMatch[3];
        const inlineRva = methodMatch[4] ? parseInt(methodMatch[4], 16) : undefined;
        const finalRva = inlineRva ?? pendingRva ?? (0x100000 + methodCounter * 4);
        const finalVa = pendingVa ?? (0x76B4000000 + finalRva);

        const method: MethodDescriptor = {
          index: methodCounter++,
          classIndex: currentClass.index,
          name: methodName,
          returnType,
          signature: `public ${returnType} ${methodName}(${paramsRaw})`,
          rva: finalRva,
          address: finalVa,
          isStatic: line.includes('static '),
        };
        newMethods[currentClass.index].push(method);
        parsedMethods++;
        pendingRva = undefined;
        pendingVa = undefined;
        continue;
      }

      if (line === '}' && currentClass) {
        // End of class
      }
    }

    if (parsedClasses > 0) {
      // Switch or merge with dataset
      this.assemblies = [...newAssemblies, ...this.assemblies];
      this.namespaces = [...newNamespaces, ...this.namespaces];
      this.classes = [...newClasses, ...this.classes];
      this.fields = { ...this.fields, ...newFields };
      this.methods = { ...this.methods, ...newMethods };

      // Set storage fake process descriptor
      this.currentProcess = {
        pid: 9999,
        name: dumpFileName,
        appName: `[Storage] ${dumpFileName}`,
        startTicks: Math.floor(Date.now() / 1000),
        unityVersion: 'Parsed from Storage dump.cs',
        arch: 'Arm64 / IL2CPP Storage Dump',
      };
    }

    return {
      classesCount: parsedClasses,
      methodsCount: parsedMethods,
      fieldsCount: parsedFields,
    };
  }
}

export const il2cppEngine = new Il2cppEngine();

