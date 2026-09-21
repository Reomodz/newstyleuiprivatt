import { WatchlistProfile, WatchlistTargetItem, TargetCardViewSettings } from '../types';

export interface JsonDiagnosticResult {
  status: 'valid' | 'partial' | 'unsupported';
  errorTitle?: string;
  errors: string[];
  warnings: string[];
  info: string[];
  rawText?: string;
  recoveredProfile: WatchlistProfile | null;
  recoveredCardSettings?: TargetCardViewSettings;
}

export function validateAndParseProfileJson(rawInput: string): JsonDiagnosticResult {
  const result: JsonDiagnosticResult = {
    status: 'unsupported',
    errors: [],
    warnings: [],
    info: [],
    rawText: rawInput,
    recoveredProfile: null,
  };

  const trimmed = rawInput.trim();
  if (!trimmed) {
    result.errorTitle = 'Empty JSON Input';
    result.errors.push('The provided input is completely empty.');
    return result;
  }

  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err: any) {
    result.status = 'unsupported';
    result.errorTitle = 'Malformed JSON Syntax';
    result.errors.push(`JSON Syntax Error: ${err.message || 'Invalid JSON syntax'}`);
    result.errors.push('The file is not a valid JSON document. Please ensure all braces, brackets, and quotes are properly closed.');
    return result;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    result.status = 'unsupported';
    result.errorTitle = 'Invalid Root Type';
    result.errors.push(`Expected a JSON Object or Array, but received primitive type: "${typeof parsed}".`);
    return result;
  }

  // Handle case where user provided direct list of targets or wrapped inside profile
  let profileData: any = parsed.profile || parsed;
  let rawItems: any[] = [];

  // If parsed is directly an array of targets
  if (Array.isArray(parsed)) {
    rawItems = parsed;
    profileData = { name: 'Recovered Target List', items: rawItems };
    result.warnings.push('Root structure is a raw Target Array rather than a full Profile object. Created a container profile.');
  } else if (Array.isArray(profileData.items)) {
    rawItems = profileData.items;
  } else if (Array.isArray(profileData.targets)) {
    rawItems = profileData.targets;
    result.warnings.push('Detected property "targets" instead of standard "items". Remapped successfully.');
  } else if (Array.isArray(profileData.offsets)) {
    rawItems = profileData.offsets;
    result.warnings.push('Detected property "offsets" instead of standard "items". Remapped successfully.');
  } else {
    // Check if it's an object containing target-like items
    const possibleItems = Object.values(profileData).filter(
      (v) => typeof v === 'object' && v !== null && ((v as any).className || (v as any).memberName || (v as any).customName || (v as any).offsetHex)
    );
    if (possibleItems.length > 0) {
      rawItems = possibleItems;
      result.warnings.push(`Extracted ${possibleItems.length} target records from non-standard key-value object map.`);
    }
  }

  // Check if there is anything recoverable
  if (rawItems.length === 0 && !profileData.name) {
    result.status = 'unsupported';
    result.errorTitle = 'Unsupported Structure';
    result.errors.push('No profile definition or valid target entries found in this JSON.');
    result.errors.push('Expected schema with profile name or an array of targets with className/memberName/offsetHex properties.');
    return result;
  }

  // Validate and recover Profile fields
  let profileName = typeof profileData.name === 'string' ? profileData.name.trim() : '';
  if (!profileName) {
    profileName = `Recovered Profile ${new Date().toLocaleDateString()}`;
    result.warnings.push('Missing or empty profile "name". Auto-generated a fallback profile name.');
  }

  const description = typeof profileData.description === 'string' ? profileData.description : 'Imported profile offsets';
  const targetApp = typeof profileData.targetApp === 'string' && profileData.targetApp.trim() ? profileData.targetApp.trim() : 'com.game.sample';
  const codeStylePreset = profileData.codeStylePreset || 'cpp_constexpr';

  // Check Card View Settings
  let recoveredCardSettings: TargetCardViewSettings | undefined;
  if (profileData.cardViewSettings && typeof profileData.cardViewSettings === 'object') {
    recoveredCardSettings = profileData.cardViewSettings;
    result.info.push('Embedded Card View Display Settings detected and preserved.');
  }

  // Process & Validate Items
  const validItems: WatchlistTargetItem[] = [];
  let skippedCount = 0;
  const now = Date.now();

  rawItems.forEach((it: any, idx: number) => {
    if (typeof it !== 'object' || it === null) {
      skippedCount++;
      return;
    }

    // Check IL2CPP Symbol
    if (it.isIl2cppSymbol || it.groupName === '. Core / GameFacade') {
      const symName = it.il2cppSymbolName || it.memberName || it.customName || 'IL2CPP_SYMBOL';
      validItems.push({
        id: `t_${now}_${idx}`,
        isCustom: false,
        isIl2cppSymbol: true,
        il2cppSymbolName: symName,
        customName: it.customName || undefined,
        groupName: '. Core / GameFacade',
        subGroupName: undefined,
        assemblyName: 'il2cpp',
        className: it.className || 'GameFacade',
        memberName: symName,
        kind: 'FIELD',
        comment: it.comment || '',
        offsetHex: it.offsetHex || it.defaultOffset || undefined,
        defaultOffset: it.defaultOffset || it.offsetHex || undefined,
        resolved: Boolean(it.offsetHex || it.defaultOffset),
      });
      return;
    }

    const isCustom = Boolean(it.isCustom || (!it.className && !it.memberName && it.customName));
    
    if (isCustom) {
      const customName = it.customName || it.name || `Custom Target ${idx + 1}`;
      validItems.push({
        id: `t_${now}_${idx}`,
        isCustom: true,
        customName,
        groupName: it.groupName || undefined,
        subGroupName: it.subGroupName || undefined,
        comment: it.comment || undefined,
        offsetHex: it.offsetHex || it.offset || it.defaultOffset || undefined,
        defaultOffset: it.defaultOffset || it.offsetHex || it.offset || undefined,
        resolved: Boolean(it.offsetHex || it.offset || it.defaultOffset),
      });
      return;
    }

    // Standard Target (Class / Member)
    const className = typeof it.className === 'string' ? it.className.trim() : (typeof it.class === 'string' ? it.class.trim() : '');
    const memberName = typeof it.memberName === 'string' ? it.memberName.trim() : (typeof it.member === 'string' ? it.member.trim() : (typeof it.name === 'string' ? it.name.trim() : ''));

    if (!className && !memberName && !it.offsetHex && !it.offset) {
      skippedCount++;
      return;
    }

    const finalOffset = it.offsetHex || it.offset || it.defaultOffset || undefined;
    const finalRva = it.rvaHex || it.rva || undefined;

    validItems.push({
      id: `t_${now}_${idx}`,
      isCustom: false,
      customName: it.customName || undefined,
      groupName: it.groupName || undefined,
      subGroupName: it.subGroupName || undefined,
      assemblyName: it.assemblyName || it.assembly || undefined,
      className: className || 'UnknownClass',
      memberName: memberName || 'UnknownMember',
      kind: it.kind === 'METHOD' || it.isMethod ? 'METHOD' : 'FIELD',
      comment: it.comment || '',
      offsetHex: finalOffset,
      rvaHex: finalRva,
      isStatic: Boolean(it.isStatic || it.static),
      valueType: it.valueType || it.type || undefined,
      fallbackClassNames: Array.isArray(it.fallbackClassNames) ? it.fallbackClassNames : undefined,
      fallbackMemberNames: Array.isArray(it.fallbackMemberNames) ? it.fallbackMemberNames : undefined,
      resolved: Boolean(finalOffset || finalRva),
    });
  });

  if (skippedCount > 0) {
    result.warnings.push(`Skipped ${skippedCount} malformed or empty target item(s).`);
  }

  if (validItems.length === 0 && !profileData.name) {
    result.status = 'unsupported';
    result.errorTitle = 'No Usable Targets Found';
    result.errors.push('Found 0 recognizable target items (class, member, or offset definitions).');
    return result;
  }

  result.info.push(`Successfully parsed ${validItems.length} target(s).`);
  const groups = new Set(validItems.map((i) => i.groupName || 'Unassigned'));
  result.info.push(`Found ${groups.size} distinct group categorization(s).`);

  const recoveredProfile: WatchlistProfile = {
    id: `prof_${now}`,
    name: profileName,
    description,
    targetApp,
    codeStylePreset,
    customCodeStyleTemplate: profileData.customCodeStyleTemplate,
    cardViewSettings: recoveredCardSettings || profileData.cardViewSettings,
    groupOrder: Array.isArray(profileData.groupOrder) ? profileData.groupOrder : undefined,
    createdAt: now,
    updatedAt: now,
    items: validItems,
  };

  result.recoveredProfile = recoveredProfile;
  result.recoveredCardSettings = recoveredCardSettings;

  if (result.errors.length > 0) {
    result.status = 'unsupported';
  } else if (result.warnings.length > 0 || !profileData.name || skippedCount > 0) {
    result.status = 'partial';
  } else {
    result.status = 'valid';
  }

  return result;
}
