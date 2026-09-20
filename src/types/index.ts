export enum SymbolKind {
  CLASS = 0,
  FIELD = 1,
  METHOD = 2,
}

export enum SearchMatchMode {
  CONTAINS = 0,
  EXACT = 1,
}

export enum MemberKind {
  FIELD = 1,
  METHOD = 2,
  PROPERTY = 3,
  EVENT = 4,
  NESTED_TYPE = 5,
  INTERFACE = 6,
}

export enum ClassTab {
  FIELDS = 'FIELDS',
  METHODS = 'METHODS',
}

export enum DirectoryLevel {
  ASSEMBLIES = 'ASSEMBLIES',
  NAMESPACES = 'NAMESPACES',
  CLASSES = 'CLASSES',
}

export interface ProcessDescriptor {
  pid: number;
  name: string;
  appName: string;
  startTicks: number;
  unityVersion?: string;
  arch?: string;
}

export interface AssemblyDescriptor {
  index: number;
  name: string;
  classCount?: number;
}

export interface NamespaceDescriptor {
  index: number;
  name: string;
  assemblyIndex: number;
  classCount?: number;
}

export interface ClassDescriptor {
  index: number;
  name: string;
  namespaceName: string;
  assemblyIndex: number;
}

export interface TypeReferenceDescriptor {
  index: number;
  typeIndex: number;
  definitionIndex?: number;
  name?: string;
}

export interface TypeSizeDescriptor {
  instanceSize: number;
  nativeSize: number;
  staticFieldsSize: number;
  threadStaticFieldsSize: number;
}

export interface ClassInfoDescriptor {
  index: number;
  name: string;
  namespaceName: string;
  assemblyIndex: number;
  assemblyName: string;
  flags: number;
  token: number;
  bitfield: number;
  parentType?: TypeReferenceDescriptor;
  declaringType?: TypeReferenceDescriptor;
  sizes?: TypeSizeDescriptor;
  typeInfoHex?: string;
}

export interface FieldDescriptor {
  index: number;
  name: string;
  typeIndex: number;
  typeName?: string;
  offset?: number;
  flags?: number;
  isStatic?: boolean;
  isThreadStatic?: boolean;
}

export interface MethodDescriptor {
  index: number;
  classIndex: number;
  name: string;
  signature?: string;
  returnType?: string;
  parameters?: { name: string; type: string }[];
  address?: number;
  rva?: number;
  typeInfoHex?: string;
  isStatic?: boolean;
}

export interface MethodReferenceDescriptor {
  classIndex?: number;
  methodIndex?: number;
  name?: string;
  ownerName?: string;
  signature?: string;
  address: number;
  rva?: number;
  callSiteAddress: number;
  callSiteRva?: number;
  callSiteInstructionIndex: number;
  canOpen?: boolean;
}

export interface SymbolSearchDescriptor {
  id: string;
  kind: SymbolKind;
  classIndex: number;
  memberIndex: number;
  name: string;
  assemblyName: string;
  ownerName: string;
  signature?: string;
  offsetLabel?: string;
  rvaLabel?: string;
  addressLabel?: string;
  typeInfoLabel?: string;
}

export interface StorageDumpMeta {
  dumpCsFileName?: string | null;
  il2cppHFileName?: string | null;
  baseAddressHex?: string;
  staticFieldsOffsetHex?: string;
  typeInfoSymbolName?: string;
  totalClasses: number;
  totalMethods: number;
  totalFields: number;
  totalTypeInfos: number;
  loadedAt: number;
}

export interface CanvasTabViewData {
  id: string;
  classIndex: number;
  methodIndex: number;
  methodName: string;
  ownerName: string;
  isBusy?: boolean;
  activeSubView: 'graph' | 'instructions' | 'callers' | 'callees';
}

export interface BreadcrumbViewData {
  id: string;
  label: string;
  level: DirectoryLevel | 'CLASS_DETAILS';
  targetIndex?: number;
}

export * from './theme';

export type TargetSourceMode = 'live' | 'storage';

export interface WatchlistTargetItem {
  id: string;
  customName?: string;
  groupName?: string;
  subGroupName?: string;
  assemblyName?: string;
  namespaceName?: string;
  className?: string;
  memberName?: string;
  kind?: 'FIELD' | 'METHOD';
  comment?: string;
  fallbackClassNames?: string[];
  fallbackMemberNames?: string[];
  // Resolved scan properties:
  resolved?: boolean;
  resolvedViaFallback?: boolean;
  resolvedClassName?: string;
  resolvedMemberName?: string;
  resolvedAssemblyName?: string;
  offsetHex?: string;
  rvaHex?: string;
  vaHex?: string;
  typeName?: string;
  signature?: string;
  classIndex?: number;
  memberIndex?: number;
  lastScannedAt?: number;
  isStatic?: boolean;
  valueType?: string;
  isCustom?: boolean;
  defaultOffset?: string;
}

