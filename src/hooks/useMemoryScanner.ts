import { useState, useCallback } from 'react';
import { ScanHistoryRecord, TargetSourceMode, ProcessDescriptor, WatchlistProfile, WatchlistTargetItem } from '../types';
import { il2cppEngine } from '../services/il2cppEngine';

export function useMemoryScanner(initialHistory: ScanHistoryRecord[] = []) {
  // Scan History
  const [scanHistory, setScanHistory] = useState<ScanHistoryRecord[]>(() => {
    const vKey = 'il2cpp_scan_history_v2';
    const hasV2 = localStorage.getItem(vKey);
    if (hasV2) {
      const saved = localStorage.getItem('il2cpp_scan_history');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // fall through
        }
      }
    }
    localStorage.setItem(vKey, 'true');
    localStorage.setItem('il2cpp_scan_history', JSON.stringify(initialHistory));
    return initialHistory;
  });

  const saveHistory = useCallback((updatedHistory: ScanHistoryRecord[]) => {
    setScanHistory(updatedHistory);
    localStorage.setItem('il2cpp_scan_history', JSON.stringify(updatedHistory));
  }, []);

  // Live Scanning & Progress Logs State
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error'; time: string }>>([
    { text: 'IL2CPP Scanner initialized and ready.', type: 'info', time: '00:00:00' },
  ]);

  const handleScanProfile = useCallback(
    async (
      activeProfile: WatchlistProfile | undefined,
      sourceMode: TargetSourceMode,
      currentProcess: ProcessDescriptor | null,
      loadedStorageFileName: string | null,
      profiles: WatchlistProfile[],
      saveProfiles: (updated: WatchlistProfile[]) => void,
      showToast: (msg: string) => void
    ) => {
      if (!activeProfile) return;

      setIsScanning(true);
      const timeNow = () => new Date().toTimeString().split(' ')[0];

      const logs: Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error'; time: string }> = [];
      const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
        logs.push({ text, type, time: timeNow() });
        setScanLogs([...logs]);
      };

      addLog(`[INIT] Starting memory scan for profile: "${activeProfile.name}" (${activeProfile.items.length} targets)`);
      addLog(`[SOURCE] Target: ${sourceMode === 'live' ? `Live PID ${currentProcess?.pid || 'N/A'}` : loadedStorageFileName || 'dump.cs storage'}`);

      const allAssemblies = il2cppEngine.getAssemblies();
      addLog(`[INDEX] Loaded ${allAssemblies.length} assemblies into scanner memory space.`);
      const allClasses = allAssemblies.flatMap((asm) => il2cppEngine.getClasses(asm.index));
      addLog(`[INDEX] ${allClasses.length} total types mapped.`);

      let resolvedCount = 0;
      const storageMeta = il2cppEngine.getStorageMeta();
      const hasIl2cpp = Boolean(storageMeta.il2cppHFileName);

      const scannedItems: WatchlistTargetItem[] = activeProfile.items.map((item) => {
        // Direct Offset & Custom Target mode
        if (item.isCustom) {
          const directOffset = item.defaultOffset || item.offsetHex || item.rvaHex || '0x0';
          resolvedCount++;
          addLog(`[DIRECT] "${item.customName || item.memberName}" -> Direct Offset: ${directOffset}`, 'success');
          return {
            ...item,
            resolved: true,
            resolvedViaFallback: false,
            offsetHex: directOffset,
            rvaHex: item.kind === 'METHOD' ? directOffset : undefined,
            lastScannedAt: Date.now(),
          };
        }

        const isCoreGroupTarget = Boolean(
          item.isIl2cppSymbol ||
          item.groupName === '. Core / GameFacade' ||
          item.groupName?.startsWith('. Core') ||
          item.assemblyName === 'il2cpp'
        );

        const customNameLower = (item.customName || '').trim().toLowerCase();
        const memberNameLower = (item.memberName || '').trim().toLowerCase();
        const symbolNameLower = (item.il2cppSymbolName || '').trim().toLowerCase();

        // If it is a Core / IL2CPP Target, scan exclusively in il2cpp.h (skip dump.cs completely)
        if (isCoreGroupTarget) {
          // Check for InitBase (TypeInfo Base Address) / t_GameFacade_TypeInfo
          const isInitBase =
            customNameLower === 'initbase' ||
            memberNameLower === 'initbase' ||
            symbolNameLower === 'initbase' ||
            memberNameLower.includes('typeinfo') ||
            symbolNameLower.includes('typeinfo') ||
            customNameLower.includes('typeinfo') ||
            memberNameLower.includes('t_gamefacade');

          if (isInitBase) {
            const baseHex = storageMeta.baseAddressHex && storageMeta.baseAddressHex !== '0x0'
              ? storageMeta.baseAddressHex
              : item.defaultOffset;

            if (baseHex && baseHex !== '0x0') {
              resolvedCount++;
              addLog(`[IL2CPP] "${item.customName || item.memberName || 'InitBase'}" -> Base Address: ${baseHex}`, 'success');
              return {
                ...item,
                resolved: true,
                resolvedViaFallback: false,
                assemblyName: 'il2cpp',
                resolvedAssemblyName: 'il2cpp',
                resolvedClassName: item.className || 'GameFacade',
                resolvedMemberName: item.memberName || 't_GameFacade_TypeInfo',
                offsetHex: baseHex,
                rvaHex: baseHex,
                comment: item.comment && !item.comment.includes('missing il2cpp') ? item.comment : 'TypeInfo Base Address',
                lastScannedAt: Date.now(),
              };
            } else {
              addLog(`[IL2CPP] "${item.customName || item.memberName || 'InitBase'}" -> // missing il2cpp (Upload il2cpp.h for TypeInfo)`, 'warn');
              return {
                ...item,
                resolved: false,
                resolvedViaFallback: false,
                assemblyName: 'il2cpp',
                resolvedAssemblyName: 'il2cpp',
                resolvedClassName: item.className || 'GameFacade',
                resolvedMemberName: item.memberName || 't_GameFacade_TypeInfo',
                offsetHex: '0x0',
                rvaHex: '0x0',
                comment: '// missing il2cpp',
                lastScannedAt: Date.now(),
              };
            }
          }

          // Check for StaticClass (Static Field Offset) / IL2CPP_STATIC_FIELDS_OFFSET
          const isStaticClass =
            customNameLower === 'staticclass' ||
            memberNameLower === 'staticclass' ||
            symbolNameLower === 'staticclass' ||
            memberNameLower.includes('static_field') ||
            symbolNameLower.includes('static_field') ||
            memberNameLower.includes('staticfield') ||
            symbolNameLower.includes('staticfield') ||
            customNameLower.includes('static');

          if (isStaticClass) {
            const staticOffset = storageMeta.staticFieldsOffsetHex || item.defaultOffset || (hasIl2cpp ? '0xB8' : undefined);
            if (staticOffset) {
              resolvedCount++;
              addLog(`[IL2CPP] "${item.customName || item.memberName || 'StaticClass'}" -> Static Field Offset: ${staticOffset}`, 'success');
              return {
                ...item,
                resolved: true,
                resolvedViaFallback: false,
                assemblyName: 'il2cpp',
                resolvedAssemblyName: 'il2cpp',
                resolvedClassName: item.className || 'GameFacade',
                resolvedMemberName: item.memberName || 'IL2CPP_STATIC_FIELDS_OFFSET',
                offsetHex: staticOffset,
                rvaHex: staticOffset,
                comment: item.comment && !item.comment.includes('missing il2cpp') ? item.comment : 'Static Field Offset',
                lastScannedAt: Date.now(),
              };
            } else {
              addLog(`[IL2CPP] "${item.customName || item.memberName || 'StaticClass'}" -> // missing il2cpp (Upload il2cpp.h for static field offset)`, 'warn');
              return {
                ...item,
                resolved: false,
                resolvedViaFallback: false,
                assemblyName: 'il2cpp',
                resolvedAssemblyName: 'il2cpp',
                resolvedClassName: item.className || 'GameFacade',
                resolvedMemberName: item.memberName || 'IL2CPP_STATIC_FIELDS_OFFSET',
                offsetHex: '0x0',
                rvaHex: '0x0',
                comment: '// missing il2cpp',
                lastScannedAt: Date.now(),
              };
            }
          }

          // Any other symbol in Core / IL2CPP Group
          const customIl2cppOffset = item.defaultOffset || (hasIl2cpp ? '0x0' : undefined);
          if (customIl2cppOffset && customIl2cppOffset !== '0x0') {
            resolvedCount++;
            addLog(`[IL2CPP] "${item.customName || item.memberName}" -> Offset: ${customIl2cppOffset}`, 'success');
            return {
              ...item,
              resolved: true,
              resolvedViaFallback: false,
              assemblyName: 'il2cpp',
              resolvedAssemblyName: 'il2cpp',
              offsetHex: customIl2cppOffset,
              rvaHex: customIl2cppOffset,
              lastScannedAt: Date.now(),
            };
          } else {
            addLog(`[IL2CPP] "${item.customName || item.memberName}" -> // missing il2cpp or offset`, 'warn');
            return {
              ...item,
              resolved: false,
              resolvedViaFallback: false,
              assemblyName: 'il2cpp',
              resolvedAssemblyName: 'il2cpp',
              offsetHex: '0x0',
              rvaHex: '0x0',
              comment: item.comment || '// missing il2cpp',
              lastScannedAt: Date.now(),
            };
          }
        }

        const candidateClasses = [
          (item.className || '').trim(),
          ...(item.fallbackClassNames || []).map((s) => s.trim()),
        ].filter((s) => s.length > 0);

        const candidateMembers = [
          (item.memberName || '').trim(),
          ...(item.fallbackMemberNames || []).map((s) => s.trim()),
        ].filter((s) => s.length > 0);

        let matchedClass: typeof allClasses[0] | undefined;
        let matchedField: any | undefined;
        let matchedMethod: any | undefined;
        let matchedClassName = '';
        let matchedMemberName = '';
        let matchedAssemblyName = '';
        let matchedViaFallbackClass = false;
        let matchedViaFallbackMember = false;

        for (let cIdx = 0; cIdx < candidateClasses.length; cIdx++) {
          const cName = candidateClasses[cIdx];
          const isFallbackClassCandidate = cIdx > 0;

          const isClassMatching = (c: typeof allClasses[0]) => {
            const cleanInput = cName.trim().toLowerCase();
            const cNameLower = c.name.toLowerCase();
            const nsLower = (c.namespaceName && c.namespaceName !== '-' ? c.namespaceName : '').toLowerCase();

            // 1. Direct class name match
            if (cNameLower === cleanInput) return true;

            // 2. Namespace:ClassName match (e.g. COW.GamePlay:CameraControllerBase or COW.GamePlay::CameraControllerBase)
            if (cleanInput.includes(':')) {
              const delimiter = cleanInput.includes('::') ? '::' : ':';
              const parts = cleanInput.split(delimiter).map((p) => p.trim());
              if (parts.length >= 2) {
                const nsPart = parts[0];
                const namePart = parts.slice(1).join(':');
                return cNameLower === namePart && (nsLower === nsPart || (!nsLower && !nsPart));
              }
            }

            // 3. Namespace.ClassName / Namespace:ClassName match
            if (nsLower) {
              if (`${nsLower}:${cNameLower}` === cleanInput) return true;
              if (`${nsLower}::${cNameLower}` === cleanInput) return true;
              if (`${nsLower}.${cNameLower}` === cleanInput) return true;
            }

            return false;
          };

          // If assemblyName is provided on target, prioritize classes from that assembly
          const matchingClasses = allClasses.filter((c) => {
            if (!isClassMatching(c)) return false;
            if (item.assemblyName?.trim()) {
              const targetDll = item.assemblyName.trim().toLowerCase();
              const asm = allAssemblies.find((a) => a.index === c.assemblyIndex);
              const asmName = (c.assemblyName || asm?.name || '').toLowerCase();
              return asmName.includes(targetDll) || targetDll.includes(asmName);
            }
            return true;
          });

          // Fall back to any class match if strict assembly match didn't yield
          const candidateClassList = matchingClasses.length > 0
            ? matchingClasses
            : allClasses.filter((c) => isClassMatching(c));

          for (const foundCls of candidateClassList) {
            const formattedResolvedClassName = foundCls.namespaceName && foundCls.namespaceName !== '-'
              ? `${foundCls.namespaceName}:${foundCls.name}`
              : foundCls.name;

            if (item.kind === 'FIELD') {
              const fields = il2cppEngine.getFields(foundCls.index);
              for (let mIdx = 0; mIdx < candidateMembers.length; mIdx++) {
                const mName = candidateMembers[mIdx];
                const foundF = fields.find((f) => f.name.toLowerCase() === mName.toLowerCase());
                if (foundF && foundF.offset !== undefined) {
                  matchedClass = foundCls;
                  matchedField = foundF;
                  matchedClassName = formattedResolvedClassName;
                  matchedMemberName = foundF.name;
                  matchedViaFallbackClass = isFallbackClassCandidate;
                  matchedViaFallbackMember = mIdx > 0;
                  const asm = allAssemblies.find((a) => a.index === foundCls.assemblyIndex);
                  matchedAssemblyName = foundCls.assemblyName || asm?.name || 'Assembly-CSharp.dll';
                  break;
                }
              }
            } else {
              const methods = il2cppEngine.getMethods(foundCls.index);
              for (let mIdx = 0; mIdx < candidateMembers.length; mIdx++) {
                const mName = candidateMembers[mIdx];
                const foundM = methods.find((m) => m.name.toLowerCase() === mName.toLowerCase());
                if (foundM) {
                  matchedClass = foundCls;
                  matchedMethod = foundM;
                  matchedClassName = formattedResolvedClassName;
                  matchedMemberName = foundM.name;
                  matchedViaFallbackClass = isFallbackClassCandidate;
                  matchedViaFallbackMember = mIdx > 0;
                  const asm = allAssemblies.find((a) => a.index === foundCls.assemblyIndex);
                  matchedAssemblyName = foundCls.assemblyName || asm?.name || 'Assembly-CSharp.dll';
                  break;
                }
              }
            }
            if (matchedClass) break;
          }

          if (matchedClass) break;
        }

        if (!matchedClass) {
          addLog(`[FAIL] Could not resolve ${item.className}.${item.memberName} (all fallbacks exhausted)`, 'warn');
          return {
            ...item,
            resolved: false,
            resolvedViaFallback: false,
            resolvedClassName: undefined,
            resolvedMemberName: undefined,
            resolvedAssemblyName: undefined,
            offsetHex: undefined,
            rvaHex: undefined,
            vaHex: undefined,
            lastScannedAt: Date.now(),
          };
        }

        resolvedCount++;
        // Fallback is ONLY used if a fallback class candidate or fallback member candidate was matched
        const isFallbackUsed = Boolean(matchedViaFallbackClass || matchedViaFallbackMember);

        if (item.kind === 'FIELD' && matchedField) {
          const offsetHex = `0x${matchedField.offset.toString(16).toUpperCase()}`;
          if (isFallbackUsed) {
            addLog(`[FALLBACK] [${matchedAssemblyName}] ${item.className}.${item.memberName} -> Matched ${matchedClassName}.${matchedMemberName} @ ${offsetHex}`, 'success');
          } else {
            addLog(`[MATCH] [${matchedAssemblyName}] ${matchedClassName}.${matchedMemberName} -> Offset: ${offsetHex}`, 'success');
          }

          return {
            ...item,
            resolved: true,
            resolvedViaFallback: isFallbackUsed,
            resolvedClassName: matchedClassName,
            resolvedMemberName: matchedMemberName,
            resolvedAssemblyName: matchedAssemblyName,
            assemblyName: item.assemblyName || matchedAssemblyName,
            offsetHex,
            typeName: matchedField.typeName || 'object',
            classIndex: matchedClass.index,
            memberIndex: matchedField.index,
            lastScannedAt: Date.now(),
          };
        } else if (item.kind === 'METHOD' && matchedMethod) {
          const rvaStr = matchedMethod.rva ? `0x${matchedMethod.rva.toString(16).toUpperCase()}` : '0x0';
          const vaStr = matchedMethod.address ? `0x${matchedMethod.address.toString(16).toUpperCase()}` : '0x0';
          if (isFallbackUsed) {
            addLog(`[FALLBACK] [${matchedAssemblyName}] ${item.className}.${item.memberName} -> Matched ${matchedClassName}.${matchedMemberName} @ RVA ${rvaStr}`, 'success');
          } else {
            addLog(`[MATCH] [${matchedAssemblyName}] ${matchedClassName}.${matchedMemberName} -> RVA: ${rvaStr}`, 'success');
          }

          return {
            ...item,
            resolved: true,
            resolvedViaFallback: isFallbackUsed,
            resolvedClassName: matchedClassName,
            resolvedMemberName: matchedMemberName,
            resolvedAssemblyName: matchedAssemblyName,
            assemblyName: item.assemblyName || matchedAssemblyName,
            rvaHex: rvaStr,
            vaHex: vaStr,
            signature: matchedMethod.signature,
            classIndex: matchedClass.index,
            memberIndex: matchedMethod.index,
            lastScannedAt: Date.now(),
          };
        }

        return {
          ...item,
          resolved: false,
          lastScannedAt: Date.now(),
        };
      });

      addLog(`[COMPLETE] Scan finished: ${resolvedCount}/${activeProfile.items.length} targets resolved.`, 'info');
      setIsScanning(false);

      const updatedProfiles = profiles.map((p) =>
        p.id === activeProfile.id ? { ...p, items: scannedItems, updatedAt: Date.now() } : p
      );
      saveProfiles(updatedProfiles);

      // Save to History Log
      const newRecord: ScanHistoryRecord = {
        id: `scan_${Date.now()}`,
        profileId: activeProfile.id,
        profileName: activeProfile.name,
        codeStylePreset: activeProfile.codeStylePreset || 'cpp_constexpr',
        customCodeStyleTemplate: activeProfile.customCodeStyleTemplate,
        sourceMode,
        targetApp: currentProcess?.appName || loadedStorageFileName || 'IL2CPP Binary',
        timestamp: Date.now(),
        totalTargets: activeProfile.items.length,
        resolvedCount,
        items: scannedItems.map((i) => ({
          id: i.id,
          customName: i.customName,
          groupName: i.groupName,
          subGroupName: i.subGroupName,
          assemblyName: i.assemblyName,
          className: i.className,
          memberName: i.memberName,
          kind: i.kind,
          comment: i.comment,
          offsetHex: i.offsetHex,
          rvaHex: i.rvaHex,
          vaHex: i.vaHex,
          typeName: i.typeName,
          signature: i.signature,
          resolvedViaFallback: i.resolvedViaFallback,
          resolvedClassName: i.resolvedClassName,
          resolvedMemberName: i.resolvedMemberName,
          resolvedAssemblyName: i.resolvedAssemblyName,
          classIndex: i.classIndex,
          memberIndex: i.memberIndex,
          resolved: i.resolved,
        })),
      };

      const nextHistory = [newRecord, ...scanHistory.slice(0, 49)];
      saveHistory(nextHistory);

      showToast(`Scan complete: ${resolvedCount}/${activeProfile.items.length} targets resolved!`);
    },
    [scanHistory, saveHistory]
  );

  return {
    scanHistory,
    saveHistory,
    isScanning,
    scanLogs,
    handleScanProfile,
  };
}
