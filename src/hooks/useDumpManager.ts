import { useState } from 'react';
import { il2cppEngine } from '../services/il2cppEngine';
import { DumpParseProgress } from '../types';

interface UseDumpManagerOptions {
  storageDumpName?: string | null;
  onStorageDumpLoaded?: (fileName: string | null) => void;
  showToast: (msg: string) => void;
}

export function useDumpManager({
  storageDumpName,
  onStorageDumpLoaded,
  showToast,
}: UseDumpManagerOptions) {
  const [storageMeta, setStorageMeta] = useState(() => il2cppEngine.getStorageMeta());
  const [loadedStorageFileName, setLoadedStorageFileName] = useState<string | null>(storageDumpName || null);
  const [loadedHeaderFileName, setLoadedHeaderFileName] = useState<string | null>(null);
  const [isParsingDump, setIsParsingDump] = useState(false);
  const [parseProgress, setParseProgress] = useState<DumpParseProgress | null>(null);
  const [parsedSummary, setParsedSummary] = useState<{
    classes: number;
    methods: number;
    fields: number;
    typeInfos?: number;
  } | null>(null);

  // Handle Storage dump.cs File Upload
  const handleDumpCsUpload = async (file: File) => {
    setIsParsingDump(true);
    setParseProgress({
      fileName: file.name,
      fileSizeMb: Number((file.size / (1024 * 1024)).toFixed(2)),
      percent: 0,
      processedBytes: 0,
      totalBytes: file.size,
      classesCount: 0,
      methodsCount: 0,
      fieldsCount: 0,
      stage: `Preparing to stream ${file.name} (${Number((file.size / (1024 * 1024)).toFixed(2))} MB)...`,
    });

    try {
      const result = await il2cppEngine.parseDumpCsFile(file, (progress) => {
        setParseProgress(progress);
      });
      setLoadedStorageFileName(file.name);
      const updatedMeta = il2cppEngine.getStorageMeta();
      setStorageMeta(updatedMeta);
      if (onStorageDumpLoaded) {
        onStorageDumpLoaded(file.name);
      }
      setParsedSummary({
        classes: result.classesCount,
        methods: result.methodsCount,
        fields: result.fieldsCount,
        typeInfos: updatedMeta.totalTypeInfos,
      });
      setIsParsingDump(false);
      setParseProgress(null);
      showToast(
        `Parsed ${file.name} (${Number((file.size / (1024 * 1024)).toFixed(2))} MB): ${result.classesCount.toLocaleString()} classes, ${result.methodsCount.toLocaleString()} methods`
      );
    } catch (err) {
      setIsParsingDump(false);
      setParseProgress(null);
      showToast(`Error parsing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle il2cpp.h File Upload
  const handleIl2cppHUpload = async (file: File) => {
    try {
      const result = await il2cppEngine.parseIl2cppHFile(file);
      setLoadedHeaderFileName(file.name);
      const updatedMeta = il2cppEngine.getStorageMeta();
      setStorageMeta(updatedMeta);
      setParsedSummary((prev) => ({
        classes: prev?.classes || updatedMeta.totalClasses,
        methods: prev?.methods || updatedMeta.totalMethods,
        fields: prev?.fields || updatedMeta.totalFields,
        typeInfos: updatedMeta.totalTypeInfos,
      }));
      showToast(`Parsed header ${file.name}: ${result.typeInfosCount} type definitions found`);
    } catch (err) {
      showToast(`Error reading ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle Unload dump.cs
  const handleUnloadDumpCs = () => {
    il2cppEngine.unloadDumpCs();
    setLoadedStorageFileName(null);
    const updatedMeta = il2cppEngine.getStorageMeta();
    setStorageMeta(updatedMeta);
    if (onStorageDumpLoaded) {
      onStorageDumpLoaded(null);
    }
    setParsedSummary(null);
    showToast('Unloaded dump.cs');
  };

  // Handle Unload il2cpp.h
  const handleUnloadIl2cppH = () => {
    il2cppEngine.unloadIl2cppH();
    setLoadedHeaderFileName(null);
    const updatedMeta = il2cppEngine.getStorageMeta();
    setStorageMeta(updatedMeta);
    setParsedSummary((prev) =>
      prev ? { ...prev, typeInfos: undefined } : null
    );
    showToast('Unloaded il2cpp.h');
  };

  return {
    storageMeta,
    loadedStorageFileName,
    loadedHeaderFileName,
    isParsingDump,
    parseProgress,
    parsedSummary,
    handleDumpCsUpload,
    handleIl2cppHUpload,
    handleUnloadDumpCs,
    handleUnloadIl2cppH,
  };
}
