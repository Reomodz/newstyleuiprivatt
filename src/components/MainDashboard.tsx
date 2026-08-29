import React, { useState, useRef } from 'react';
import {
  ProcessDescriptor,
  TargetSourceMode,
  WatchlistProfile,
  WatchlistTargetItem,
  ScanHistoryRecord,
  CodeStylePreset,
} from '../types';
import { il2cppEngine } from '../services/il2cppEngine';
import {
  FolderOpen,
  Cpu,
  Play,
  BookmarkPlus,
  Trash2,
  Copy,
  AlertCircle,
  Plus,
  Search,
  History,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Upload,
  Sliders,
  SlidersHorizontal,
  Settings2,
  RotateCcw,
  Pencil,
  Sparkles,
  ShieldCheck,
  X,
  Download,
  Terminal,
  Share2,
  RefreshCw,
  Eye,
  EyeOff,
  MessageSquare,
  Layers,
  Code2,
  Check,
  FileCode,
} from 'lucide-react';
import {
  CODE_STYLE_PRESETS,
  formatTargetCodeSnippet,
  getCodeTemplate,
  generateScanHistoryCode,
} from '../utils/codeFormatter';

interface MainDashboardProps {
  currentProcess: ProcessDescriptor | null;
  storageDumpName?: string | null;
  onStorageDumpLoaded?: (fileName: string | null) => void;
  onOpenProcessPicker: () => void;
  onNavigateToBrowser?: (classIndex?: number) => void;
  onCopyText: (text: string, label: string) => void;
  showToast: (msg: string) => void;
}

export interface TargetCardViewSettings {
  showFallbacks: boolean;
  showClassName: boolean;
  showMemberName: boolean;
  showCustomName: boolean;
  showKindBadge: boolean;
  showComments: boolean;
  density: 'compact' | 'comfortable';
  tabletLayout?: 'grid' | 'list';
  showTargetBanner?: boolean;
  showScanLogCard?: boolean;
}

const DEFAULT_TARGET_VIEW_SETTINGS: TargetCardViewSettings = {
  showFallbacks: false,
  showClassName: false,
  showMemberName: false,
  showCustomName: true,
  showKindBadge: false,
  showComments: true,
  density: 'comfortable',
  tabletLayout: 'list',
  showTargetBanner: true,
  showScanLogCard: true,
};

const DEFAULT_SCAN_HISTORY: ScanHistoryRecord[] = [
  {
    id: 'scan_player_health_1',
    profileId: 'prof_player_stats',
    profileName: 'Player & Health Offsets',
    codeStylePreset: 'cpp_constexpr',
    sourceMode: 'live',
    targetApp: 'com.game.sample (PID 2401)',
    timestamp: Date.now() - 3600000,
    totalTargets: 6,
    resolvedCount: 6,
    items: [
      {
        id: 't_1',
        customName: 'PlayerMoveSpeed',
        className: 'PlayerController',
        memberName: 'moveSpeed',
        kind: 'FIELD',
        comment: 'Movement speed float velocity multiplier',
        offsetHex: '0x18',
        typeName: 'System.Single',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'moveSpeed',
        resolved: true,
      },
      {
        id: 't_2',
        customName: 'PlayerHealth',
        className: 'PlayerController',
        memberName: 'health',
        kind: 'FIELD',
        comment: 'Current player hit points integer',
        offsetHex: '0x20',
        typeName: 'System.Int32',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'health',
        resolved: true,
      },
      {
        id: 't_3',
        customName: 'MaxPlayerHealth',
        className: 'PlayerController',
        memberName: 'maxHealth',
        kind: 'FIELD',
        comment: 'Maximum hit points cap integer',
        offsetHex: '0x24',
        typeName: 'System.Int32',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'maxHealth',
        resolved: true,
      },
      {
        id: 't_4',
        customName: 'IsGodModeActive',
        className: 'PlayerController',
        memberName: 'isInvulnerable',
        kind: 'FIELD',
        comment: 'Invulnerability state boolean flag',
        offsetHex: '0x28',
        typeName: 'System.Boolean',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'isInvulnerable',
        resolved: true,
      },
      {
        id: 't_5',
        customName: 'TakeDamageHook',
        className: 'PlayerController',
        memberName: 'TakeDamage',
        kind: 'METHOD',
        comment: 'Damage reception function pointer',
        rvaHex: '0x0182E450',
        vaHex: '0x7B4282E450',
        signature: 'public void TakeDamage(int amount, bool isCritical)',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'TakeDamage',
        resolved: true,
      },
      {
        id: 't_6',
        customName: 'JumpRoutine',
        className: 'PlayerController',
        memberName: 'Jump',
        kind: 'METHOD',
        comment: 'Jump trigger function (hook target for infinite jumps)',
        rvaHex: '0x0182E880',
        vaHex: '0x7B4282E880',
        signature: 'public void Jump()',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'Jump',
        resolved: true,
      },
    ],
  },
  {
    id: 'scan_combat_2',
    profileId: 'prof_combat',
    profileName: 'Combat & Damage Modifiers',
    codeStylePreset: 'cs_const',
    sourceMode: 'storage',
    targetApp: 'dump.cs storage',
    timestamp: Date.now() - 7200000,
    totalTargets: 5,
    resolvedCount: 5,
    items: [
      {
        id: 't_7',
        customName: 'AttackPower',
        className: 'CombatManager',
        memberName: 'attackPower',
        kind: 'FIELD',
        comment: 'Base weapon damage multiplier float',
        offsetHex: '0x18',
        typeName: 'System.Single',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'attackPower',
        resolved: true,
      },
      {
        id: 't_8',
        customName: 'DefenseMultiplier',
        className: 'CombatManager',
        memberName: 'defenseMultiplier',
        kind: 'FIELD',
        comment: 'Incoming damage reduction multiplier float',
        offsetHex: '0x1C',
        typeName: 'System.Single',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'defenseMultiplier',
        resolved: true,
      },
      {
        id: 't_9',
        customName: 'CriticalStrikeRate',
        className: 'CombatManager',
        memberName: 'criticalRate',
        kind: 'FIELD',
        comment: 'Critical strike probability (1.0 = 100% crit)',
        offsetHex: '0x20',
        typeName: 'System.Single',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'criticalRate',
        resolved: true,
      },
      {
        id: 't_10',
        customName: 'HitComboCount',
        className: 'CombatManager',
        memberName: 'comboCount',
        kind: 'FIELD',
        comment: 'Active combo hits accumulator integer',
        offsetHex: '0x24',
        typeName: 'System.Int32',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'comboCount',
        resolved: true,
      },
      {
        id: 't_11',
        customName: 'ApplyDamageRoutine',
        className: 'CombatManager',
        memberName: 'ApplyDamage',
        kind: 'METHOD',
        comment: 'Main combat damage calculation engine',
        rvaHex: '0x0188F3A0',
        vaHex: '0x7B4288F3A0',
        signature: 'public void ApplyDamage(object target, float damage)',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'ApplyDamage',
        resolved: true,
      },
    ],
  },
];

const DEFAULT_PROFILES: WatchlistProfile[] = [
  {
    id: 'prof_player_stats',
    name: 'Player & Health Offsets',
    description: 'Core combat, movement speed, jump impulse, and health pointers with fallback support',
    targetApp: 'com.game.sample',
    codeStylePreset: 'cpp_constexpr',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 3600000,
    items: [
      {
        id: 't_1',
        customName: 'PlayerMoveSpeed',
        className: 'PlayerController',
        memberName: 'moveSpeed',
        kind: 'FIELD',
        comment: 'Movement speed float velocity multiplier',
        fallbackClassNames: ['PlayerMovement', 'CharacterController', 'ActorController'],
        fallbackMemberNames: ['speed', 'm_Speed', 'walkSpeed'],
        resolved: true,
        offsetHex: '0x18',
        typeName: 'System.Single',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'moveSpeed',
        classIndex: 0,
        memberIndex: 0,
        lastScannedAt: Date.now() - 3600000,
      },
      {
        id: 't_2',
        customName: 'PlayerHealth',
        className: 'PlayerController',
        memberName: 'health',
        kind: 'FIELD',
        comment: 'Current player hit points integer',
        fallbackClassNames: ['PlayerStats', 'HealthComponent', 'LivingEntity'],
        fallbackMemberNames: ['currentHealth', 'hp', 'm_CurrentHealth'],
        resolved: true,
        offsetHex: '0x20',
        typeName: 'System.Int32',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'health',
        classIndex: 0,
        memberIndex: 2,
        lastScannedAt: Date.now() - 3600000,
      },
      {
        id: 't_3',
        customName: 'MaxHealthCap',
        className: 'PlayerController',
        memberName: 'maxHealth',
        kind: 'FIELD',
        comment: 'Maximum player hit points capacity',
        fallbackClassNames: ['PlayerStats', 'LivingEntity'],
        fallbackMemberNames: ['maxHp', 'totalHealth'],
        resolved: true,
        offsetHex: '0x24',
        typeName: 'System.Int32',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'maxHealth',
        classIndex: 0,
        memberIndex: 3,
        lastScannedAt: Date.now() - 3600000,
      },
      {
        id: 't_4',
        customName: 'JumpImpulse',
        className: 'PlayerController',
        memberName: 'jumpForce',
        kind: 'FIELD',
        comment: 'Vertical jump force power float',
        fallbackClassNames: ['PlayerMovement', 'CharacterController'],
        fallbackMemberNames: ['jumpPower', 'jumpVelocity'],
        resolved: true,
        offsetHex: '0x1C',
        typeName: 'System.Single',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'jumpForce',
        classIndex: 0,
        memberIndex: 1,
        lastScannedAt: Date.now() - 3600000,
      },
      {
        id: 't_5',
        customName: 'TakeDamageHook',
        className: 'PlayerController',
        memberName: 'TakeDamage',
        kind: 'METHOD',
        comment: 'Damage receiving method (hook target for god mode)',
        fallbackClassNames: ['DamageHandler', 'HealthComponent'],
        fallbackMemberNames: ['ApplyDamage', 'OnDamageReceived', 'ReceiveDamage'],
        resolved: true,
        rvaHex: '0x0182EA10',
        vaHex: '0x7B4282EA10',
        signature: 'public void TakeDamage(int amount, bool isCritical)',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'TakeDamage',
        classIndex: 0,
        memberIndex: 4,
        lastScannedAt: Date.now() - 3600000,
      },
      {
        id: 't_6',
        customName: 'JumpRoutine',
        className: 'PlayerController',
        memberName: 'Jump',
        kind: 'METHOD',
        comment: 'Jump trigger function (hook target for infinite jumps)',
        fallbackClassNames: ['PlayerMovement', 'ActorController'],
        fallbackMemberNames: ['DoJump', 'PerformJump'],
        resolved: true,
        rvaHex: '0x0182E880',
        vaHex: '0x7B4282E880',
        signature: 'public void Jump()',
        resolvedClassName: 'PlayerController',
        resolvedMemberName: 'Jump',
        classIndex: 0,
        memberIndex: 3,
        lastScannedAt: Date.now() - 3600000,
      },
    ],
  },
  {
    id: 'prof_combat',
    name: 'Combat & Damage Modifiers',
    description: 'Attack power multiplier, crit rate, defense scaling, and hit combo counters',
    targetApp: 'com.game.sample',
    codeStylePreset: 'cs_const',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 7200000,
    items: [
      {
        id: 't_7',
        customName: 'AttackPower',
        className: 'CombatManager',
        memberName: 'attackPower',
        kind: 'FIELD',
        comment: 'Base weapon damage multiplier float',
        fallbackClassNames: ['WeaponManager', 'DamageController'],
        fallbackMemberNames: ['damageMultiplier', 'baseDamage', 'damage'],
        resolved: true,
        offsetHex: '0x18',
        typeName: 'System.Single',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'attackPower',
        classIndex: 2,
        memberIndex: 0,
        lastScannedAt: Date.now() - 7200000,
      },
      {
        id: 't_8',
        customName: 'DefenseMultiplier',
        className: 'CombatManager',
        memberName: 'defenseMultiplier',
        kind: 'FIELD',
        comment: 'Incoming damage reduction multiplier float',
        fallbackClassNames: ['ArmorManager', 'HealthController'],
        fallbackMemberNames: ['damageResistance', 'defense', 'armorScale'],
        resolved: true,
        offsetHex: '0x1C',
        typeName: 'System.Single',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'defenseMultiplier',
        classIndex: 2,
        memberIndex: 1,
        lastScannedAt: Date.now() - 7200000,
      },
      {
        id: 't_9',
        customName: 'CriticalStrikeRate',
        className: 'CombatManager',
        memberName: 'criticalRate',
        kind: 'FIELD',
        comment: 'Critical strike probability (1.0 = 100% crit)',
        fallbackClassNames: ['StatsManager', 'CombatStats'],
        fallbackMemberNames: ['critChance', 'criticalProbability', 'critRate'],
        resolved: true,
        offsetHex: '0x20',
        typeName: 'System.Single',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'criticalRate',
        classIndex: 2,
        memberIndex: 2,
        lastScannedAt: Date.now() - 7200000,
      },
      {
        id: 't_10',
        customName: 'HitComboCount',
        className: 'CombatManager',
        memberName: 'comboCount',
        kind: 'FIELD',
        comment: 'Active combo hits accumulator integer',
        fallbackClassNames: ['ComboManager', 'ScoreManager'],
        fallbackMemberNames: ['currentCombo', 'hitCount', 'streakCount'],
        resolved: true,
        offsetHex: '0x24',
        typeName: 'System.Int32',
        resolvedClassName: 'CombatManager',
        resolvedMemberName: 'comboCount',
        classIndex: 2,
        memberIndex: 3,
        lastScannedAt: Date.now() - 7200000,
      },
    ],
  },
  {
    id: 'prof_engine',
    name: 'Game Engine & Transform Pointers',
    description: 'Match state, pause flags, score mutators, and 3D coordinate vectors',
    targetApp: 'com.game.sample',
    codeStylePreset: 'cpp_constexpr',
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 14400000,
    items: [
      {
        id: 't_11',
        customName: 'MatchGameState',
        className: 'GameManager',
        memberName: 'gameState',
        kind: 'FIELD',
        comment: 'Active match state enum (0=Lobby, 1=Playing, 2=Over)',
        fallbackClassNames: ['MatchManager', 'StateController'],
        fallbackMemberNames: ['matchState', 'currentGameState', 'state'],
        resolved: true,
        offsetHex: '0x18',
        typeName: 'System.Int32',
        resolvedClassName: 'GameManager',
        resolvedMemberName: 'gameState',
        classIndex: 1,
        memberIndex: 0,
        lastScannedAt: Date.now() - 14400000,
      },
      {
        id: 't_12',
        customName: 'MatchScore',
        className: 'GameManager',
        memberName: 'score',
        kind: 'FIELD',
        comment: 'Player match score integer',
        fallbackClassNames: ['ScoreManager', 'StatsTracker'],
        fallbackMemberNames: ['currentScore', 'points', 'playerScore'],
        resolved: true,
        offsetHex: '0x20',
        typeName: 'System.Int32',
        resolvedClassName: 'GameManager',
        resolvedMemberName: 'score',
        classIndex: 1,
        memberIndex: 2,
        lastScannedAt: Date.now() - 14400000,
      },
      {
        id: 't_13',
        customName: 'IsGamePaused',
        className: 'GameManager',
        memberName: 'isPaused',
        kind: 'FIELD',
        comment: 'Game engine pause state boolean flag',
        fallbackClassNames: ['TimeManager', 'PauseController'],
        fallbackMemberNames: ['paused', 'gamePaused', 'm_IsPaused'],
        resolved: true,
        offsetHex: '0x1C',
        typeName: 'System.Boolean',
        resolvedClassName: 'GameManager',
        resolvedMemberName: 'isPaused',
        classIndex: 1,
        memberIndex: 1,
        lastScannedAt: Date.now() - 14400000,
      },
      {
        id: 't_14',
        customName: 'AddScoreHook',
        className: 'GameManager',
        memberName: 'AddScore',
        kind: 'METHOD',
        comment: 'Score modification and event dispatcher routine',
        fallbackClassNames: ['ScoreManager', 'RewardController'],
        fallbackMemberNames: ['GiveScore', 'IncrementScore', 'GrantPoints'],
        resolved: true,
        rvaHex: '0x01901520',
        vaHex: '0x7B42901520',
        signature: 'public void AddScore(int points)',
        resolvedClassName: 'GameManager',
        resolvedMemberName: 'AddScore',
        classIndex: 1,
        memberIndex: 3,
        lastScannedAt: Date.now() - 14400000,
      },
      {
        id: 't_15',
        customName: 'TransformPosition',
        className: 'Transform',
        memberName: 'localPosition',
        kind: 'FIELD',
        comment: 'Object 3D Vector position in local space',
        fallbackClassNames: ['TransformComponent'],
        fallbackMemberNames: ['position', 'm_LocalPosition'],
        resolved: true,
        offsetHex: '0x18',
        typeName: 'UnityEngine.Vector3',
        resolvedClassName: 'Transform',
        resolvedMemberName: 'localPosition',
        classIndex: 4,
        memberIndex: 1,
        lastScannedAt: Date.now() - 14400000,
      },
    ],
  },
];

