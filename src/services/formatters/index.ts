import { CodeStylePreset, WatchlistTargetItem, WatchlistProfile, ScanHistoryRecord } from '../../types';

export interface CodeStyleOption {
  id: CodeStylePreset;
  label: string;
  template: string;
  description: string;
  fileExtension: string;
  mimeType: string;
}

export const CODE_STYLE_PRESETS: CodeStyleOption[] = [
  {
    id: 'cpp_constexpr',
    label: 'C++ (constexpr)',
    template: 'constexpr uintptr_t {name} = {offset};',
    description: 'Modern C++ compile-time constant pointers',
    fileExtension: '.h',
    mimeType: 'text/x-c',
  },
  {
    id: 'cs_const',
    label: 'C# (const uint)',
    template: 'public const uint {name} = {offset};',
    description: 'C# public constant memory addresses',
    fileExtension: '.cs',
    mimeType: 'text/plain',
  },
  {
    id: 'cs_field',
    label: 'C# (Class Member)',
    template: 'public {type} {name}; // Offset: {offset}',
    description: 'C# field declaration with offset comment',
    fileExtension: '.cs',
    mimeType: 'text/plain',
  },
  {
    id: 'cheat_engine',
    label: 'Cheat Engine (INI)',
    template: '{class}.{name} = {offset}',
    description: 'Direct symbol to memory offset mapping',
    fileExtension: '.txt',
    mimeType: 'text/plain',
  },
  {
    id: 'lua',
    label: 'Lua Script',
    template: 'local {name} = {offset}',
    description: 'Lua local variable definitions',
    fileExtension: '.lua',
    mimeType: 'text/x-lua',
  },
  {
    id: 'custom',
    label: 'Custom Template',
    template: 'constexpr uintptr_t {name} = {offset};',
    description: 'User-defined template with {name}, {offset}, {class}, {rva}, {type}',
    fileExtension: '.txt',
    mimeType: 'text/plain',
  },
];

export function getCodeTemplate(preset: CodeStylePreset = 'cpp_constexpr', customTemplate?: string): string {
  if (preset === 'custom') {
    return customTemplate?.trim() || 'constexpr uintptr_t {name} = {offset};';
  }
  const found = CODE_STYLE_PRESETS.find((p) => p.id === preset);
  return found ? found.template : 'constexpr uintptr_t {name} = {offset};';
}

export function formatTargetCodeSnippet(
  item: WatchlistTargetItem,
  preset: CodeStylePreset = 'cpp_constexpr',
  customTemplate?: string
): string {
  const template = getCodeTemplate(preset, customTemplate);
  const targetClass = item.resolvedClassName || item.className || 'UnknownClass';
  const targetMember = item.resolvedMemberName || item.memberName || 'unknownMember';
  const displayName = item.customName?.trim() || targetMember;
  const offset = item.kind === 'FIELD' ? (item.offsetHex || '0x0') : (item.rvaHex || '0x0');
  const rva = item.rvaHex || '0x0';
  const va = item.vaHex || '0x0';
  const type = item.typeName || (item.kind === 'FIELD' ? 'System.Single' : 'void');
  const kind = item.kind;
  const comment = item.comment || '';

  // Variable-safe member name (e.g. for C++ / C# variable identifiers)
  const safeName = displayName.replace(/[^a-zA-Z0-9_]/g, '_');
  const safeMemberName = targetMember.replace(/[^a-zA-Z0-9_]/g, '_');
  const safeClass = targetClass.replace(/[^a-zA-Z0-9_]/g, '_');

  let result = template
    .replace(/\{name\}/g, safeName)
    .replace(/\{rawName\}/g, displayName)
    .replace(/\{memberName\}/g, safeMemberName)
    .replace(/\{rawMemberName\}/g, targetMember)
    .replace(/\{offset\}/g, offset)
    .replace(/\{rva\}/g, rva)
    .replace(/\{va\}/g, va)
    .replace(/\{class\}/g, targetClass)
    .replace(/\{safeClass\}/g, safeClass)
    .replace(/\{type\}/g, type)
    .replace(/\{kind\}/g, kind)
    .replace(/\{comment\}/g, comment);

  return result;
}

