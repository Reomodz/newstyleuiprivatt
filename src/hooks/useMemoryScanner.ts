import { useState, useCallback } from 'react';
import { ScanHistoryRecord, TargetSourceMode, ProcessDescriptor, WatchlistProfile, WatchlistTargetItem } from '../types';
import { il2cppEngine } from '../services/il2cppEngine';

export function useMemoryScanner(initialHistory: ScanHistoryRecord[]) {
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
      const scannedItems: WatchlistTargetItem[] = activeProfile.items.map((item) => {
        const candidateClasses = [
          item.className.trim(),
          ...(item.fallbackClassNames || []).map((s) => s.trim()),
        ].filter((s) => s.length > 0);

        const candidateMembers = [
          item.memberName.trim(),
          ...(item.fallbackMemberNames || []).map((s) => s.trim()),
        ].filter((s) => s.length > 0);

        let matchedClass: typeof allClasses[0] | undefined;
        let matchedField: any | undefined;
        let matchedMethod: any | undefined;
        let matchedClassName = '';
        let matchedMemberName = '';
        let matchedAssemblyName = '';

        for (const cName of candidateClasses) {
          const isClassMatching = (c: typeof allClasses[0]) => {
            const cleanInput = cName.trim().toLowerCase();
            const cNameLower = c.name.toLowerCase();
            const nsLower = (c.namespaceName && c.namespaceName !== '-' ? c.namespaceName : '').toLowerCase();

            // 1. Direct class name match
            if (cNameLower === cleanInput) return true;

            // 2. Namespace::ClassName match (e.g. COW.GamePlay::CameraControllerBase)
            if (cleanInput.includes('::')) {
              const parts = cleanInput.split('::').map((p) => p.trim());
              if (parts.length === 2) {
                const [nsPart, namePart] = parts;
                return cNameLower === namePart && (nsLower === nsPart || (!nsLower && !nsPart));
              }
            }

            // 3. Namespace.ClassName match (e.g. COW.GamePlay.CameraControllerBase)
            if (nsLower) {
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
              ? `${foundCls.namespaceName}::${foundCls.name}`
              : foundCls.name;

            if (item.kind === 'FIELD') {
              const fields = il2cppEngine.getFields(foundCls.index);
              for (const mName of candidateMembers) {
                const foundF = fields.find((f) => f.name.toLowerCase() === mName.toLowerCase());
                if (foundF && foundF.offset !== undefined) {
                  matchedClass = foundCls;
                  matchedField = foundF;
                  matchedClassName = formattedResolvedClassName;
                  matchedMemberName = foundF.name;
                  const asm = allAssemblies.find((a) => a.index === foundCls.assemblyIndex);
                  matchedAssemblyName = foundCls.assemblyName || asm?.name || 'Assembly-CSharp.dll';
                  break;
                }
              }
            } else {
              const methods = il2cppEngine.getMethods(foundCls.index);
              for (const mName of candidateMembers) {
                const foundM = methods.find((m) => m.name.toLowerCase() === mName.toLowerCase());
                if (foundM) {
                  matchedClass = foundCls;
                  matchedMethod = foundM;
                  matchedClassName = formattedResolvedClassName;
                  matchedMemberName = foundM.name;
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
        const isFallbackUsed =
          matchedClassName.toLowerCase() !== item.className.toLowerCase().trim() ||
          matchedMemberName.toLowerCase() !== item.memberName.toLowerCase().trim();

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