export const MainDashboard: React.FC<MainDashboardProps> = ({
  currentProcess,
  storageDumpName,
  onStorageDumpLoaded,
  onOpenProcessPicker,
  onCopyText,
  showToast,
}) => {
  // Dashboard Navigation State
  const [activeTab, setActiveTab] = useState<'target' | 'watchlist' | 'history'>('target');

  // Source Selection Mode: 'live' (Target Process) or 'storage' (dump.cs / file storage)
  const [sourceMode, setSourceMode] = useState<TargetSourceMode>('live');

  // Storage dump upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadedStorageFileName, setLoadedStorageFileName] = useState<string | null>(storageDumpName || null);
  const [isParsingDump, setIsParsingDump] = useState(false);
  const [parsedSummary, setParsedSummary] = useState<{
    classes: number;
    methods: number;
    fields: number;
  } | null>(null);

  // Profiles State
  const [profiles, setProfiles] = useState<WatchlistProfile[]>(() => {
    const vKey = 'il2cpp_watchlist_profiles_v4';
    const hasV4 = localStorage.getItem(vKey);
    if (hasV4) {
      const saved = localStorage.getItem('il2cpp_watchlist_profiles');
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
    // First time or upgraded version: initialize with DEFAULT_PROFILES
    localStorage.setItem(vKey, 'true');
    localStorage.setItem('il2cpp_watchlist_profiles', JSON.stringify(DEFAULT_PROFILES));
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(
    profiles[0]?.id || 'prof_player_stats'
  );

  // Profile drill-down navigation state: null shows all profiles list, string shows profile targets
  const [selectedProfileViewId, setSelectedProfileViewId] = useState<string | null>(null);

  // Profile JSON Import ref
  const profileImportInputRef = useRef<HTMLInputElement>(null);

  // Edit Profile Name Modal State
  const [editingProfile, setEditingProfile] = useState<WatchlistProfile | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileDesc, setEditProfileDesc] = useState('');
  const [editProfileCodeStyle, setEditProfileCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [editProfileCustomTemplate, setEditProfileCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');

  // Fallback Collapsible Toggles
  const [showAddFallbacks, setShowAddFallbacks] = useState(false);
  const [showEditFallbacks, setShowEditFallbacks] = useState(false);

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
    localStorage.setItem('il2cpp_scan_history', JSON.stringify(DEFAULT_SCAN_HISTORY));
    return DEFAULT_SCAN_HISTORY;
  });

  // Modal / Form States
  const [isNewProfileModalOpen, setIsNewProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');
  const [newProfileCodeStyle, setNewProfileCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [newProfileCustomTemplate, setNewProfileCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');

  const [isAddTargetModalOpen, setIsAddTargetModalOpen] = useState(false);
  const [newTargetCustomName, setNewTargetCustomName] = useState('');
  const [newTargetClassName, setNewTargetClassName] = useState('');
  const [newTargetMemberName, setNewTargetMemberName] = useState('');
  const [newTargetKind, setNewTargetKind] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [newTargetComment, setNewTargetComment] = useState('');
  const [newTargetFallbackClasses, setNewTargetFallbackClasses] = useState<string[]>([]);
  const [newTargetFallbackMembers, setNewTargetFallbackMembers] = useState<string[]>([]);
  const [tempFallbackClassInput, setTempFallbackClassInput] = useState('');
  const [tempFallbackMemberInput, setTempFallbackMemberInput] = useState('');

  // Edit Target Modal State
  const [editingTargetItem, setEditingTargetItem] = useState<WatchlistTargetItem | null>(null);
  const [editTargetCustomName, setEditTargetCustomName] = useState('');
  const [editTargetClassName, setEditTargetClassName] = useState('');
  const [editTargetMemberName, setEditTargetMemberName] = useState('');
  const [editTargetKind, setEditTargetKind] = useState<'FIELD' | 'METHOD'>('FIELD');
  const [editTargetComment, setEditTargetComment] = useState('');
  const [editTargetFallbackClasses, setEditTargetFallbackClasses] = useState<string[]>([]);
  const [editTargetFallbackMembers, setEditTargetFallbackMembers] = useState<string[]>([]);
  const [editTempFallbackClassInput, setEditTempFallbackClassInput] = useState('');
  const [editTempFallbackMemberInput, setEditTempFallbackMemberInput] = useState('');

  // Live filter inside watchlist
  const [watchlistFilter, setWatchlistFilter] = useState('');

  // Target Card View & Display Settings (Custom Card Options)
  const [cardViewSettings, setCardViewSettings] = useState<TargetCardViewSettings>(() => {
    try {
      const saved = localStorage.getItem('il2cpp_target_view_settings_v2');
      if (saved) {
        return { ...DEFAULT_TARGET_VIEW_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // fallback
    }
    return DEFAULT_TARGET_VIEW_SETTINGS;
  });

  const updateCardViewSettings = (patch: Partial<TargetCardViewSettings>) => {
    setCardViewSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem('il2cpp_target_view_settings_v2', JSON.stringify(next));
      return next;
    });
  };

  const [isCardSettingsModalOpen, setIsCardSettingsModalOpen] = useState(false);

  // Target Detail Modal State (View Mode)
  const [viewingTargetItem, setViewingTargetItem] = useState<WatchlistTargetItem | null>(null);

  // History Detail Sheet / Modal State
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState<ScanHistoryRecord | null>(null);
  const [expandedHistoryItems, setExpandedHistoryItems] = useState<Set<number>>(new Set());
  const [isHistoryStatsExpanded, setIsHistoryStatsExpanded] = useState(false);
  const [historyModalCodeStyle, setHistoryModalCodeStyle] = useState<CodeStylePreset>('cpp_constexpr');
  const [historyModalCustomTemplate, setHistoryModalCustomTemplate] = useState('constexpr uintptr_t {name} = {offset};');
  const [historyModalTab, setHistoryModalTab] = useState<'targets' | 'code'>('targets');

  const handleOpenHistoryRecord = (rec: ScanHistoryRecord) => {
    setSelectedHistoryRecord(rec);
    setExpandedHistoryItems(new Set());
    setIsHistoryStatsExpanded(false);
    setHistoryModalCodeStyle(rec.codeStylePreset || 'cpp_constexpr');
    setHistoryModalCustomTemplate(rec.customCodeStyleTemplate || 'constexpr uintptr_t {name} = {offset};');
    setHistoryModalTab('targets');
  };

  // History Clear All Confirmation Modal State
  const [isConfirmClearHistoryOpen, setIsConfirmClearHistoryOpen] = useState(false);

  // Live Scanning & Progress Logs State
  const [isScanning, setIsScanning] = useState(false);
  const [scanLogs, setScanLogs] = useState<Array<{ text: string; type: 'info' | 'success' | 'warn' | 'error'; time: string }>>([
    { text: 'IL2CPP Scanner initialized and ready.', type: 'info', time: '00:00:00' },
  ]);

  // Active Profile
  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  const saveProfiles = (updated: WatchlistProfile[]) => {
    setProfiles(updated);
    localStorage.setItem('il2cpp_watchlist_profiles', JSON.stringify(updated));
  };

  const saveHistory = (updatedHistory: ScanHistoryRecord[]) => {
    setScanHistory(updatedHistory);
    localStorage.setItem('il2cpp_scan_history', JSON.stringify(updatedHistory));
  };

  // Perform Scan on Watchlist with Fallback Support & Live Logs
  const handleScanProfile = async () => {
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
      // Build search candidate class names (primary first, then fallbacks)
      const candidateClasses = [
        item.className.trim(),
        ...(item.fallbackClassNames || []).map((s) => s.trim()),
      ].filter((s) => s.length > 0);

      // Build search candidate member names (primary first, then fallbacks)
      const candidateMembers = [
        item.memberName.trim(),
        ...(item.fallbackMemberNames || []).map((s) => s.trim()),
      ].filter((s) => s.length > 0);

      // Try finding match among candidate combinations
      let matchedClass: typeof allClasses[0] | undefined;
      let matchedField: any | undefined;
      let matchedMethod: any | undefined;
      let matchedClassName = '';
      let matchedMemberName = '';

      for (const cName of candidateClasses) {
        const foundCls = allClasses.find((c) => c.name.toLowerCase() === cName.toLowerCase());
        if (!foundCls) continue;

        if (item.kind === 'FIELD') {
          const fields = il2cppEngine.getFields(foundCls.index);
          for (const mName of candidateMembers) {
            const foundF = fields.find((f) => f.name.toLowerCase() === mName.toLowerCase());
            if (foundF && foundF.offset !== undefined) {
              matchedClass = foundCls;
              matchedField = foundF;
              matchedClassName = foundCls.name;
              matchedMemberName = foundF.name;
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
              matchedClassName = foundCls.name;
              matchedMemberName = foundM.name;
              break;
            }
          }
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
          addLog(`[FALLBACK] ${item.className}.${item.memberName} -> Matched ${matchedClassName}.${matchedMemberName} @ ${offsetHex}`, 'success');
        } else {
          addLog(`[MATCH] ${matchedClassName}.${matchedMemberName} -> Offset: ${offsetHex}`, 'success');
        }

        return {
          ...item,
          resolved: true,
          resolvedViaFallback: isFallbackUsed,
          resolvedClassName: matchedClassName,
          resolvedMemberName: matchedMemberName,
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
          addLog(`[FALLBACK] ${item.className}.${item.memberName} -> Matched ${matchedClassName}.${matchedMemberName} @ RVA ${rvaStr}`, 'success');
        } else {
          addLog(`[MATCH] ${matchedClassName}.${matchedMemberName} -> RVA: ${rvaStr}`, 'success');
        }

        return {
          ...item,
          resolved: true,
          resolvedViaFallback: isFallbackUsed,
          resolvedClassName: matchedClassName,
          resolvedMemberName: matchedMemberName,
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
        classIndex: i.classIndex,
        memberIndex: i.memberIndex,
        resolved: i.resolved,
      })),
    };

    const nextHistory = [newRecord, ...scanHistory.slice(0, 49)];
    saveHistory(nextHistory);

    showToast(`Scan complete: ${resolvedCount}/${activeProfile.items.length} targets resolved!`);
  };

  // Handle Storage dump.cs File Upload
  const handleDumpFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingDump(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = il2cppEngine.parseDumpCsText(content, file.name);
        setLoadedStorageFileName(file.name);
        if (onStorageDumpLoaded) {
          onStorageDumpLoaded(file.name);
        }
        setParsedSummary({
          classes: result.classesCount,
          methods: result.methodsCount,
          fields: result.fieldsCount,
        });
        setIsParsingDump(false);
        showToast(`Loaded ${file.name} (${result.classesCount} classes parsed)`);
      } catch (err) {
        setIsParsingDump(false);
        showToast('Failed to parse dump file');
      }
    };
    reader.readAsText(file);
  };

  // Create Profile
  const handleCreateProfile = () => {
    if (!newProfileName.trim()) return;
    const newProf: WatchlistProfile = {
      id: `prof_${Date.now()}`,
      name: newProfileName.trim(),
      description: newProfileDesc.trim() || 'Custom offset profile',
      codeStylePreset: newProfileCodeStyle,
      customCodeStyleTemplate: newProfileCustomTemplate.trim() || undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [],
    };
    const next = [newProf, ...profiles];
    saveProfiles(next);
    setActiveProfileId(newProf.id);
    setSelectedProfileViewId(newProf.id);
    setNewProfileName('');
    setNewProfileDesc('');
    setNewProfileCodeStyle('cpp_constexpr');
    setNewProfileCustomTemplate('constexpr uintptr_t {name} = {offset};');
    setIsNewProfileModalOpen(false);
    showToast(`Created profile "${newProf.name}"`);
  };

  // Open Edit Profile Name Modal
  const handleOpenEditProfile = (prof: WatchlistProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingProfile(prof);
    setEditProfileName(prof.name);
    setEditProfileDesc(prof.description || '');
    setEditProfileCodeStyle(prof.codeStylePreset || 'cpp_constexpr');
    setEditProfileCustomTemplate(prof.customCodeStyleTemplate || 'constexpr uintptr_t {name} = {offset};');
  };

  // Save Edit Profile Name & Code Style
  const handleSaveEditProfile = () => {
    if (!editingProfile || !editProfileName.trim()) return;
    const updated = profiles.map((p) =>
      p.id === editingProfile.id
        ? {
            ...p,
            name: editProfileName.trim(),
            description: editProfileDesc.trim(),
            codeStylePreset: editProfileCodeStyle,
            customCodeStyleTemplate: editProfileCustomTemplate.trim() || undefined,
            updatedAt: Date.now(),
          }
        : p
    );
    saveProfiles(updated);
    setEditingProfile(null);
    showToast(`Updated profile "${editProfileName.trim()}"`);
  };

  // Restore / Reset to Starter Profiles (preserved for future use)
  // const handleResetDefaultProfiles = () => {
  //   saveProfiles(DEFAULT_PROFILES);
  //   setActiveProfileId(DEFAULT_PROFILES[0].id);
  //   showToast('Loaded 3 starter profiles with 15 verified targets');
  // };

  // Export / Share Profile as JSON
  const handleExportProfile = (prof: WatchlistProfile, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: {
        name: prof.name,
        description: prof.description,
        targetApp: prof.targetApp,
        codeStylePreset: prof.codeStylePreset || 'cpp_constexpr',
        customCodeStyleTemplate: prof.customCodeStyleTemplate,
        items: prof.items.map((item) => ({
          customName: item.customName,
          className: item.className,
          memberName: item.memberName,
          kind: item.kind,
          comment: item.comment,
          fallbackClassNames: item.fallbackClassNames,
          fallbackMemberNames: item.fallbackMemberNames,
        })),
      },
    };

    const jsonStr = JSON.stringify(exportData, null, 2);

    try {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${prof.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_profile.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback
    }

    navigator.clipboard?.writeText(jsonStr).catch(() => {});
    showToast(`Exported "${prof.name}" JSON file to your downloads & clipboard!`);
  };

  // Import Profile from JSON File
  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const profileData = parsed.profile || parsed;

        if (!profileData || !profileData.name || !Array.isArray(profileData.items)) {
          showToast('Invalid profile JSON format');
          return;
        }

        const newProfile: WatchlistProfile = {
          id: `prof_${Date.now()}`,
          name: profileData.name || 'Imported Profile',
          description: profileData.description || 'Imported profile offsets',
          targetApp: profileData.targetApp || 'com.game.sample',
          codeStylePreset: profileData.codeStylePreset || 'cpp_constexpr',
          customCodeStyleTemplate: profileData.customCodeStyleTemplate,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          items: profileData.items.map((it: any, idx: number) => ({
            id: `t_${Date.now()}_${idx}`,
            customName: it.customName || undefined,
            className: it.className || '',
            memberName: it.memberName || '',
            kind: it.kind === 'METHOD' ? 'METHOD' : 'FIELD',
            comment: it.comment || '',
            fallbackClassNames: Array.isArray(it.fallbackClassNames) ? it.fallbackClassNames : undefined,
            fallbackMemberNames: Array.isArray(it.fallbackMemberNames) ? it.fallbackMemberNames : undefined,
          })),
        };

        const updated = [newProfile, ...profiles];
        saveProfiles(updated);
        setActiveProfileId(newProfile.id);
        setSelectedProfileViewId(newProfile.id);
        showToast(`Imported profile "${newProfile.name}" (${newProfile.items.length} targets)`);
      } catch (err) {
        showToast('Failed to parse profile JSON file');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Delete Profile
  const handleDeleteProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      showToast('You must keep at least one profile.');
      return;
    }
    const next = profiles.filter((p) => p.id !== id);
    saveProfiles(next);
    if (activeProfileId === id) {
      setActiveProfileId(next[0].id);
    }
    if (selectedProfileViewId === id) {
      setSelectedProfileViewId(null);
    }
    showToast('Profile deleted');
  };

  // Open Edit Target Modal
  const handleOpenEditTarget = (item: WatchlistTargetItem) => {
    setEditingTargetItem(item);
    setEditTargetCustomName(item.customName || '');
    setEditTargetClassName(item.className);
    setEditTargetMemberName(item.memberName);
    setEditTargetKind(item.kind);
    setEditTargetComment(item.comment || '');
    const hasFallbacks =
      (item.fallbackClassNames && item.fallbackClassNames.length > 0) ||
      (item.fallbackMemberNames && item.fallbackMemberNames.length > 0);
    setEditTargetFallbackClasses(item.fallbackClassNames || []);
    setEditTargetFallbackMembers(item.fallbackMemberNames || []);
    setShowEditFallbacks(Boolean(hasFallbacks));
    setEditTempFallbackClassInput('');
    setEditTempFallbackMemberInput('');
  };

  // Save Edit Target
  const handleSaveEditTarget = () => {
    if (!editingTargetItem || !activeProfile || !editTargetClassName.trim() || !editTargetMemberName.trim()) return;

    const updatedItem: WatchlistTargetItem = {
      ...editingTargetItem,
      customName: editTargetCustomName.trim() || undefined,
      className: editTargetClassName.trim(),
      memberName: editTargetMemberName.trim(),
      kind: editTargetKind,
      comment: editTargetComment.trim() || undefined,
      fallbackClassNames: editTargetFallbackClasses.length > 0 ? editTargetFallbackClasses : undefined,
      fallbackMemberNames: editTargetFallbackMembers.length > 0 ? editTargetFallbackMembers : undefined,
      // Reset resolved states if key details changed
      resolved: false,
      offsetHex: undefined,
      rvaHex: undefined,
      vaHex: undefined,
      resolvedViaFallback: false,
      resolvedClassName: undefined,
      resolvedMemberName: undefined,
    };

    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id
        ? {
            ...p,
            items: p.items.map((it) => (it.id === editingTargetItem.id ? updatedItem : it)),
            updatedAt: Date.now(),
          }
        : p
    );
    saveProfiles(nextProfiles);

    setEditingTargetItem(null);
    showToast(`Updated target ${updatedItem.customName || `${updatedItem.className}.${updatedItem.memberName}`}`);
  };

  // Add Target Item to Active Profile
  const handleAddTarget = () => {
    if (!newTargetClassName.trim() || !newTargetMemberName.trim() || !activeProfile) return;

    const newItem: WatchlistTargetItem = {
      id: `t_${Date.now()}`,
      customName: newTargetCustomName.trim() || undefined,
      className: newTargetClassName.trim(),
      memberName: newTargetMemberName.trim(),
      kind: newTargetKind,
      comment: newTargetComment.trim() || undefined,
      fallbackClassNames: newTargetFallbackClasses.length > 0 ? newTargetFallbackClasses : undefined,
      fallbackMemberNames: newTargetFallbackMembers.length > 0 ? newTargetFallbackMembers : undefined,
    };

    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id ? { ...p, items: [...p.items, newItem], updatedAt: Date.now() } : p
    );
    saveProfiles(nextProfiles);

    setNewTargetCustomName('');
    setNewTargetClassName('');
    setNewTargetMemberName('');
    setNewTargetComment('');
    setNewTargetFallbackClasses([]);
    setNewTargetFallbackMembers([]);
    setTempFallbackClassInput('');
    setTempFallbackMemberInput('');
    setIsAddTargetModalOpen(false);
    showToast(`Added target ${newItem.customName || `${newItem.className}.${newItem.memberName}`}`);
  };

  // Remove Item
  const handleRemoveTargetItem = (itemId: string) => {
    if (!activeProfile) return;
    const nextProfiles = profiles.map((p) =>
      p.id === activeProfile.id
        ? { ...p, items: p.items.filter((i) => i.id !== itemId), updatedAt: Date.now() }
        : p
    );
    saveProfiles(nextProfiles);
    showToast('Target removed');
  };

  // Filtered items
  const displayedItems = activeProfile
    ? activeProfile.items.filter(
        (i) =>
          (i.customName && i.customName.toLowerCase().includes(watchlistFilter.toLowerCase())) ||
          i.className.toLowerCase().includes(watchlistFilter.toLowerCase()) ||
          i.memberName.toLowerCase().includes(watchlistFilter.toLowerCase()) ||
          (i.comment && i.comment.toLowerCase().includes(watchlistFilter.toLowerCase()))
      )
    : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#18181A] text-[#E2E2E4] overflow-hidden relative">
      {/* Top Tab Navigation (Responsive Bar / Card Style on Tablet & Big Screen) */}
      <div className="bg-[#1E1E20] border-b border-[#2D2D30] px-2 sm:px-4 pt-1.5 sm:pt-2 pb-1.5 shrink-0">
        <div className="max-w-5xl mx-auto flex md:bg-[#141416] md:p-1 md:rounded-2xl md:border md:border-[#2D2D30] md:shadow-inner">
          <button
            onClick={() => setActiveTab('target')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[11px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1.5 sm:gap-2 ${
              activeTab === 'target'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <Cpu className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Target Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[11px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1.5 sm:gap-2 ${
              activeTab === 'watchlist'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <BookmarkPlus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 sm:py-2.5 md:py-2 text-[11px] sm:text-xs md:text-sm font-semibold transition-all border-b-2 md:border-b-0 md:rounded-xl flex justify-center items-center gap-1.5 sm:gap-2 ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400 md:bg-indigo-600 md:text-white md:shadow-md'
                : 'border-transparent text-[#8E8E93] hover:text-[#E2E2E4] md:hover:bg-[#1C1C1F]'
            }`}
          >
            <History className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>History</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto w-full p-2.5 sm:p-4 flex flex-col gap-3 sm:gap-6 pb-24">
          {/* TAB 1: TARGET SETUP */}
          {activeTab === 'target' && (
            <div className="flex flex-col max-w-3xl mx-auto w-full gap-3 sm:gap-4 md:gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Target Setup Controls */}
              <div className="flex flex-col gap-2.5 sm:gap-4 w-full">
                {/* Dual Mode Switcher Tabs */}
                <div className="flex items-center gap-1 bg-[#141416] p-1 sm:p-1.5 rounded-lg sm:rounded-2xl border border-[#353538] shrink-0 mb-0.5 sm:mb-2 shadow-lg">
                  <button
                    onClick={() => setSourceMode('live')}
                    className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${
                      sourceMode === 'live'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    <Cpu className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Live Scan</span>
                  </button>

                  <button
                    onClick={() => setSourceMode('storage')}
                    className={`flex-1 flex justify-center items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-3 rounded-md sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${
                      sourceMode === 'storage'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    <FolderOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Storage Dump</span>
                  </button>
                </div>

                {/* Active Target Banner */}
                {cardViewSettings.showTargetBanner && (
                  <div className="flex flex-col bg-[#1E1E20] border border-[#2D2D30] rounded-lg sm:rounded-2xl p-2 sm:p-4 md:p-5 shadow-lg relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-0.5 sm:h-1 ${sourceMode === 'live' ? 'bg-indigo-500' : 'bg-sky-500'}`} />
                    {sourceMode === 'live' ? (
                      <div className="flex flex-col gap-1 sm:gap-2.5">
                        {currentProcess ? (
                          <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                <span className="text-[11px] sm:text-sm font-semibold text-[#E2E2E4] truncate">
                                  {currentProcess.appName}
                                </span>
                                <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                                  PID {currentProcess.pid}
                                </span>
                              </div>
                              <div className="text-[8px] sm:text-xs text-[#8E8E93] truncate">
                                Arch: {currentProcess.arch || 'arm64-v8a'} · Unity: {currentProcess.unityVersion || '2022.3'} · Memory mapped
                              </div>
                            </div>

                            <button
                              onClick={onOpenProcessPicker}
                              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-[#262629] hover:bg-[#323236] text-indigo-300 hover:text-white border border-[#3A3A3E] rounded-md sm:rounded-xl text-[9px] sm:text-xs font-semibold shrink-0 transition-colors shadow-sm"
                              title="Switch to another target process"
                            >
                              <RefreshCw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                              <span>Change</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 sm:gap-3">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-1 sm:gap-2">
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2.5 rounded-full bg-amber-400 shrink-0" />
                                <span className="text-[11px] sm:text-sm font-semibold text-[#E2E2E4]">
                                  No Live Process Selected
                                </span>
                              </div>
                              <div className="text-[8px] sm:text-xs text-[#8E8E93]">
                                Attach to a running game to scan live memory addresses
                              </div>
                            </div>

                            <button
                              onClick={onOpenProcessPicker}
                              className="w-full px-2 sm:px-4 py-1 sm:py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-medium transition-colors"
                            >
                              Select Process Target
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5 sm:gap-3">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2.5 rounded-full bg-sky-400 shrink-0" />
                            <span className="text-[11px] sm:text-sm font-semibold text-[#E2E2E4] truncate">
                              {loadedStorageFileName ? loadedStorageFileName : 'Load dump.cs from Storage'}
                            </span>
                            {loadedStorageFileName && (
                              <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20 shrink-0">
                                Loaded
                              </span>
                            )}
                          </div>
                          {parsedSummary ? (
                            <div className="flex flex-wrap gap-1 sm:gap-2 mt-0.5">
                              <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                                {parsedSummary.classes} Classes
                              </span>
                              <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                {parsedSummary.fields} Fields
                              </span>
                              <span className="text-[8px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {parsedSummary.methods} Methods
                              </span>
                            </div>
                          ) : (
                            <div className="text-[8px] sm:text-xs text-[#8E8E93] truncate">
                              Upload or pick a previously generated dump.cs file offline
                            </div>
                          )}
                        </div>

                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleDumpFileUpload}
                          accept=".cs,.txt,.dat"
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isParsingDump}
                          className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1.5 bg-[#262629] hover:bg-[#323236] text-sky-300 hover:text-white border border-[#3A3A3E] rounded-md sm:rounded-xl text-[9px] sm:text-xs font-semibold shrink-0 transition-colors shadow-sm"
                          title={loadedStorageFileName ? 'Upload or change dump.cs file' : 'Upload dump.cs file'}
                        >
                          {loadedStorageFileName ? (
                            <RefreshCw className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${isParsingDump ? 'animate-spin' : ''}`} />
                          ) : (
                            <Upload className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 ${isParsingDump ? 'animate-spin' : ''}`} />
                          )}
                          <span>{isParsingDump ? 'Parsing...' : loadedStorageFileName ? 'Change' : 'Upload'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {/* Compact Scan Profile Box & Trigger */}
              <div className="bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 pl-4 sm:pl-6 shadow-lg flex items-center justify-between gap-1.5 sm:gap-3 relative overflow-hidden">
                {/* Left Blue Accent Line */}
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-400 via-sky-400 to-indigo-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />

                {/* Small Box with Profile Name & Target Count */}
                <div className="relative flex-1 min-w-0">
                  <select
                    value={activeProfileId}
                    onChange={(e) => setActiveProfileId(e.target.value)}
                    className="w-full pl-2.5 sm:pl-3.5 pr-7 sm:pr-8 py-1 sm:py-2.5 bg-[#141416] hover:bg-[#18181B] border border-[#353538] focus:border-indigo-500 rounded-md sm:rounded-xl text-[9px] sm:text-xs font-bold text-[#E2E2E4] focus:outline-none appearance-none cursor-pointer truncate transition-colors"
                  >
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#1E1E20] text-[#E2E2E4]">
                        {p.name} ({p.items.length} targets)
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-[#8E8E93] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Scan Action Button */}
                <button
                  onClick={handleScanProfile}
                  disabled={isScanning || !activeProfile || activeProfile.items.length === 0}
                  className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-1 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-md sm:rounded-xl font-bold text-[9px] sm:text-xs shadow-md shadow-indigo-600/30 transition-all active:scale-98 shrink-0"
                >
                  <Play className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current ${isScanning ? 'animate-spin' : ''}`} />
                  <span>{isScanning ? 'Scanning...' : 'Start Scan'}</span>
                </button>
              </div>
              </div>

              {/* Live Scan Output & Execution Log Card (Full-width list style) */}
              {cardViewSettings.showScanLogCard && (
                <div className="bg-[#151517] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-lg flex flex-col gap-2 w-full min-h-[180px] max-h-[340px]">
                  <div className="flex items-center justify-between pb-2 border-b border-[#28282B]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                      <span className="text-[10px] sm:text-xs font-semibold text-[#E2E2E4]">Live Scan Log</span>
                    </div>
                    {isScanning && (
                      <span className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-amber-400 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Scanning...
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto font-mono text-[9px] sm:text-[11px] space-y-1.5 p-2 sm:p-3 bg-[#0E0E10] rounded-lg sm:rounded-xl border border-[#222225] select-text">
                    {scanLogs.map((log, index) => (
                      <div key={index} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-[#55555A] shrink-0">{log.time}</span>
                        <span
                          className={
                            log.type === 'success'
                              ? 'text-emerald-400 font-medium'
                              : log.type === 'warn'
                              ? 'text-amber-400 font-medium'
                              : log.type === 'error'
                              ? 'text-red-400 font-medium'
                              : 'text-[#A0A0A5]'
                          }
                        >
                          {log.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE (OFFSETS & WATCHLIST) */}
          {activeTab === 'watchlist' && (
            <div className="flex flex-col gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Hidden file input for importing profile JSON */}
              <input
                type="file"
                ref={profileImportInputRef}
                onChange={handleImportProfile}
                accept=".json,application/json"
                className="hidden"
              />

              {/* VIEW 1: PROFILES OVERVIEW (When no specific profile is opened) */}
              {selectedProfileViewId === null ? (
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Top Bar: Title, Import & Create Profile Button */}
                  <div className="flex items-center justify-between gap-2 bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-[#E2E2E4] truncate">Offset Profiles</span>
                        <span className="text-[10px] sm:text-xs text-[#8E8E93] truncate">{profiles.length} profiles</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <button
                        onClick={() => profileImportInputRef.current?.click()}
                        className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-2 bg-[#262629] hover:bg-[#323236] text-[#A0A0A5] hover:text-white border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-colors shadow-sm"
                        title="Import Profile JSON"
                      >
                        <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span>Import</span>
                      </button>

                      <button
                        onClick={() => setIsNewProfileModalOpen(true)}
                        className="flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-1 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all shadow-md shadow-indigo-600/30"
                        title="Create New Profile"
                      >
                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span>New</span>
                      </button>
                    </div>
                  </div>

                  {/* Profiles Cards List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {profiles.map((prof) => {
                      const isScanActive = prof.id === activeProfileId;
                      return (
                        <div
                          key={prof.id}
                          onClick={() => {
                            setActiveProfileId(prof.id);
                            setSelectedProfileViewId(prof.id);
                          }}
                          className={`bg-[#1E1E20] hover:bg-[#242428] border ${
                            isScanActive ? 'border-blue-500/50 shadow-md shadow-blue-500/5' : 'border-[#2D2D30] hover:border-blue-500/40'
                          } p-3 sm:p-4 pl-4 sm:pl-5 rounded-xl sm:rounded-2xl shadow-sm flex flex-col gap-1.5 sm:gap-4 cursor-pointer transition-all active:scale-[0.99] group/pcard relative overflow-hidden`}
                        >
                          {/* Profile Identity Blue Line Accent on Left Side */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
                              isScanActive
                                ? 'w-[2px] bg-gradient-to-b from-blue-400 via-sky-400 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.6)]'
                                : 'w-[1px] bg-gradient-to-b from-blue-500/80 to-indigo-500/60 group-hover/pcard:w-[2px] group-hover/pcard:from-blue-400 group-hover/pcard:to-sky-400 group-hover/pcard:shadow-[0_0_8px_rgba(59,130,246,0.45)]'
                            }`}
                          />

                          <div className="flex items-start justify-between gap-1.5 sm:gap-3">
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm sm:text-base text-[#E2E2E4] group-hover/pcard:text-blue-300 transition-colors">
                                  {prof.name}
                                </span>
                                {isScanActive && (
                                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 font-semibold">
                                    Active for Scan
                                  </span>
                                )}
                              </div>
                              {prof.description && (
                                <p className="text-[10px] sm:text-xs text-[#8E8E93] line-clamp-1">{prof.description}</p>
                              )}
                            </div>

                            {/* Profile Action Logos: Edit Name, Share/Export, Delete */}
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleOpenEditProfile(prof, e)}
                                className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-blue-400 bg-[#262629] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
                                title="Edit Profile Name"
                              >
                                <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>

                              <button
                                onClick={(e) => handleExportProfile(prof, e)}
                                className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-emerald-400 bg-[#262629] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
                                title="Export / Share Profile JSON"
                              >
                                <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>

                              {profiles.length > 1 && (
                                <button
                                  onClick={(e) => handleDeleteProfile(prof.id, e)}
                                  className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-red-400 bg-[#262629] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
                                  title="Delete Profile"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Target preview chips & summary footer */}
                          <div className="pt-2 border-t border-[#28282B] flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 flex-wrap font-mono text-[9px] sm:text-[11px]">
                              <span className="text-[9px] sm:text-[10px] font-sans px-1.5 sm:px-2 py-0.5 rounded bg-[#141416] text-[#A0A0A5] border border-[#353538]">
                                {prof.items.length} Targets
                              </span>
                              {prof.items.slice(0, 3).map((it) => (
                                <span
                                  key={it.id}
                                  className="px-1.5 sm:px-2 py-0.5 rounded bg-[#141416] text-[#8E8E93] border border-[#2B2B2E] truncate max-w-[130px]"
                                >
                                  {it.memberName}
                                </span>
                              ))}
                              {prof.items.length > 3 && (
                                <span className="text-[9px] sm:text-[10px] text-[#6C6C70]">+{prof.items.length - 3}</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-blue-400 group-hover/pcard:text-blue-300 ml-auto">
                              <span>Open Targets</span>
                              <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover/pcard:translate-x-0.5 transition-transform" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* VIEW 2: PROFILE TARGETS VIEW (Inside selected profile) */
                <div className="flex flex-col gap-3 sm:gap-4">
                  {/* Top Navigation & Profile Header with Back Button */}
                  <div className="flex items-center justify-between gap-1.5 sm:gap-3 bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl p-3 sm:p-4 pl-5 sm:pl-6 shadow-sm relative overflow-hidden">
                    {/* Left Blue Accent Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-400 via-sky-400 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

                    <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
                      {/* Back Logo Button */}
                      <button
                        onClick={() => setSelectedProfileViewId(null)}
                        className="p-1.5 sm:p-2.5 bg-[#262629] hover:bg-[#323236] text-[#E2E2E4] rounded-lg sm:rounded-xl border border-[#353538] transition-colors shrink-0 shadow-sm"
                        title="Back to All Profiles"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-[#E2E2E4] truncate">
                            {activeProfile?.name}
                          </span>
                          <span className="text-[10px] sm:text-xs font-mono px-1.5 sm:px-2 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                            {activeProfile?.items.length || 0}
                          </span>
                        </div>
                        {activeProfile?.description && (
                          <span className="text-[10px] sm:text-xs text-[#8E8E93] truncate">
                            {activeProfile.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenEditProfile(activeProfile)}
                        className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-indigo-400 bg-[#262629] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
                        title="Edit Profile & Code Style"
                      >
                        <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>

                      <button
                        onClick={() => handleExportProfile(activeProfile)}
                        className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-emerald-400 bg-[#262629] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
                        title="Export / Share Profile JSON"
                      >
                        <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Targets Search Filter */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" />
                      <input
                        type="text"
                        value={watchlistFilter}
                        onChange={(e) => setWatchlistFilter(e.target.value)}
                        placeholder="Search targets in profile..."
                        className="w-full pl-10 pr-4 py-2 sm:py-3 bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-[#E2E2E4] placeholder-[#6C6C70] focus:outline-none focus:border-indigo-500 shadow-sm"
                      />
                    </div>
                    <button
                      onClick={() => setIsCardSettingsModalOpen(true)}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 sm:py-3 bg-[#1E1E20] hover:bg-[#26262A] text-[#8E8E93] hover:text-white border border-[#2D2D30] hover:border-indigo-500/40 rounded-xl sm:rounded-2xl text-xs font-semibold transition-colors shadow-sm shrink-0"
                      title="Card Display Options"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                      <span className="hidden sm:inline">Options</span>
                    </button>
                  </div>

                  {/* Targets List */}
                  {displayedItems.length === 0 ? (
                    <div className="p-8 text-center text-[#8E8E93] flex flex-col items-center justify-center gap-2 bg-[#1E1E20] rounded-xl sm:rounded-2xl border border-[#2D2D30] mt-2">
                      <Sliders className="w-10 h-10 text-[#55555A]" />
                      <p className="text-xs sm:text-sm font-medium mt-2">No targets added yet.</p>
                      <p className="text-[10px] sm:text-xs text-[#6C6C70] max-w-[200px]">
                        Tap the + button to add your first offset to track.
                      </p>
                    </div>
                  ) : (
                    <div className={`grid grid-cols-1 ${cardViewSettings.tabletLayout === 'list' ? 'md:grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'} gap-2.5 sm:gap-3.5 md:gap-4`}>
                    {displayedItems.map((item) => {
                      const hasFallbacks =
                        (item.fallbackClassNames && item.fallbackClassNames.length > 0) ||
                        (item.fallbackMemberNames && item.fallbackMemberNames.length > 0);

                      const isCompact = cardViewSettings.density === 'compact';

                      return (
                        <div
                          key={item.id}
                          onClick={() => setViewingTargetItem(item)}
                          className={`bg-[#1E1E20] md:bg-gradient-to-br md:from-[#1E1E22] md:to-[#17171A] hover:bg-[#232326] md:hover:to-[#1C1C20] border border-[#2D2D30] md:border-[#35353C] hover:border-indigo-500/40 md:hover:border-indigo-500/50 md:shadow-md md:hover:shadow-indigo-500/5 ${
                            isCompact ? 'p-2 sm:p-2.5 md:p-3 gap-1 sm:gap-1.5' : 'p-3 sm:p-4 gap-1.5 sm:gap-2.5'
                          } rounded-xl sm:rounded-2xl shadow-sm flex flex-col relative cursor-pointer transition-all active:scale-[0.99] group/card`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1 min-w-0 pr-20 sm:pr-24">
                              {/* Custom Name / Label if enabled */}
                              {cardViewSettings.showCustomName && item.customName && (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs sm:text-sm text-white group-hover/card:text-indigo-200 transition-colors truncate">
                                    {item.customName}
                                  </span>
                                  <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30 font-medium">
                                    Custom Name
                                  </span>
                                </div>
                              )}

                              {/* Class & Member Identification */}
                              {(cardViewSettings.showClassName || cardViewSettings.showMemberName || cardViewSettings.showKindBadge) && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {cardViewSettings.showClassName && (
                                    <span className={`font-semibold text-xs sm:text-sm ${item.customName && cardViewSettings.showCustomName ? 'text-[#8E8E93]' : 'text-[#E2E2E4] group-hover/card:text-indigo-300'} transition-colors truncate`}>
                                      {item.className}
                                    </span>
                                  )}
                                  {cardViewSettings.showClassName && cardViewSettings.showMemberName && (
                                    <span className="text-[#6C6C70]">.</span>
                                  )}
                                  {cardViewSettings.showMemberName && (
                                    <span className="font-mono text-xs sm:text-sm text-sky-300 font-medium truncate">
                                      {item.memberName}
                                    </span>
                                  )}
                                  {cardViewSettings.showKindBadge && (
                                    <span
                                      className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                                        item.kind === 'FIELD'
                                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      }`}
                                    >
                                      {item.kind}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Comments Preview */}
                              {cardViewSettings.showComments && item.comment && (
                                <div className="text-[9px] sm:text-[11px] text-[#8E8E93] italic line-clamp-1">
                                  // {item.comment}
                                </div>
                              )}

                              {/* Fallbacks Preview */}
                              {cardViewSettings.showFallbacks && hasFallbacks && (
                                <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-amber-400/90 mt-0.5 flex-wrap font-mono">
                                  <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="text-[#8E8E93]">Fallbacks:</span>
                                  {item.fallbackClassNames && item.fallbackClassNames.length > 0 && (
                                    <span className="bg-[#141416] px-1.5 py-0.5 rounded border border-[#353538] text-[#C4C4C8]">
                                      Class: {item.fallbackClassNames.join(', ')}
                                    </span>
                                  )}
                                  {item.fallbackMemberNames && item.fallbackMemberNames.length > 0 && (
                                    <span className="bg-[#141416] px-1.5 py-0.5 rounded border border-[#353538] text-[#C4C4C8]">
                                      Field: {item.fallbackMemberNames.join(', ')}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Action Buttons: Edit (Pencil), Delete */}
                            <div className="absolute top-2.5 sm:top-3 sm:p-4 right-3 sm:right-4 flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditTarget(item);
                                }}
                                className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-indigo-400 bg-[#262629] md:bg-[#202024] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
                                title="Edit Target & Fallbacks"
                              >
                                <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveTargetItem(item.id);
                                }}
                                className="p-1.5 sm:p-2 text-[#8E8E93] hover:text-red-400 bg-[#262629] md:bg-[#202024] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
                                title="Remove target"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HISTORY */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-[#1E1E20] border border-[#2D2D30] rounded-xl sm:rounded-2xl flex flex-col overflow-hidden shadow-sm">
                <div className="p-3 sm:p-4 border-b border-[#2D2D30] bg-[#242427] flex items-center justify-between">
                  <span className="text-[11px] sm:text-sm font-semibold text-[#E2E2E4] flex items-center gap-2">
                    <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                    Scan Logs
                  </span>
                  {scanHistory.length > 0 && (
                    <button
                      onClick={() => setIsConfirmClearHistoryOpen(true)}
                      className="text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg sm:rounded-xl transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 bg-[#141416]">
                  {scanHistory.length === 0 ? (
                    <div className="p-10 text-center text-[#8E8E93] flex flex-col items-center">
                      <History className="w-10 h-10 text-[#3A3A3E] mb-3" />
                      <p className="text-xs sm:text-sm">No scans recorded yet.</p>
                      <p className="text-[10px] sm:text-xs text-[#6C6C70] mt-1 max-w-[200px]">
                        Scan a watchlist profile to generate history logs here.
                      </p>
                    </div>
                  ) : (
                    scanHistory.map((rec) => {
                      const presetId = rec.codeStylePreset || 'cpp_constexpr';
                      const presetObj = CODE_STYLE_PRESETS.find((p) => p.id === presetId) || CODE_STYLE_PRESETS[0];

                      return (
                        <div
                          key={rec.id}
                          onClick={() => handleOpenHistoryRecord(rec)}
                          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[#1E1E20] hover:bg-[#242428] border border-[#2D2D30] hover:border-[#4A4A50] transition-all cursor-pointer active:scale-[0.99] group flex flex-col gap-2.5 shadow-sm"
                        >
                          <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors truncate">
                                {rec.profileName}
                              </span>
                              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shrink-0">
                                <Code2 className="w-3 h-3" />
                                <span>{presetObj.label}</span>
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Direct Copy in Selected Code Style */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const generated = generateScanHistoryCode(rec, rec.codeStylePreset, rec.customCodeStyleTemplate);
                                  onCopyText(generated.code, `${rec.profileName} (${presetObj.label})`);
                                }}
                                className="p-1.5 bg-[#1C1C20] hover:bg-[#2A2A30] text-[#A0A0A5] hover:text-white rounded-md sm:rounded-lg border border-[#353538] transition-colors"
                                title={`Copy All Offsets as ${presetObj.label}`}
                              >
                                <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                              </button>

                              {/* Direct Download in Selected Code Style */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const generated = generateScanHistoryCode(rec, rec.codeStylePreset, rec.customCodeStyleTemplate);
                                  const blob = new Blob([generated.code], { type: generated.mimeType });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = generated.filename;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  URL.revokeObjectURL(url);
                                  showToast(`Downloaded ${generated.filename}`);
                                }}
                                className="p-1.5 bg-[#1C1C20] hover:bg-[#2A2A30] text-[#A0A0A5] hover:text-white rounded-md sm:rounded-lg border border-[#353538] transition-colors"
                                title={`Download ${presetObj.label} File`}
                              >
                                <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                              </button>

                              {/* Delete Record */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = scanHistory.filter((item) => item.id !== rec.id);
                                  saveHistory(updated);
                                  showToast('Scan record deleted');
                                }}
                                className="p-1.5 text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10 rounded-md sm:rounded-lg transition-colors"
                                title="Delete this scan log"
                              >
                                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="text-[10px] sm:text-xs text-[#8E8E93] flex items-center gap-2 flex-wrap">
                            <span className="bg-[#141416] px-1.5 sm:px-2 py-0.5 rounded border border-[#353538]">
                              {rec.sourceMode === 'live' ? 'Live Scan' : 'Storage Dump'}
                            </span>
                            <span className="text-emerald-400 font-medium px-1.5 sm:px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                              {rec.resolvedCount}/{rec.totalTargets} Resolved
                            </span>
                            <span className="text-[9px] sm:text-[11px] text-[#6C6C70]">
                              {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(rec.timestamp).toLocaleDateString()}
                            </span>
                            <span className="text-[9px] sm:text-[11px] text-indigo-400/80 ml-auto flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              View details & code <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>

                          <div className="mt-0.5 flex flex-wrap gap-1.5 font-mono text-[9px] sm:text-[10px]">
                            {rec.items.slice(0, 4).map((it, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 sm:px-2 py-1 bg-[#141416] border border-[#353538] rounded-md sm:rounded-lg text-[#A0A0A5]"
                              >
                                {it.customName || it.memberName}: <span className="text-amber-300">{it.offsetHex || it.rvaHex || 'N/A'}</span>
                              </span>
                            ))}
                            {rec.items.length > 4 && (
                              <span className="px-1.5 sm:px-2 py-1 text-[#666] bg-[#141416] rounded-md sm:rounded-lg">+{rec.items.length - 4} more</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FLOATING ACTION BUTTONS (Profile Targets View Only) */}
      {activeTab === 'watchlist' && selectedProfileViewId !== null && (
        <div className="absolute bottom-6 right-6 flex flex-col items-center gap-3 sm:gap-4">
          {/* Add Target FAB */}
          <button
            onClick={() => setIsAddTargetModalOpen(true)}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 transition-transform hover:scale-105 active:scale-95 border border-indigo-500/50"
            title="Add Target Field/Class"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      )}

      {/* Modal: Create Profile */}
      {isNewProfileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start sm:items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl p-3 sm:p-5 max-w-lg w-full shadow-2xl flex flex-col gap-2.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-8 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[80dvh] sm:max-h-[85vh] overflow-y-auto overscroll-contain">
            <h3 className="text-sm sm:text-base font-semibold text-[#E2E2E4] flex items-center gap-2">
              <BookmarkPlus className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
              <span>Create Profile</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-medium text-[#8E8E93] ml-1">Profile Name</label>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="e.g. Combat & Weapon Offsets"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-medium text-[#8E8E93] ml-1">Description (Optional)</label>
              <input
                type="text"
                value={newProfileDesc}
                onChange={(e) => setNewProfileDesc(e.target.value)}
                placeholder="e.g. Target pointers for game v1.4"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Code Output Style Selection */}
            <div className="flex flex-col gap-2.5 pt-1 border-t border-[#2D2D30]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] sm:text-xs font-semibold text-[#E2E2E4] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                  <span>Code Style Output</span>
                </label>
                <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Default format for copy & export</span>
              </div>

              {/* Preset selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CODE_STYLE_PRESETS.map((preset) => {
                  const isSelected = newProfileCodeStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setNewProfileCodeStyle(preset.id)}
                      className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                          : 'bg-[#141416] border-[#353538] hover:border-[#4A4A50]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] sm:text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-[#E2E2E4]'}`}>
                          {preset.label}
                        </span>
                        {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />}
                      </div>
                      <span className="text-[9px] sm:text-[11px] font-mono text-[#8E8E93] truncate">
                        {preset.template}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Template Editor */}
              {newProfileCodeStyle === 'custom' && (
                <div className="flex flex-col gap-2 p-2 sm:p-3 bg-[#141416] border border-indigo-500/30 rounded-xl sm:rounded-2xl animate-in fade-in duration-150 mt-1">
                  <label className="text-[9px] sm:text-[11px] font-medium text-indigo-300">Custom Template String</label>
                  <input
                    type="text"
                    value={newProfileCustomTemplate}
                    onChange={(e) => setNewProfileCustomTemplate(e.target.value)}
                    placeholder="e.g. constexpr uintptr_t {name} = {offset};"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Placeholders:</span>
                    {['{name}', '{offset}', '{class}', '{rva}', '{type}', '{comment}'].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setNewProfileCustomTemplate((prev) => `${prev} ${token}`.trim())}
                        className="px-1.5 sm:px-2 py-0.5 rounded bg-[#242428] hover:bg-[#323236] border border-[#3E3E44] text-[9px] sm:text-[10px] font-mono text-indigo-300 transition-colors"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="p-2 sm:p-3 bg-[#141416] border border-[#2D2D30] rounded-lg sm:rounded-xl flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#8E8E93]">
                  <span className="font-semibold uppercase tracking-wider">Preview</span>
                  <span className="font-mono">{newProfileCodeStyle}</span>
                </div>
                <div className="font-mono text-[10px] sm:text-xs text-amber-300 bg-[#1A1A1D] p-1.5 sm:p-2 rounded-md sm:rounded-lg border border-[#28282B] overflow-x-auto whitespace-pre">
                  {getCodeTemplate(newProfileCodeStyle, newProfileCustomTemplate)
                    .replace(/{name}/g, 'moveSpeed')
                    .replace(/{offset}/g, '0x28')
                    .replace(/{class}/g, 'PlayerController')
                    .replace(/{type}/g, 'float')
                    .replace(/{rva}/g, '0x1A2B3C')
                    .replace(/{comment}/g, 'Movement speed')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 sm:gap-3 mt-2">
              <button
                onClick={() => setIsNewProfileModalOpen(false)}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-[#8E8E93] hover:text-white bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProfile}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Profile */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start sm:items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl p-3 sm:p-5 max-w-lg w-full shadow-2xl flex flex-col gap-2.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-8 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[80dvh] sm:max-h-[85vh] overflow-y-auto overscroll-contain">
            <h3 className="text-sm sm:text-base font-semibold text-[#E2E2E4] flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
              <span>Edit Profile</span>
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-medium text-[#8E8E93] ml-1">Profile Name</label>
              <input
                type="text"
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
                placeholder="e.g. Combat & Weapon Offsets"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] sm:text-xs font-medium text-[#8E8E93] ml-1">Description (Optional)</label>
              <input
                type="text"
                value={editProfileDesc}
                onChange={(e) => setEditProfileDesc(e.target.value)}
                placeholder="e.g. Health, speed, fire rate offsets"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Code Output Style Selection */}
            <div className="flex flex-col gap-2.5 pt-1 border-t border-[#2D2D30]">
              <div className="flex items-center justify-between">
                <label className="text-[10px] sm:text-xs font-semibold text-[#E2E2E4] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                  <span>Code Style Output</span>
                </label>
                <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Format for copy & offset export</span>
              </div>

              {/* Preset selection grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CODE_STYLE_PRESETS.map((preset) => {
                  const isSelected = editProfileCodeStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setEditProfileCodeStyle(preset.id)}
                      className={`p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border text-left flex flex-col gap-1 transition-all ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                          : 'bg-[#141416] border-[#353538] hover:border-[#4A4A50]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] sm:text-xs font-bold ${isSelected ? 'text-indigo-300' : 'text-[#E2E2E4]'}`}>
                          {preset.label}
                        </span>
                        {isSelected && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />}
                      </div>
                      <span className="text-[9px] sm:text-[11px] font-mono text-[#8E8E93] truncate">
                        {preset.template}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Template Editor */}
              {editProfileCodeStyle === 'custom' && (
                <div className="flex flex-col gap-2 p-2 sm:p-3 bg-[#141416] border border-indigo-500/30 rounded-xl sm:rounded-2xl animate-in fade-in duration-150 mt-1">
                  <label className="text-[9px] sm:text-[11px] font-medium text-indigo-300">Custom Template String</label>
                  <input
                    type="text"
                    value={editProfileCustomTemplate}
                    onChange={(e) => setEditProfileCustomTemplate(e.target.value)}
                    placeholder="e.g. constexpr uintptr_t {name} = {offset};"
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[10px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Placeholders:</span>
                    {['{name}', '{offset}', '{class}', '{rva}', '{type}', '{comment}'].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => setEditProfileCustomTemplate((prev) => `${prev} ${token}`.trim())}
                        className="px-1.5 sm:px-2 py-0.5 rounded bg-[#242428] hover:bg-[#323236] border border-[#3E3E44] text-[9px] sm:text-[10px] font-mono text-indigo-300 transition-colors"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Preview Box */}
              <div className="p-2 sm:p-3 bg-[#141416] border border-[#2D2D30] rounded-lg sm:rounded-xl flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-[#8E8E93]">
                  <span className="font-semibold uppercase tracking-wider">Preview</span>
                  <span className="font-mono">{editProfileCodeStyle}</span>
                </div>
                <div className="font-mono text-[10px] sm:text-xs text-amber-300 bg-[#1A1A1D] p-1.5 sm:p-2 rounded-md sm:rounded-lg border border-[#28282B] overflow-x-auto whitespace-pre">
                  {getCodeTemplate(editProfileCodeStyle, editProfileCustomTemplate)
                    .replace(/{name}/g, 'moveSpeed')
                    .replace(/{offset}/g, '0x28')
                    .replace(/{class}/g, 'PlayerController')
                    .replace(/{type}/g, 'float')
                    .replace(/{rva}/g, '0x1A2B3C')
                    .replace(/{comment}/g, 'Movement speed')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-1.5 sm:gap-3 mt-2">
              <button
                onClick={() => setEditingProfile(null)}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium text-[#8E8E93] hover:text-white bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditProfile}
                disabled={!editProfileName.trim()}
                className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Target Field / Class */}
      {isAddTargetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-2.5 sm:p-4 flex justify-center items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
              <h3 className="text-xs sm:text-base font-semibold text-[#E2E2E4] flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-indigo-400" />
                <span>Add Target to <span className="text-indigo-400">{activeProfile?.name}</span></span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTargetModalOpen(false)}
                className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-3 sm:space-y-4 overscroll-contain pr-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Target Type</label>
              <div className="flex items-center gap-3 p-1 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl">
                <button
                  type="button"
                  onClick={() => setNewTargetKind('FIELD')}
                  className={`flex-1 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
                    newTargetKind === 'FIELD'
                      ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  Field (Offset)
                </button>
                <button
                  type="button"
                  onClick={() => setNewTargetKind('METHOD')}
                  className={`flex-1 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
                    newTargetKind === 'METHOD'
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                      : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                  }`}
                >
                  Method (RVA)
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">
                Custom Name / Display Label (Optional)
              </label>
              <input
                type="text"
                value={newTargetCustomName}
                onChange={(e) => setNewTargetCustomName(e.target.value)}
                placeholder="e.g. PlayerSpeed (Used in code export & display)"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Class Name</label>
              <input
                type="text"
                value={newTargetClassName}
                onChange={(e) => setNewTargetClassName(e.target.value)}
                placeholder="e.g. PlayerController"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">
                {newTargetKind === 'FIELD' ? 'Field Name' : 'Method Name'}
              </label>
              <input
                type="text"
                value={newTargetMemberName}
                onChange={(e) => setNewTargetMemberName(e.target.value)}
                placeholder={newTargetKind === 'FIELD' ? 'e.g. moveSpeed' : 'e.g. Update'}
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Comment (Optional)</label>
              <input
                type="text"
                value={newTargetComment}
                onChange={(e) => setNewTargetComment(e.target.value)}
                placeholder="e.g. Movement multiplier"
                className="w-full px-2.5 sm:px-4 py-1.5 sm:py-3 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Fallbacks Configuration (Collapsible with Eye/EyeOff logo) */}
            <div className="bg-[#141416] rounded-xl sm:rounded-2xl border border-[#353538] overflow-hidden">
              <button
                id="btn-toggle-add-fallbacks"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setShowAddFallbacks((prev) => !prev);
                }}
                className="w-full p-1.5 sm:p-3.5 flex items-center justify-between hover:bg-[#1A1A1E] active:bg-[#18181B] transition-colors cursor-pointer select-none"
                aria-expanded={showAddFallbacks}
              >
                <div className="flex items-center gap-2 text-[9px] sm:text-xs font-semibold text-amber-400">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                  <span>Fallback Names (Optional)</span>
                  {(newTargetFallbackClasses.length > 0 || newTargetFallbackMembers.length > 0) && (
                    <span className="text-[8px] sm:text-[10px] bg-amber-500/20 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full font-mono">
                      {newTargetFallbackClasses.length + newTargetFallbackMembers.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-[#202024] hover:bg-[#2A2A30] border border-[#3A3A42] text-[9px] sm:text-xs font-medium text-[#D0D0D5] transition-colors shadow-sm">
                  {showAddFallbacks ? (
                    <>
                      <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                      <span className="text-amber-300 font-semibold">Hide</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                      <span className="text-[#E2E2E4] font-semibold">Show</span>
                    </>
                  )}
                  <ChevronDown
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${
                      showAddFallbacks ? 'rotate-180 text-amber-400' : 'text-[#8E8E93]'
                    }`}
                  />
                </div>
              </button>

              {showAddFallbacks && (
                <div className="p-1.5 sm:p-3.5 pt-0 border-t border-[#262629] flex flex-col gap-3 mt-2 max-h-56 overflow-y-auto overscroll-contain">
                  <p className="text-[8px] sm:text-[11px] text-[#8E8E93] leading-relaxed">
                    If the game updates and the primary name is missing, the scanner will automatically try these fallbacks.
                  </p>

                  {/* Fallback Class Names List */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] sm:text-[11px] font-medium text-[#8E8E93]">
                      Fallback Class Names
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempFallbackClassInput}
                        onChange={(e) => setTempFallbackClassInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tempFallbackClassInput.trim()) {
                            e.preventDefault();
                            if (!newTargetFallbackClasses.includes(tempFallbackClassInput.trim())) {
                              setNewTargetFallbackClasses([...newTargetFallbackClasses, tempFallbackClassInput.trim()]);
                            }
                            setTempFallbackClassInput('');
                          }
                        }}
                        placeholder="e.g. PlayerMovement"
                        className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempFallbackClassInput.trim()) {
                            if (!newTargetFallbackClasses.includes(tempFallbackClassInput.trim())) {
                              setNewTargetFallbackClasses([...newTargetFallbackClasses, tempFallbackClassInput.trim()]);
                            }
                            setTempFallbackClassInput('');
                          }
                        }}
                        className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                        title="Add Fallback Class"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    {newTargetFallbackClasses.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newTargetFallbackClasses.map((cls, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-sky-300"
                          >
                            {cls}
                            <button
                              type="button"
                              onClick={() => setNewTargetFallbackClasses(newTargetFallbackClasses.filter((_, i) => i !== idx))}
                              className="text-[#8E8E93] hover:text-red-400 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fallback Member Names List */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] sm:text-[11px] font-medium text-[#8E8E93]">
                      Fallback {newTargetKind === 'FIELD' ? 'Field' : 'Method'} Names
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tempFallbackMemberInput}
                        onChange={(e) => setTempFallbackMemberInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && tempFallbackMemberInput.trim()) {
                            e.preventDefault();
                            if (!newTargetFallbackMembers.includes(tempFallbackMemberInput.trim())) {
                              setNewTargetFallbackMembers([...newTargetFallbackMembers, tempFallbackMemberInput.trim()]);
                            }
                            setTempFallbackMemberInput('');
                          }
                        }}
                        placeholder={newTargetKind === 'FIELD' ? 'e.g. speed' : 'e.g. ApplyDamage'}
                        className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (tempFallbackMemberInput.trim()) {
                            if (!newTargetFallbackMembers.includes(tempFallbackMemberInput.trim())) {
                              setNewTargetFallbackMembers([...newTargetFallbackMembers, tempFallbackMemberInput.trim()]);
                            }
                            setTempFallbackMemberInput('');
                          }
                        }}
                        className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                        title="Add Fallback Member"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    {newTargetFallbackMembers.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {newTargetFallbackMembers.map((mem, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-amber-300"
                          >
                            {mem}
                            <button
                              type="button"
                              onClick={() => setNewTargetFallbackMembers(newTargetFallbackMembers.filter((_, i) => i !== idx))}
                              className="text-[#8E8E93] hover:text-red-400 p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            </div>

            {/* Modal Sticky Footer */}
            <div className="p-3 sm:p-4 border-t border-[#2D2D30] shrink-0 bg-[#1E1E20] flex items-center justify-end gap-2.5 sm:gap-3">
              <button
                onClick={() => setIsAddTargetModalOpen(false)}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium text-[#8E8E93] hover:text-white bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTarget}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                Add Target
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Target & Fallbacks */}
      {editingTargetItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-2.5 sm:p-4 flex justify-center items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-xs sm:text-base font-semibold text-[#E2E2E4] flex items-center gap-2 truncate">
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400 shrink-0" />
                  <span className="truncate">Edit Target</span>
                </h3>
                <span className="text-[9px] sm:text-xs text-indigo-300 font-mono bg-indigo-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-indigo-500/20 truncate max-w-[110px] sm:max-w-[180px]">
                  {activeProfile?.name}
                </span>
              </div>

              {/* Next / Back navigation in Edit modal */}
              <div className="flex items-center gap-1.5 shrink-0">
                {activeProfile && activeProfile.items.length > 1 && (
                  <div className="flex items-center gap-0.5 bg-[#141416] px-1 sm:px-1.5 py-0.5 rounded-lg border border-[#353538]">
                    <span className="text-[8px] sm:text-[10px] text-[#8E8E93] font-mono pr-1">
                      {activeProfile.items.findIndex((i) => i.id === editingTargetItem?.id) + 1}/{activeProfile.items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = activeProfile.items.findIndex((i) => i.id === editingTargetItem?.id);
                        if (curIdx > 0) {
                          handleOpenEditTarget(activeProfile.items[curIdx - 1]);
                        } else {
                          handleOpenEditTarget(activeProfile.items[activeProfile.items.length - 1]);
                        }
                      }}
                      className="p-1 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded transition-colors"
                      title="Previous Target"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = activeProfile.items.findIndex((i) => i.id === editingTargetItem?.id);
                        if (curIdx >= 0 && curIdx < activeProfile.items.length - 1) {
                          handleOpenEditTarget(activeProfile.items[curIdx + 1]);
                        } else {
                          handleOpenEditTarget(activeProfile.items[0]);
                        }
                      }}
                      className="p-1 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded transition-colors"
                      title="Next Target"
                    >
                      <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setEditingTargetItem(null)}
                  className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Body */}
            <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-3 sm:space-y-4 overscroll-contain pr-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Target Type</label>
                <div className="flex items-center gap-3 p-1 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setEditTargetKind('FIELD')}
                    className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
                      editTargetKind === 'FIELD'
                        ? 'bg-amber-500/20 text-amber-400 shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    Field (Offset)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTargetKind('METHOD')}
                    className={`flex-1 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-xs font-bold transition-all ${
                      editTargetKind === 'METHOD'
                        ? 'bg-emerald-500/20 text-emerald-400 shadow-sm'
                        : 'text-[#8E8E93] hover:text-[#E2E2E4]'
                    }`}
                  >
                    Method (RVA)
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">
                  Custom Name / Display Label (Optional)
                </label>
                <input
                  type="text"
                  value={editTargetCustomName}
                  onChange={(e) => setEditTargetCustomName(e.target.value)}
                  placeholder="e.g. PlayerSpeed (Used in code export & display)"
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Primary Class Name</label>
                <input
                  type="text"
                  value={editTargetClassName}
                  onChange={(e) => setEditTargetClassName(e.target.value)}
                  placeholder="e.g. PlayerController"
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">
                  Primary {editTargetKind === 'FIELD' ? 'Field Name' : 'Method Name'}
                </label>
                <input
                  type="text"
                  value={editTargetMemberName}
                  onChange={(e) => setEditTargetMemberName(e.target.value)}
                  placeholder={editTargetKind === 'FIELD' ? 'e.g. moveSpeed' : 'e.g. Update'}
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] sm:text-xs font-medium text-[#8E8E93] ml-1">Comment (Optional)</label>
                <input
                  type="text"
                  value={editTargetComment}
                  onChange={(e) => setEditTargetComment(e.target.value)}
                  placeholder="e.g. Movement multiplier"
                  className="w-full px-2.5 sm:px-4 py-1.5 sm:py-2.5 bg-[#141416] border border-[#353538] rounded-xl sm:rounded-2xl text-[10px] sm:text-sm text-[#E2E2E4] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Fallbacks Configuration (Collapsible with Eye/EyeOff logo) */}
              <div className="bg-[#141416] rounded-xl sm:rounded-2xl border border-[#353538] overflow-hidden">
                <button
                  id="btn-toggle-edit-fallbacks"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowEditFallbacks((prev) => !prev);
                  }}
                  className="w-full p-2 sm:p-3.5 flex items-center justify-between hover:bg-[#1A1A1E] active:bg-[#18181B] transition-colors cursor-pointer select-none"
                  aria-expanded={showEditFallbacks}
                >
                  <div className="flex items-center gap-2 text-[9px] sm:text-xs font-semibold text-amber-400">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 shrink-0" />
                    <span>Fallback / Alternative Names</span>
                    {(editTargetFallbackClasses.length > 0 || editTargetFallbackMembers.length > 0) && (
                      <span className="text-[8px] sm:text-[10px] bg-amber-500/20 text-amber-300 px-1.5 sm:px-2 py-0.5 rounded-full font-mono">
                        {editTargetFallbackClasses.length + editTargetFallbackMembers.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-lg sm:rounded-xl bg-[#202024] hover:bg-[#2A2A30] border border-[#3A3A42] text-[9px] sm:text-xs font-medium text-[#D0D0D5] transition-colors shadow-sm">
                    {showEditFallbacks ? (
                      <>
                        <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                        <span className="text-amber-300 font-semibold">Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                        <span className="text-[#E2E2E4] font-semibold">Show</span>
                      </>
                    )}
                    <ChevronDown
                      className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 ${
                        showEditFallbacks ? 'rotate-180 text-amber-400' : 'text-[#8E8E93]'
                      }`}
                    />
                  </div>
                </button>

                {showEditFallbacks && (
                  <div className="p-2 sm:p-3.5 pt-0 border-t border-[#262629] flex flex-col gap-3 mt-2 max-h-56 overflow-y-auto overscroll-contain">
                    <p className="text-[8px] sm:text-[11px] text-[#8E8E93] leading-relaxed">
                      If the primary name isn't found during a scan, these fallbacks are searched in order.
                    </p>

                    {/* Fallback Class Names List */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] sm:text-[11px] font-medium text-[#8E8E93]">
                        Fallback Class Names
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editTempFallbackClassInput}
                          onChange={(e) => setEditTempFallbackClassInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editTempFallbackClassInput.trim()) {
                              e.preventDefault();
                              if (!editTargetFallbackClasses.includes(editTempFallbackClassInput.trim())) {
                                setEditTargetFallbackClasses([...editTargetFallbackClasses, editTempFallbackClassInput.trim()]);
                              }
                              setEditTempFallbackClassInput('');
                            }
                          }}
                          placeholder="e.g. PlayerMovement"
                          className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editTempFallbackClassInput.trim()) {
                              if (!editTargetFallbackClasses.includes(editTempFallbackClassInput.trim())) {
                                setEditTargetFallbackClasses([...editTargetFallbackClasses, editTempFallbackClassInput.trim()]);
                              }
                              setEditTempFallbackClassInput('');
                            }
                          }}
                          className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                          title="Add Fallback Class"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      {editTargetFallbackClasses.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editTargetFallbackClasses.map((cls, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-sky-300"
                            >
                              {cls}
                              <button
                                type="button"
                                onClick={() => setEditTargetFallbackClasses(editTargetFallbackClasses.filter((_, i) => i !== idx))}
                                className="text-[#8E8E93] hover:text-red-400 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fallback Member Names List */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] sm:text-[11px] font-medium text-[#8E8E93]">
                        Fallback {editTargetKind === 'FIELD' ? 'Field' : 'Method'} Names
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editTempFallbackMemberInput}
                          onChange={(e) => setEditTempFallbackMemberInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && editTempFallbackMemberInput.trim()) {
                              e.preventDefault();
                              if (!editTargetFallbackMembers.includes(editTempFallbackMemberInput.trim())) {
                                setEditTargetFallbackMembers([...editTargetFallbackMembers, editTempFallbackMemberInput.trim()]);
                              }
                              setEditTempFallbackMemberInput('');
                            }
                          }}
                          placeholder={editTargetKind === 'FIELD' ? 'e.g. speed' : 'e.g. ApplyDamage'}
                          className="flex-1 px-1.5 sm:px-3 py-1 sm:py-2 bg-[#1A1A1D] border border-[#353538] rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-[#E2E2E4] focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (editTempFallbackMemberInput.trim()) {
                              if (!editTargetFallbackMembers.includes(editTempFallbackMemberInput.trim())) {
                                setEditTargetFallbackMembers([...editTargetFallbackMembers, editTempFallbackMemberInput.trim()]);
                              }
                              setEditTempFallbackMemberInput('');
                            }
                          }}
                          className="p-1.5 sm:p-2 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 hover:text-white rounded-lg sm:rounded-xl border border-indigo-500/40 transition-colors"
                          title="Add Fallback Member"
                        >
                          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      {editTargetFallbackMembers.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {editTargetFallbackMembers.map((mem, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[8px] sm:text-[11px] font-mono text-amber-300"
                            >
                              {mem}
                              <button
                                type="button"
                                onClick={() => setEditTargetFallbackMembers(editTargetFallbackMembers.filter((_, i) => i !== idx))}
                                className="text-[#8E8E93] hover:text-red-400 p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Sticky Footer */}
            <div className="p-3 sm:p-4 border-t border-[#2D2D30] shrink-0 bg-[#1E1E20] flex items-center justify-end gap-2.5 sm:gap-3">
              <button
                onClick={() => setEditingTargetItem(null)}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 text-[10px] sm:text-sm font-medium text-[#8E8E93] hover:text-white bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditTarget}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-md shadow-indigo-600/20 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: View Target Detail Card */}
      {viewingTargetItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-2.5 sm:p-4 flex justify-center items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-xl sm:rounded-2xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88dvh] sm:max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header: Title, Next/Back & Edit Button */}
            <div className="p-3 sm:p-4 border-b border-[#2D2D30] shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                <h3 className="text-xs sm:text-base font-semibold text-[#E2E2E4]">Target Details</h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Previous / Next Switcher */}
                {activeProfile && activeProfile.items.length > 1 && (
                  <div className="flex items-center gap-0.5 bg-[#141416] px-1 sm:px-1.5 py-0.5 rounded-lg border border-[#353538]">
                    <span className="text-[8px] sm:text-[10px] text-[#8E8E93] font-mono pr-1">
                      {activeProfile.items.findIndex((i) => i.id === viewingTargetItem.id) + 1}/{activeProfile.items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = activeProfile.items.findIndex((i) => i.id === viewingTargetItem.id);
                        if (curIdx > 0) {
                          setViewingTargetItem(activeProfile.items[curIdx - 1]);
                        } else {
                          setViewingTargetItem(activeProfile.items[activeProfile.items.length - 1]);
                        }
                      }}
                      className="p-1 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded transition-colors"
                      title="Previous Target"
                    >
                      <ChevronLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const curIdx = activeProfile.items.findIndex((i) => i.id === viewingTargetItem.id);
                        if (curIdx >= 0 && curIdx < activeProfile.items.length - 1) {
                          setViewingTargetItem(activeProfile.items[curIdx + 1]);
                        } else {
                          setViewingTargetItem(activeProfile.items[0]);
                        }
                      }}
                      className="p-1 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded transition-colors"
                      title="Next Target"
                    >
                      <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                )}

                {/* Edit Button on Top */}
                <button
                  onClick={() => {
                    const itemToEdit = viewingTargetItem;
                    setViewingTargetItem(null);
                    handleOpenEditTarget(itemToEdit);
                  }}
                  className="p-1 sm:p-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 rounded-lg transition-colors"
                  title="Edit Target"
                >
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewingTargetItem(null)}
                  className="p-1 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Details Scrollable Area */}
            <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-3.5 overscroll-contain pr-2">
              {/* Custom Name / Label (if present) */}
              {viewingTargetItem.customName && (
                <div className="bg-[#141416] p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-indigo-500/30 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] sm:text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">Custom Name / Alias</span>
                    <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      Code Alias
                    </span>
                  </div>
                  <div className="font-mono text-xs sm:text-base font-bold text-white break-all select-text">
                    {viewingTargetItem.customName}
                  </div>
                </div>
              )}

              {/* Comment Box (Prominent & Clear) */}
              {viewingTargetItem.comment ? (
                <div className="bg-[#24242A] border border-[#3E3E48] p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl flex items-start gap-2.5 shadow-sm">
                  <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider text-indigo-300">Comment / Note</span>
                    <p className="text-[10px] sm:text-sm font-medium text-[#F0F0F3] leading-relaxed select-text">
                      {viewingTargetItem.comment}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#141416] border border-[#2D2D30] p-1.5 sm:p-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-xs text-[#6C6C70] italic">
                  No comment added for this target.
                </div>
              )}

              {/* Class Name (Separately displayed) */}
              <div className="bg-[#141416] p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1">
                <span className="text-[8px] sm:text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">Class Name</span>
                <div className="font-mono text-[10px] sm:text-sm font-bold text-[#E2E2E4] break-all select-text">
                  {viewingTargetItem.className}
                </div>
              </div>

              {/* Member Name (Separately displayed with Kind Badge) */}
              <div className="bg-[#141416] p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] sm:text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">
                    {viewingTargetItem.kind === 'FIELD' ? 'Field Name' : 'Method Name'}
                  </span>
                  <span
                    className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded font-mono font-semibold ${
                      viewingTargetItem.kind === 'FIELD'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {viewingTargetItem.kind}
                  </span>
                </div>
                <div className="font-mono text-xs sm:text-base font-bold text-sky-300 break-all select-text">
                  {viewingTargetItem.memberName}
                </div>
                {viewingTargetItem.typeName && (
                  <span className="text-[9px] sm:text-xs text-[#8E8E93] font-mono">
                    Type: <span className="text-[#C4C4C8]">{viewingTargetItem.typeName}</span>
                  </span>
                )}
              </div>

              {/* Offset / Resolution Status */}
              <div className="bg-[#141416] p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-2">
                <span className="text-[8px] sm:text-[11px] font-semibold text-[#8E8E93] uppercase tracking-wider">Memory Offset Status</span>
                {viewingTargetItem.resolved ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between font-mono bg-[#1C1C1F] p-1.5 sm:p-3 rounded-lg sm:rounded-xl border border-[#353538]">
                      <span className="text-[9px] sm:text-xs text-[#8E8E93]">
                        {viewingTargetItem.kind === 'FIELD' ? 'Field Offset:' : 'Method RVA:'}
                      </span>
                      <span className="text-xs sm:text-base font-bold text-amber-400">
                        {viewingTargetItem.kind === 'FIELD' ? viewingTargetItem.offsetHex : viewingTargetItem.rvaHex}
                      </span>
                    </div>

                    {viewingTargetItem.resolvedViaFallback && (
                      <div className="flex items-center gap-1.5 p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 text-[9px] sm:text-xs text-amber-300">
                        <ShieldCheck className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                        <span>
                          Matched via fallback: <strong>{viewingTargetItem.resolvedClassName}.{viewingTargetItem.resolvedMemberName}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-1.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg sm:rounded-xl text-[9px] sm:text-xs text-amber-300">
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
                    <span>Not yet resolved. Run scan in Target Setup tab.</span>
                  </div>
                )}
              </div>

              {/* Fallbacks List (Only shown if fallbacks exist) */}
              {((viewingTargetItem.fallbackClassNames && viewingTargetItem.fallbackClassNames.length > 0) ||
                (viewingTargetItem.fallbackMemberNames && viewingTargetItem.fallbackMemberNames.length > 0)) ? (
                <div className="bg-[#141416] p-1.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] sm:text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Fallback Alternatives
                    </span>
                    <button
                      onClick={() => {
                        const itemToEdit = viewingTargetItem;
                        setViewingTargetItem(null);
                        setShowEditFallbacks(true);
                        handleOpenEditTarget(itemToEdit);
                      }}
                      className="p-1 text-[#8E8E93] hover:text-amber-400 hover:bg-[#262629] rounded-md sm:rounded-lg transition-colors"
                      title="Edit Fallbacks"
                    >
                      <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>

                  {viewingTargetItem.fallbackClassNames && viewingTargetItem.fallbackClassNames.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[8px] sm:text-[11px] text-[#8E8E93]">Fallback Classes:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingTargetItem.fallbackClassNames.map((cls, idx) => (
                          <span key={idx} className="px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[9px] sm:text-xs font-mono text-sky-300">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {viewingTargetItem.fallbackMemberNames && viewingTargetItem.fallbackMemberNames.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[8px] sm:text-[11px] text-[#8E8E93]">Fallback Members:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {viewingTargetItem.fallbackMemberNames.map((mem, idx) => (
                          <span key={idx} className="px-1.5 sm:px-2.5 py-1 rounded-md sm:rounded-lg bg-[#242428] border border-[#3E3E44] text-[9px] sm:text-xs font-mono text-amber-300">
                            {mem}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Action Footer: Done */}
            <div className="p-3 sm:p-4 border-t border-[#2D2D30] shrink-0 bg-[#1E1E20] flex items-center justify-end">
              <button
                onClick={() => setViewingTargetItem(null)}
                className="px-2.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-colors shadow-md shadow-indigo-600/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: History Record Detail Sheet */}
      {selectedHistoryRecord && (() => {
        const currentFormatted = generateScanHistoryCode(
          selectedHistoryRecord,
          historyModalCodeStyle,
          historyModalCustomTemplate
        );
        const activePresetObj =
          CODE_STYLE_PRESETS.find((p) => p.id === historyModalCodeStyle) || CODE_STYLE_PRESETS[0];

        return (
          <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm overflow-y-auto p-2 sm:p-4 flex justify-center items-start sm:items-center">
            <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-5xl w-full shadow-2xl flex flex-col gap-3 sm:gap-5 animate-in fade-in zoom-in-95 duration-200 mt-4 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto">
              {/* Header: Back Button, Title, Timestamp & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-[#2D2D30] gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setSelectedHistoryRecord(null)}
                    className="p-1.5 sm:p-2 hover:bg-[#262629] text-[#8E8E93] hover:text-white rounded-lg sm:rounded-xl border border-[#353538] transition-colors shrink-0"
                    title="Back to History"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                  </button>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-xs sm:text-base font-bold text-[#E2E2E4] truncate">
                        {selectedHistoryRecord.profileName}
                      </h3>
                      <span className="flex items-center gap-1 text-[8px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        <Code2 className="w-3 h-3" />
                        <span>{activePresetObj.label}</span>
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-[#8E8E93] truncate">
                      {new Date(selectedHistoryRecord.timestamp).toLocaleString()} • {selectedHistoryRecord.targetApp}
                    </span>
                  </div>
                </div>

                {/* Top Action Buttons: Copy All Code, Download Code File, Save JSON */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    onClick={() => {
                      onCopyText(currentFormatted.code, `${selectedHistoryRecord.profileName} (${activePresetObj.label})`);
                    }}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 bg-[#262629] hover:bg-[#323236] text-[#E2E2E4] hover:text-white rounded-lg sm:rounded-xl border border-[#353538] transition-colors text-[11px] sm:text-xs font-semibold shadow-sm"
                    title={`Copy All Code in ${activePresetObj.label}`}
                  >
                    <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Copy Code</span>
                    <span className="sm:hidden">Copy</span>
                  </button>

                  <button
                    onClick={() => {
                      const blob = new Blob([currentFormatted.code], { type: currentFormatted.mimeType });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = currentFormatted.filename;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      showToast(`Downloaded ${currentFormatted.filename}`);
                    }}
                    className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 sm:px-3.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold shadow-md shadow-indigo-600/20 transition-colors"
                    title={`Download ${activePresetObj.label} File`}
                  >
                    <Download className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="hidden sm:inline">Download {activePresetObj.fileExtension}</span>
                    <span className="sm:hidden">DL</span>
                  </button>

                  <button
                    onClick={() => setIsHistoryStatsExpanded(!isHistoryStatsExpanded)}
                    className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl border transition-colors ${
                      isHistoryStatsExpanded
                        ? 'bg-[#26262A] hover:bg-[#323236] text-indigo-300 border-indigo-500/30'
                        : 'bg-[#262629] hover:bg-[#323236] text-[#8E8E93] hover:text-white border-[#353538]'
                    }`}
                    title={isHistoryStatsExpanded ? "Hide Configuration & Stats" : "Show Configuration & Stats"}
                  >
                    {isHistoryStatsExpanded ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>

              {isHistoryStatsExpanded && (
                <div className="flex flex-col gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-1.5 sm:p-2 duration-200">
                  {/* Summary Statistics */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-3">
                    <div className="bg-[#141416] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1">
                      <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Mode & Target</span>
                      <span className="text-[11px] sm:text-xs font-semibold text-[#E2E2E4] capitalize truncate">
                        {selectedHistoryRecord.sourceMode === 'live' ? 'Live Memory Scan' : 'Storage Dump'}
                      </span>
                    </div>
                    <div className="bg-[#141416] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1">
                      <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Resolution Rate</span>
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-400">
                        {selectedHistoryRecord.resolvedCount} / {selectedHistoryRecord.totalTargets} Resolved
                      </span>
                    </div>
                    <div className="bg-[#141416] p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-1 col-span-2">
                      <span className="text-[9px] sm:text-[11px] text-[#8E8E93]">Active Format</span>
                      <span className="text-[10px] sm:text-xs font-mono font-semibold text-indigo-300 truncate">
                        {activePresetObj.label}
                      </span>
                    </div>
                  </div>

                  {/* Code Style Output Selector Bar */}
                  <div className="bg-[#141416] p-2 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#2D2D30] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-semibold text-[#8E8E93] uppercase tracking-wider flex items-center gap-1.5">
                        <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                        Code Style Output
                      </span>
                      <span className="text-[9px] sm:text-[11px] text-[#6C6C70]">
                        Select format to preview, copy, or download
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CODE_STYLE_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => setHistoryModalCodeStyle(preset.id)}
                          className={`px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-medium border transition-all ${
                            historyModalCodeStyle === preset.id
                              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm shadow-indigo-600/20 font-semibold'
                              : 'bg-[#1E1E20] hover:bg-[#252528] text-[#8E8E93] hover:text-[#E2E2E4] border-[#303034]'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Template Editor if Custom is selected */}
                    {historyModalCodeStyle === 'custom' && (
                      <div className="mt-1 flex flex-col gap-2 p-2 sm:p-3 bg-[#1B1B1E] rounded-lg sm:rounded-xl border border-indigo-500/30">
                        <div className="flex items-center justify-between text-[9px] sm:text-[11px]">
                          <span className="text-indigo-300 font-medium">Custom Template Expression</span>
                          <span className="text-[#8E8E93]">Available: {'{name}, {offset}, {rva}, {class}, {member}, {kind}, {type}'}</span>
                        </div>
                        <input
                          type="text"
                          value={historyModalCustomTemplate}
                          onChange={(e) => setHistoryModalCustomTemplate(e.target.value)}
                          placeholder="constexpr uintptr_t {name} = {offset};"
                          className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-[#121214] border border-[#3A3A40] rounded-md sm:rounded-lg text-[10px] sm:text-xs font-mono text-indigo-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* View Tabs: Scanned Targets vs Formatted Code Output */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-[#2D2D30] pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistoryModalTab('targets')}
                      className={`px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-all ${
                        historyModalTab === 'targets'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-[#8E8E93] hover:text-[#E2E2E4] hover:bg-[#262629]'
                      }`}
                    >
                      Scanned Targets ({selectedHistoryRecord.items.length})
                    </button>

                    <button
                      onClick={() => setHistoryModalTab('code')}
                      className={`px-2 sm:px-3 py-1.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        historyModalTab === 'code'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                          : 'text-[#8E8E93] hover:text-[#E2E2E4] hover:bg-[#262629]'
                      }`}
                    >
                      <FileCode className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>Formatted Code View</span>
                    </button>
                  </div>

                  <span className="text-[9px] sm:text-[11px] text-[#8E8E93] hidden sm:inline">
                    {historyModalTab === 'targets' ? 'Click copy on any row for individual snippet' : `Full ${activePresetObj.label} file`}
                  </span>
                </div>

                {/* TAB CONTENT 1: SCANNED TARGETS LIST */}
                {historyModalTab === 'targets' && (
                  <div className="flex flex-col divide-y divide-[#262629] bg-[#141416] rounded-xl sm:rounded-2xl border border-[#2D2D30] overflow-hidden max-h-80 sm:max-h-96 overflow-y-auto">
                    {selectedHistoryRecord.items.map((item, idx) => {
                      const targetClass = item.resolvedClassName || item.className;
                      const targetMember = item.resolvedMemberName || item.memberName;
                      const offsetOrRva = item.kind === 'FIELD' ? item.offsetHex : item.rvaHex;

                      const singleSnippet = formatTargetCodeSnippet(
                        {
                          id: item.id || `t_${idx}`,
                          customName: item.customName,
                          className: item.className,
                          memberName: item.memberName,
                          kind: item.kind,
                          comment: item.comment,
                          offsetHex: item.offsetHex,
                          rvaHex: item.rvaHex,
                          vaHex: item.vaHex,
                          typeName: item.typeName,
                          signature: item.signature,
                          resolvedClassName: item.resolvedClassName,
                          resolvedMemberName: item.resolvedMemberName,
                          resolvedViaFallback: item.resolvedViaFallback,
                        },
                        historyModalCodeStyle,
                        historyModalCustomTemplate
                      );

                      return (
                        <div key={idx} className="p-2 sm:p-3 flex flex-col gap-1.5 sm:gap-2 hover:bg-[#1A1A1D] transition-colors">
                          <div className="flex items-start sm:items-center justify-between gap-1.5 sm:gap-3">
                            <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
                              {/* Custom Name if exists */}
                              {item.customName && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] sm:text-xs font-bold text-white truncate">{item.customName}</span>
                                  <span className="text-[7px] sm:text-[9px] px-1 py-0.2 bg-indigo-500/20 text-indigo-300 rounded font-medium shrink-0">Custom</span>
                                </div>
                              )}

                              <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs font-mono flex-wrap">
                                <span className="text-[#8E8E93] truncate max-w-[110px] sm:max-w-none">{targetClass}</span>
                                <span className="text-[#55555A]">.</span>
                                <span className="text-sky-300 font-semibold truncate max-w-[120px] sm:max-w-none">{targetMember}</span>
                                <span
                                  className={`text-[7px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded font-mono font-semibold shrink-0 ${
                                    item.kind === 'FIELD'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  }`}
                                >
                                  {item.kind}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                              {offsetOrRva ? (
                                <span className="font-mono text-[9px] sm:text-xs font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 bg-[#202024] border border-[#3E3E44] rounded-md sm:rounded-lg text-amber-300 select-all">
                                  {offsetOrRva}
                                </span>
                              ) : (
                                <span className="text-[8px] sm:text-xs text-red-400/90 font-mono bg-red-500/10 border border-red-500/20 px-1.5 sm:px-2 py-0.5 rounded">
                                  Not Found
                                </span>
                              )}
                              
                              <button
                                onClick={() => {
                                  setExpandedHistoryItems((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(idx)) next.delete(idx);
                                    else next.add(idx);
                                    return next;
                                  });
                                }}
                                className={`p-1 sm:p-2 hover:bg-[#2C2C32] rounded-md sm:rounded-lg border transition-colors ${
                                  expandedHistoryItems.has(idx) 
                                    ? 'bg-[#26262A] text-indigo-300 border-indigo-500/30' 
                                    : 'bg-[#202024] text-[#A0A0A5] hover:text-white border-[#353538]'
                                }`}
                                title={expandedHistoryItems.has(idx) ? 'Hide details' : 'Show details'}
                              >
                                {expandedHistoryItems.has(idx) ? (
                                  <EyeOff className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                ) : (
                                  <Eye className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  onCopyText(
                                    singleSnippet,
                                    `${item.customName || targetMember} (${activePresetObj.label})`
                                  );
                                }}
                                className="p-1 sm:p-2 bg-[#202024] hover:bg-[#2C2C32] text-[#A0A0A5] hover:text-white rounded-md sm:rounded-lg border border-[#353538] transition-colors"
                                title={`Copy Snippet in ${activePresetObj.label}`}
                              >
                                <Copy className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-indigo-400" />
                              </button>
                            </div>
                          </div>

                          {/* Extra Features (Hidden by default) */}
                          {expandedHistoryItems.has(idx) && (
                            <div className="flex flex-col gap-1.5 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                              {(item.comment || item.resolvedViaFallback) && (
                                <div className="flex flex-col gap-0.5 px-1.5 sm:px-2.5 py-1 bg-[#141416] border border-[#262629] rounded-md sm:rounded-lg">
                                  {item.comment && (
                                    <span className="text-[8px] sm:text-[10px] text-[#8E8E93] italic line-clamp-2">
                                      // {item.comment}
                                    </span>
                                  )}
                                  {item.resolvedViaFallback && (
                                    <span className="text-[8px] sm:text-[10px] text-amber-400/90 font-sans">
                                      Matched via fallback ({item.resolvedClassName}.{item.resolvedMemberName})
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Code Style Preview Line */}
                              <div className="px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-[#0F0F11] border border-[#262629] rounded-md sm:rounded-lg font-mono text-[8px] sm:text-[11px] text-indigo-200/90 overflow-x-auto whitespace-pre">
                                {singleSnippet}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* TAB CONTENT 2: FORMATTED CODE OUTPUT VIEW */}
                {historyModalTab === 'code' && (
                  <div className="flex flex-col bg-[#141416] rounded-xl sm:rounded-2xl border border-[#2D2D30] overflow-hidden">
                    <div className="p-2 sm:p-3 bg-[#1A1A1E] border-b border-[#2D2D30] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400" />
                        <span className="text-[10px] sm:text-xs font-mono font-semibold text-[#E2E2E4]">
                          {currentFormatted.filename}
                        </span>
                      </div>
                    </div>

                    <pre className="p-2 sm:p-4 font-mono text-[7px] sm:text-[10px] md:text-xs text-[#D8D8E0] overflow-x-auto max-h-80 sm:max-h-96 overflow-y-auto leading-normal sm:leading-relaxed selection:bg-indigo-600/40">
                      <code>{currentFormatted.code}</code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#2D2D30]">
                <button
                  onClick={() => {
                    onCopyText(currentFormatted.code, `${selectedHistoryRecord.profileName} (${activePresetObj.label})`);
                  }}
                  className="flex items-center gap-1.5 text-[10px] sm:text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-indigo-500/10 transition-colors"
                >
                  <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Copy All ({activePresetObj.label})</span>
                </button>

                <button
                  onClick={() => setSelectedHistoryRecord(null)}
                  className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-[#262629] hover:bg-[#323236] text-[#E2E2E4] rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Card Display & Target View Settings Modal */}
      {isCardSettingsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto p-2.5 sm:p-4 flex justify-center items-start sm:items-center">
          <div className="bg-[#1C1C1F] border border-[#35353A] rounded-xl sm:rounded-3xl p-3 sm:p-6 max-w-lg w-full shadow-2xl flex flex-col gap-2.5 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-8 sm:mt-0 mb-auto sm:my-auto shrink-0 max-h-[88vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[#2C2C30]">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <div className="p-1.5 sm:p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg sm:rounded-xl">
                  <Settings2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs sm:text-base font-bold text-[#E2E2E4]">Target Card Settings</h3>
                  <p className="text-[9px] sm:text-xs text-[#8E8E93]">Customize visible fields, badges, and layout</p>
                </div>
              </div>
              <button
                onClick={() => setIsCardSettingsModalOpen(false)}
                className="p-1 sm:p-1.5 text-[#8E8E93] hover:text-white hover:bg-[#2A2A2E] rounded-md sm:rounded-lg transition-colors"
                title="Close settings"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Modal Content / Options List */}
            <div className="flex flex-col gap-2 sm:gap-3 overflow-y-auto pr-0.5">
              {/* Density Segment */}
              <div className="bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#27272A] flex flex-col gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC]">Card Density</span>
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                  <button
                    onClick={() => updateCardViewSettings({ density: 'compact' })}
                    className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                      cardViewSettings.density === 'compact'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Compact (Mobile)
                  </button>
                  <button
                    onClick={() => updateCardViewSettings({ density: 'comfortable' })}
                    className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-medium border transition-all ${
                      cardViewSettings.density === 'comfortable'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Comfortable (Standard)
                  </button>
                </div>
              </div>

              {/* Tablet & Big Screen View Style (Hidden on Mobile, shown only on tablet/desktop) */}
              <div className="hidden md:flex bg-[#141416] p-3 rounded-xl border border-[#27272A] flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#D8D8DC]">Tablet & Large Screen Card Style</span>
                  <span className="text-[9px] text-indigo-400 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    Tab & Desktop Only
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateCardViewSettings({ tabletLayout: 'grid' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                      (cardViewSettings.tabletLayout || 'grid') === 'grid'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    Card Grid View (Side-by-side)
                  </button>
                  <button
                    onClick={() => updateCardViewSettings({ tabletLayout: 'list' })}
                    className={`py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                      cardViewSettings.tabletLayout === 'list'
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300 font-bold'
                        : 'bg-[#1E1E22] border-[#2E2E32] text-[#8E8E93] hover:text-white'
                    }`}
                  >
                    List View (Full Width)
                  </button>
                </div>
              </div>

              {/* Toggle Options Grid */}
              <div className="flex flex-col gap-1 sm:gap-2 bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#27272A]">
                <span className="text-[10px] sm:text-xs font-semibold text-[#D8D8DC] mb-0.5 sm:mb-1">Field & Card Visibility</span>

                {/* Show Fallbacks Toggle */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Fallbacks</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display alternate fallback class and field names</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardViewSettings.showFallbacks}
                    onChange={(e) => updateCardViewSettings({ showFallbacks: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Show Class Name */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Class Name</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display class identifier on cards</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardViewSettings.showClassName}
                    onChange={(e) => updateCardViewSettings({ showClassName: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Show Member Name */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Field / Method Name</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display target member name</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardViewSettings.showMemberName}
                    onChange={(e) => updateCardViewSettings({ showMemberName: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Show Custom Name */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Custom Name / Alias</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display user-defined alias tag if present</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardViewSettings.showCustomName}
                    onChange={(e) => updateCardViewSettings({ showCustomName: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Show Kind Badge */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Kind Badge</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display FIELD or METHOD pill badge</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardViewSettings.showKindBadge}
                    onChange={(e) => updateCardViewSettings({ showKindBadge: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>

                {/* Show Comments */}
                <label className="flex items-center justify-between p-1.5 sm:p-2 rounded-md sm:rounded-lg hover:bg-[#1E1E22] transition-colors cursor-pointer border-t border-[#222226]">
                  <div className="flex flex-col">
                    <span className="text-[11px] sm:text-xs font-medium text-[#E2E2E4]">Show Target Comments</span>
                    <span className="text-[9px] sm:text-[10px] text-[#8E8E93]">Display custom code notes and comments</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={cardViewSettings.showComments}
                    onChange={(e) => updateCardViewSettings({ showComments: e.target.checked })}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 accent-indigo-600 rounded cursor-pointer shrink-0"
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[#2C2C30]">
              <button
                onClick={() => {
                  setCardViewSettings(DEFAULT_TARGET_VIEW_SETTINGS);
                  try {
                    localStorage.removeItem('il2cpp_target_view_settings_v2');
                  } catch {}
                  showToast('Reset target card settings to default');
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8E8E93] hover:text-white hover:bg-[#262629] rounded-lg sm:rounded-xl transition-colors"
                title="Reset all settings to default"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Reset Defaults</span>
              </button>

              <button
                onClick={() => setIsCardSettingsModalOpen(false)}
                className="px-3.5 sm:px-5 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Clear All History */}
      {isConfirmClearHistoryOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm overflow-y-auto p-3 sm:p-4 flex justify-center items-start sm:items-center">
          <div className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-200 mt-20 sm:mt-0 mb-auto sm:my-auto shrink-0">
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="p-1.5 sm:p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl sm:rounded-2xl">
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-sm sm:text-base font-bold text-[#E2E2E4]">Clear All History?</h3>
                <p className="text-[10px] sm:text-xs text-[#8E8E93]">This will permanently delete all {scanHistory.length} scan logs.</p>
              </div>
            </div>

            <p className="text-[10px] sm:text-xs text-[#A0A0A5] leading-relaxed bg-[#141416] p-2 sm:p-3 rounded-lg sm:rounded-xl border border-[#2D2D30]">
              Are you sure you want to clear your scan history logs? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                onClick={() => setIsConfirmClearHistoryOpen(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[#8E8E93] hover:text-white bg-[#262629] hover:bg-[#323236] rounded-lg sm:rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  saveHistory([]);
                  setIsConfirmClearHistoryOpen(false);
                  showToast('All scan history cleared');
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-lg sm:rounded-xl shadow-md shadow-red-600/30 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
