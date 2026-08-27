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

export enum MethodAnalysisSection {
  INSTRUCTIONS = 0,
  CALLS = 1,
  CALLERS = 2,
}

export enum MethodAnalysisStatus {
  COMPLETE = 0,
  PARTIAL_CONTROL_FLOW = 1,
  PARTIAL_LIMIT = 2,
  UNAVAILABLE = 3,
}

export enum InstructionFlowKind {
  NONE = 0,
  DIRECT_CALL = 1,
  DIRECT_BRANCH = 2,
  INDIRECT_CALL = 3,
  INDIRECT_BRANCH = 4,
}

export enum InstructionAddressMode {
  RVA = 'RVA',
  VA = 'VA',
}

export enum MethodCopyTarget {
  RVA = 'RVA',
  VA = 'VA',
  SIGNATURE = 'SIGNATURE',
  NAME = 'NAME',
  OFFSET = 'OFFSET',
}

export enum ClassTab {
  FIELDS = 'FIELDS',
  METHODS = 'METHODS',
}

export enum CallGraphDirection {
  CALLS = 'CALLS',
  CALLERS = 'CALLERS',
}

export enum DirectoryLevel {
  ASSEMBLIES = 'ASSEMBLIES',
  NAMESPACES = 'NAMESPACES',
  CLASSES = 'CLASSES',
}

export enum BrowserEntryKind {
  ASSEMBLY = 'ASSEMBLY',
  NAMESPACE = 'NAMESPACE',
  CLASS = 'CLASS',
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

export interface InstructionDescriptor {
  address: number;
  rva?: number;
  bytes: string;
  mnemonic: string;
  operands: string;
  flowKind: InstructionFlowKind;
  targetInstructionIndex?: number;
  target?: MethodReferenceDescriptor;
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
}

export interface BrowserEntryViewData {
  id: string;
  kind: BrowserEntryKind;
  label: string;
  secondaryLabel?: string;
  index: number;
}

export interface FieldViewData {
  id: number;
  name: string;
  typeLabel: string;
  offsetLabel?: string;
  isStatic?: boolean;
}

export interface MethodViewData {
  id: number;
  classIndex: number;
  name: string;
  signature?: string;
  rvaLabel?: string;
  addressLabel?: string;
  rva?: number;
  address?: number;
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

export interface CallGraphNodeViewData {
  id: string;
  classIndex?: number;
  methodIndex?: number;
  name: string;
  ownerName?: string;
  signature?: string;
  address: number;
  addressLabel: string;
  rva?: number;
  rvaLabel?: string;
  isRoot: boolean;
  canOpen: boolean;
  depth: number;
  callCount: number;
  callerCount: number;
  callsExpanded: boolean;
  callersExpanded: boolean;
  isLoading?: boolean;
}

export interface CallGraphEdgeViewData {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  callSiteRva?: string;
}

export interface CallGraphPosition {
  x: number;
  y: number;
}

export interface BreadcrumbViewData {
  id: string;
  label: string;
  level: DirectoryLevel | 'CLASS_DETAILS';
  targetIndex?: number;
}

export type ManagerInfoDestination = 'about' | 'credits' | 'licenses' | 'dump';

export type TargetSourceMode = 'live' | 'storage';

export interface WatchlistTargetItem {
  id: string;
  customName?: string;
  className: string;
  memberName: string;
  kind: 'FIELD' | 'METHOD';
  comment?: string;
  fallbackClassNames?: string[];
  fallbackMemberNames?: string[];
  // Resolved scan properties:
  resolved?: boolean;
  resolvedViaFallback?: boolean;
  resolvedClassName?: string;
  resolvedMemberName?: string;
  offsetHex?: string;
  rvaHex?: string;
  vaHex?: string;
  typeName?: string;
  signature?: string;
  classIndex?: number;
  memberIndex?: number;
  lastScannedAt?: number;
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
    className: string;
    memberName: string;
    kind: 'FIELD' | 'METHOD';
    comment?: string;
    offsetHex?: string;
    rvaHex?: string;
    vaHex?: string;
    typeName?: string;
    signature?: string;
    resolvedViaFallback?: boolean;
    resolvedClassName?: string;
    resolvedMemberName?: string;
    classIndex?: number;
    memberIndex?: number;
    resolved?: boolean;
  }[];
}