export function generateFullProfileCode(
  profile: WatchlistProfile,
  presetOverride?: CodeStylePreset,
  customTemplateOverride?: string
): { code: string; filename: string; mimeType: string } {
  const preset = presetOverride || profile.codeStylePreset || 'cpp_constexpr';
  const customTemplate = customTemplateOverride || profile.customCodeStyleTemplate;
  const presetConfig = CODE_STYLE_PRESETS.find((p) => p.id === preset) || CODE_STYLE_PRESETS[0];

  const profileSafeName = (profile.name || 'Offsets').replace(/[^a-zA-Z0-9_]/g, '');

  const lines = profile.items
    .map((item) => {
      const line = formatTargetCodeSnippet(item, preset, customTemplate);
      const note = item.comment ? ` // ${item.comment}` : '';
      return `    ${line}${preset === 'cpp_constexpr' || preset === 'cs_const' ? (item.comment ? note : '') : ''}`;
    })
    .join('\n');

  let code = '';
  let filename = `${profileSafeName || 'offsets'}${presetConfig.fileExtension}`;

  if (preset === 'cpp_constexpr') {
    code = `#pragma once\n` +
      `#include <cstdint>\n\n` +
      `namespace Offsets {\n` +
      `    namespace ${profileSafeName || 'TargetPointers'} {\n` +
      `${lines}\n` +
      `    }\n` +
      `}\n`;
  } else if (preset === 'cs_const') {
    code = `namespace GameOffsets\n` +
      `{\n` +
      `    public static class ${profileSafeName || 'Offsets'}\n` +
      `    {\n` +
      `${lines}\n` +
      `    }\n` +
      `}\n`;
  } else if (preset === 'cs_field') {
    code = `using System;\n\n` +
      `public class ${profileSafeName || 'GameOffsets'}\n` +
      `{\n` +
      `${lines}\n` +
      `}\n`;
  } else if (preset === 'lua') {
    code = `local ${profileSafeName || 'Offsets'} = {}\n\n` +
      `${lines}\n\n` +
      `return ${profileSafeName || 'Offsets'}\n`;
  } else {
    code = `${profile.items
        .map((item) => formatTargetCodeSnippet(item, preset, customTemplate))
        .join('\n')}\n`;
  }

  return {
    code,
    filename,
    mimeType: presetConfig.mimeType,
  };
}

export function generateScanHistoryCode(
  history: ScanHistoryRecord,
  presetOverride?: CodeStylePreset,
  customTemplateOverride?: string
): { code: string; filename: string; mimeType: string } {
  const preset = presetOverride || history.codeStylePreset || 'cpp_constexpr';
  const customTemplate = customTemplateOverride || history.customCodeStyleTemplate;
  const presetConfig = CODE_STYLE_PRESETS.find((p) => p.id === preset) || CODE_STYLE_PRESETS[0];

  const profileSafeName = (history.profileName || 'Offsets').replace(/[^a-zA-Z0-9_]/g, '');

  // Convert history items to WatchlistTargetItem-like objects
  const targetItems: WatchlistTargetItem[] = history.items.map((it: any, idx: number) => ({
    id: it.id || `hist_${idx}`,
    customName: it.customName,
    className: it.className,
    memberName: it.memberName,
    kind: it.kind,
    comment: it.comment,
    offsetHex: it.offsetHex,
    rvaHex: it.rvaHex,
    vaHex: it.vaHex,
    typeName: it.typeName,
    signature: it.signature,
    resolvedClassName: it.resolvedClassName,
    resolvedMemberName: it.resolvedMemberName,
    resolvedViaFallback: it.resolvedViaFallback,
    resolved: it.offsetHex !== undefined || it.rvaHex !== undefined,
  }));

  const lines = targetItems
    .map((item) => {
      const line = formatTargetCodeSnippet(item, preset, customTemplate);
      const note = item.comment ? ` // ${item.comment}` : '';
      return `    ${line}${preset === 'cpp_constexpr' || preset === 'cs_const' ? (item.comment ? note : '') : ''}`;
    })
    .join('\n');

  let code = '';
  let filename = `${profileSafeName || 'scan_offsets'}_${history.id}${presetConfig.fileExtension}`;

  if (preset === 'cpp_constexpr') {
    code = `#pragma once\n` +
      `#include <cstdint>\n\n` +
      `namespace Offsets {\n` +
      `    namespace ${profileSafeName || 'TargetPointers'} {\n` +
      `${lines}\n` +
      `    }\n` +
      `}\n`;
  } else if (preset === 'cs_const') {
    code = `namespace GameOffsets\n` +
      `{\n` +
      `    public static class ${profileSafeName || 'Offsets'}\n` +
      `    {\n` +
      `${lines}\n` +
      `    }\n` +
      `}\n`;
  } else if (preset === 'cs_field') {
    code = `using System;\n\n` +
      `public class ${profileSafeName || 'GameOffsets'}\n` +
      `{\n` +
      `${lines}\n` +
      `}\n`;
  } else if (preset === 'lua') {
    code = `local ${profileSafeName || 'Offsets'} = {}\n\n` +
      `${lines}\n\n` +
      `return ${profileSafeName || 'Offsets'}\n`;
  } else {
    code = `${targetItems
        .map((item) => formatTargetCodeSnippet(item, preset, customTemplate))
        .join('\n')}\n`;
  }

  return {
    code,
    filename,
    mimeType: presetConfig.mimeType,
  };
}