export type CodeStylePreset =
  | 'cpp_constexpr'
  | 'cs_const'
  | 'cs_field'
  | 'cheat_engine'
  | 'lua'
  | 'custom';

export interface WatchlistProfile {
  id: string;
  name: string;
  description?: string;
  targetApp?: string;
  createdAt: number;
  updatedAt: number;
  items: WatchlistTargetItem[];
  codeStylePreset?: CodeStylePreset;
  customCodeStyleTemplate?: string;
  groupOrder?: string[];
  cardViewSettings?: Partial<TargetCardViewSettings>;
}

export interface ScanHistoryRecord {
  id: string;
  profileId?: string;
  profileName: string;
  codeStylePreset?: CodeStylePreset;
  customCodeStyleTemplate?: string;
  sourceMode: TargetSourceMode;
  targetApp: string;
  timestamp: number;
  totalTargets: number;
  resolvedCount: number;
  items: {
    id?: string;
    customName?: string;
    groupName?: string;
    subGroupName?: string;
    assemblyName?: string;
    className?: string;
    memberName?: string;
    kind?: 'FIELD' | 'METHOD';
    comment?: string;
    offsetHex?: string;
    rvaHex?: string;
    vaHex?: string;
    typeName?: string;
    signature?: string;
    resolvedViaFallback?: boolean;
    resolvedClassName?: string;
    resolvedMemberName?: string;
    resolvedAssemblyName?: string;
    classIndex?: number;
    memberIndex?: number;
    resolved?: boolean;
    isCustom?: boolean;
    defaultOffset?: string;
  }[];
}

export interface ProfileCardViewSettings {
  density: 'compact' | 'comfortable';
  tabletLayout: 'list' | 'grid';
  showDescription: boolean;
  showTargetCount: boolean;
  showTargetChips: boolean;
  showActiveBadge: boolean;
  showActionButtons: boolean;
  showOpenIndicator: boolean;
  expandAllDescriptions?: boolean;
}

export const DEFAULT_PROFILE_VIEW_SETTINGS: ProfileCardViewSettings = {
  density: 'compact',
  tabletLayout: 'list',
  showDescription: true,
  showTargetCount: true,
  showTargetChips: true,
  showActiveBadge: true,
  showActionButtons: true,
  showOpenIndicator: true,
  expandAllDescriptions: false,
};

export interface TargetCardViewSettings {
  showFallbacks: boolean;
  showCustomName: boolean;
  showAssemblyName?: boolean;
  showKindBadge: boolean;
  showComments: boolean;
  showGroups?: boolean;
  showResolvedOffset?: boolean;
  showStorageProfileSelect?: boolean;
  density: 'compact' | 'comfortable';
  tabletLayout?: 'grid' | 'list';
  showTargetBanner?: boolean;
  showScanLogCard?: boolean;
  expandAllDescriptions?: boolean;
}

export const DEFAULT_TARGET_VIEW_SETTINGS: TargetCardViewSettings = {
  showFallbacks: false,
  showCustomName: true,
  showAssemblyName: true,
  showKindBadge: false,
  showComments: true,
  showGroups: true,
  showResolvedOffset: true,
  showStorageProfileSelect: true,
  density: 'compact',
  tabletLayout: 'list',
  showTargetBanner: true,
  showScanLogCard: true,
  expandAllDescriptions: false,
};

export interface HistoryCardViewSettings {
  tabletLayout: 'list' | 'grid';
  density: 'compact' | 'comfortable';
  showCodeStyleBadge: boolean;
  showMetadata: boolean;
  showOffsetTags: boolean;
  showQuickActions: boolean;
}

export const DEFAULT_HISTORY_VIEW_SETTINGS: HistoryCardViewSettings = {
  tabletLayout: 'list',
  density: 'compact',
  showCodeStyleBadge: false,
  showMetadata: true,
  showOffsetTags: false,
  showQuickActions: true,
};

export interface DumpParseProgress {
  fileName: string;
  fileSizeMb: number;
  percent: number;
  processedBytes: number;
  totalBytes: number;
  classesCount: number;
  methodsCount: number;
  fieldsCount: number;
  typeInfosCount?: number;
  stage: string;
}

export interface TargetSubGroup {
  subGroupName: string | null;
  items: WatchlistTargetItem[];
}

export interface TargetGroup {
  groupName: string | null;
  subGroups: TargetSubGroup[];
  totalCount: number;
}
