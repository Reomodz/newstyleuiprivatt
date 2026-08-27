import {
  ProcessDescriptor,
  AssemblyDescriptor,
  NamespaceDescriptor,
  ClassInfoDescriptor,
  FieldDescriptor,
  MethodDescriptor,
  InstructionDescriptor,
  InstructionFlowKind,
} from '../types';

export const SAMPLE_PROCESSES: ProcessDescriptor[] = [
  {
    pid: 14205,
    name: 'com.unity.samplegame',
    appName: 'Shadow Realm: Unity 2022',
    startTicks: 1718293400,
    unityVersion: '2022.3.21f1',
    arch: 'arm64-v8a',
  },
  {
    pid: 28941,
    name: 'com.mihoyo.genshinimpact',
    appName: 'Genshin Impact',
    startTicks: 1718290000,
    unityVersion: '2021.3.18f1',
    arch: 'arm64-v8a',
  },
  {
    pid: 19832,
    name: 'com.riotgames.wildrift',
    appName: 'Wild Rift Engine',
    startTicks: 1718285000,
    unityVersion: '2022.2.8f1',
    arch: 'arm64-v8a',
  },
  {
    pid: 8402,
    name: 'com.epicgames.portal',
    appName: 'Unreal / Unity Bridge',
    startTicks: 1718280000,
    unityVersion: '2023.1.0f1',
    arch: 'arm64-v8a',
  },
];

export const SAMPLE_ASSEMBLIES: AssemblyDescriptor[] = [
  { index: 0, name: 'Assembly-CSharp.dll', classCount: 42 },
  { index: 1, name: 'UnityEngine.CoreModule.dll', classCount: 68 },
  { index: 2, name: 'UnityEngine.UI.dll', classCount: 29 },
  { index: 3, name: 'mscorlib.dll', classCount: 114 },
  { index: 4, name: 'GamePlay.Combat.dll', classCount: 24 },
  { index: 5, name: 'System.dll', classCount: 52 },
];

export const SAMPLE_NAMESPACES: NamespaceDescriptor[] = [
  // Assembly 0
  { index: 0, name: '', assemblyIndex: 0, classCount: 4 }, // Global namespace
  { index: 1, name: 'GamePlay.Core', assemblyIndex: 0, classCount: 12 },
  { index: 2, name: 'GamePlay.Player', assemblyIndex: 0, classCount: 8 },
  { index: 3, name: 'GamePlay.UI', assemblyIndex: 0, classCount: 10 },
  { index: 4, name: 'Network', assemblyIndex: 0, classCount: 8 },

  // Assembly 1
  { index: 5, name: 'UnityEngine', assemblyIndex: 1, classCount: 45 },
  { index: 6, name: 'UnityEngine.SceneManagement', assemblyIndex: 1, classCount: 11 },
  { index: 7, name: 'UnityEngine.Rendering', assemblyIndex: 1, classCount: 12 },

  // Assembly 2
  { index: 8, name: 'UnityEngine.UI', assemblyIndex: 2, classCount: 21 },
  { index: 9, name: 'UnityEngine.EventSystems', assemblyIndex: 2, classCount: 8 },

  // Assembly 3
  { index: 10, name: 'System', assemblyIndex: 3, classCount: 60 },
  { index: 11, name: 'System.Collections.Generic', assemblyIndex: 3, classCount: 30 },
  { index: 12, name: 'System.Threading.Tasks', assemblyIndex: 3, classCount: 24 },

  // Assembly 4
  { index: 13, name: 'GamePlay.Combat', assemblyIndex: 4, classCount: 16 },
  { index: 14, name: 'GamePlay.Combat.Abilities', assemblyIndex: 4, classCount: 8 },
];

export const SAMPLE_CLASSES: ClassInfoDescriptor[] = [
  // PlayerController
  {
    index: 0,
    name: 'PlayerController',
    namespaceName: 'GamePlay.Player',
    assemblyIndex: 0,
    assemblyName: 'Assembly-CSharp.dll',
    flags: 0x00100001,
    token: 0x02000045,
    bitfield: 0x1,
    parentType: { index: 100, typeIndex: 1, name: 'UnityEngine.MonoBehaviour' },
    sizes: {
      instanceSize: 0x78,
      nativeSize: 0x0,
      staticFieldsSize: 0x10,
      threadStaticFieldsSize: 0x0,
    },
  },
  // GameManager
  {
    index: 1,
    name: 'GameManager',
    namespaceName: 'GamePlay.Core',
    assemblyIndex: 0,
    assemblyName: 'Assembly-CSharp.dll',
    flags: 0x00100001,
    token: 0x02000046,
    bitfield: 0x1,
    parentType: { index: 100, typeIndex: 1, name: 'UnityEngine.MonoBehaviour' },
    sizes: {
      instanceSize: 0x60,
      nativeSize: 0x0,
      staticFieldsSize: 0x8,
      threadStaticFieldsSize: 0x0,
    },
  },
  // CombatManager
  {
    index: 2,
    name: 'CombatManager',
    namespaceName: 'GamePlay.Combat',
    assemblyIndex: 4,
    assemblyName: 'GamePlay.Combat.dll',
    flags: 0x00100001,
    token: 0x02000047,
    bitfield: 0x1,
    parentType: { index: 100, typeIndex: 1, name: 'UnityEngine.MonoBehaviour' },
    sizes: {
      instanceSize: 0x58,
      nativeSize: 0x0,
      staticFieldsSize: 0x0,
      threadStaticFieldsSize: 0x0,
    },
  },
  // GameObject
  {
    index: 3,
    name: 'GameObject',
    namespaceName: 'UnityEngine',
    assemblyIndex: 1,
    assemblyName: 'UnityEngine.CoreModule.dll',
    flags: 0x00100001,
    token: 0x02000020,
    bitfield: 0x1,
    parentType: { index: 101, typeIndex: 2, name: 'UnityEngine.Object' },
    sizes: {
      instanceSize: 0x28,
      nativeSize: 0x18,
      staticFieldsSize: 0x0,
      threadStaticFieldsSize: 0x0,
    },
  },
  // Transform
  {
    index: 4,
    name: 'Transform',
    namespaceName: 'UnityEngine',
    assemblyIndex: 1,
    assemblyName: 'UnityEngine.CoreModule.dll',
    flags: 0x00100001,
    token: 0x02000021,
    bitfield: 0x1,
    parentType: { index: 102, typeIndex: 3, name: 'UnityEngine.Component' },
    sizes: {
      instanceSize: 0x30,
      nativeSize: 0x20,
      staticFieldsSize: 0x0,
      threadStaticFieldsSize: 0x0,
    },
  },
  // Text
  {
    index: 5,
    name: 'Text',
    namespaceName: 'UnityEngine.UI',
    assemblyIndex: 2,
    assemblyName: 'UnityEngine.UI.dll',
    flags: 0x00100001,
    token: 0x02000050,
    bitfield: 0x1,
    parentType: { index: 103, typeIndex: 4, name: 'UnityEngine.UI.MaskableGraphic' },
    sizes: {
      instanceSize: 0x98,
      nativeSize: 0x0,
      staticFieldsSize: 0x0,
      threadStaticFieldsSize: 0x0,
    },
  },
  // NetworkClient
  {
    index: 6,
    name: 'NetworkClient',
    namespaceName: 'Network',
    assemblyIndex: 0,
    assemblyName: 'Assembly-CSharp.dll',
    flags: 0x00100001,
    token: 0x02000072,
    bitfield: 0x1,
    parentType: { index: 104, typeIndex: 5, name: 'System.Object' },
    sizes: {
      instanceSize: 0x48,
      nativeSize: 0x0,
      staticFieldsSize: 0x18,
      threadStaticFieldsSize: 0x0,
    },
  },
  // InventoryManager
  {
    index: 7,
    name: 'InventoryManager',
    namespaceName: 'GamePlay.Core',
    assemblyIndex: 0,
    assemblyName: 'Assembly-CSharp.dll',
    flags: 0x00100001,
    token: 0x02000088,
    bitfield: 0x1,
    parentType: { index: 100, typeIndex: 1, name: 'UnityEngine.MonoBehaviour' },
    sizes: {
      instanceSize: 0x50,
      nativeSize: 0x0,
      staticFieldsSize: 0x0,
      threadStaticFieldsSize: 0x0,
    },
  },
];

export const SAMPLE_FIELDS: Record<number, FieldDescriptor[]> = {
  // PlayerController fields
  0: [
    { index: 0, name: 'moveSpeed', typeIndex: 10, typeName: 'System.Single', offset: 0x18 },
    { index: 1, name: 'jumpForce', typeIndex: 10, typeName: 'System.Single', offset: 0x1c },
    { index: 2, name: 'health', typeIndex: 11, typeName: 'System.Int32', offset: 0x20 },
    { index: 3, name: 'maxHealth', typeIndex: 11, typeName: 'System.Int32', offset: 0x24 },
    { index: 4, name: 'isGrounded', typeIndex: 12, typeName: 'System.Boolean', offset: 0x28 },
    { index: 5, name: 'rigidbody', typeIndex: 13, typeName: 'UnityEngine.Rigidbody2D', offset: 0x30 },
    { index: 6, name: 'combatManager', typeIndex: 14, typeName: 'GamePlay.Combat.CombatManager', offset: 0x38 },
    { index: 7, name: 'playerName', typeIndex: 15, typeName: 'System.String', offset: 0x40 },
    { index: 8, name: 'inventory', typeIndex: 16, typeName: 'GamePlay.Core.InventoryManager', offset: 0x48 },
    { index: 9, name: 'Instance', typeIndex: 0, typeName: 'GamePlay.Player.PlayerController', offset: 0x0, isStatic: true },
  ],
  // GameManager fields
  1: [
    { index: 0, name: 'gameState', typeIndex: 11, typeName: 'System.Int32', offset: 0x18 },
    { index: 1, name: 'isPaused', typeIndex: 12, typeName: 'System.Boolean', offset: 0x1c },
    { index: 2, name: 'score', typeIndex: 11, typeName: 'System.Int32', offset: 0x20 },
    { index: 3, name: 'activePlayer', typeIndex: 0, typeName: 'GamePlay.Player.PlayerController', offset: 0x28 },
    { index: 4, name: 'networkClient', typeIndex: 17, typeName: 'Network.NetworkClient', offset: 0x30 },
    { index: 5, name: 'Instance', typeIndex: 1, typeName: 'GamePlay.Core.GameManager', offset: 0x0, isStatic: true },
  ],
  // CombatManager fields
  2: [
    { index: 0, name: 'attackPower', typeIndex: 10, typeName: 'System.Single', offset: 0x18 },
    { index: 1, name: 'defenseMultiplier', typeIndex: 10, typeName: 'System.Single', offset: 0x1c },
    { index: 2, name: 'criticalRate', typeIndex: 10, typeName: 'System.Single', offset: 0x20 },
    { index: 3, name: 'comboCount', typeIndex: 11, typeName: 'System.Int32', offset: 0x24 },
    { index: 4, name: 'targetEnemy', typeIndex: 18, typeName: 'UnityEngine.GameObject', offset: 0x28 },
  ],
  // GameObject fields
  3: [
    { index: 0, name: 'm_CachedPtr', typeIndex: 19, typeName: 'System.IntPtr', offset: 0x10 },
    { index: 1, name: 'layer', typeIndex: 11, typeName: 'System.Int32', offset: 0x18 },
    { index: 2, name: 'tag', typeIndex: 15, typeName: 'System.String', offset: 0x20 },
  ],
  // Transform fields
  4: [
    { index: 0, name: 'm_CachedPtr', typeIndex: 19, typeName: 'System.IntPtr', offset: 0x10 },
    { index: 1, name: 'localPosition', typeIndex: 20, typeName: 'UnityEngine.Vector3', offset: 0x18 },
    { index: 2, name: 'localRotation', typeIndex: 21, typeName: 'UnityEngine.Quaternion', offset: 0x24 },
    { index: 3, name: 'localScale', typeIndex: 20, typeName: 'UnityEngine.Vector3', offset: 0x34 },
  ],
  // Text fields
  5: [
    { index: 0, name: 'm_Text', typeIndex: 15, typeName: 'System.String', offset: 0x18 },
    { index: 1, name: 'm_FontData', typeIndex: 22, typeName: 'UnityEngine.UI.FontData', offset: 0x20 },
    { index: 2, name: 'm_FontSize', typeIndex: 11, typeName: 'System.Int32', offset: 0x28 },
    { index: 3, name: 'm_Color', typeIndex: 23, typeName: 'UnityEngine.Color', offset: 0x30 },
  ],
};

export const SAMPLE_METHODS: Record<number, MethodDescriptor[]> = {
  // PlayerController methods
  0: [
    {
      index: 0,
      classIndex: 0,
      name: 'Start',
      signature: 'public void Start()',
      returnType: 'System.Void',
      rva: 0x0182E400,
      address: 0x7B4282E400,
    },
    {
      index: 1,
      classIndex: 0,
      name: 'Update',
      signature: 'public void Update()',
      returnType: 'System.Void',
      rva: 0x0182E550,
      address: 0x7B4282E550,
    },
    {
      index: 2,
      classIndex: 0,
      name: 'HandleMovement',
      signature: 'private void HandleMovement(float horizontalInput)',
      returnType: 'System.Void',
      parameters: [{ name: 'horizontalInput', type: 'System.Single' }],
      rva: 0x0182E720,
      address: 0x7B4282E720,
    },
    {
      index: 3,
      classIndex: 0,
      name: 'Jump',
      signature: 'public void Jump()',
      returnType: 'System.Void',
      rva: 0x0182E880,
      address: 0x7B4282E880,
    },
    {
      index: 4,
      classIndex: 0,
      name: 'TakeDamage',
      signature: 'public void TakeDamage(int amount, bool isCritical)',
      returnType: 'System.Void',
      parameters: [
        { name: 'amount', type: 'System.Int32' },
        { name: 'isCritical', type: 'System.Boolean' },
      ],
      rva: 0x0182EA10,
      address: 0x7B4282EA10,
    },
    {
      index: 5,
      classIndex: 0,
      name: 'Die',
      signature: 'private void Die()',
      returnType: 'System.Void',
      rva: 0x0182EC00,
      address: 0x7B4282EC00,
    },
  ],
  // GameManager methods
  1: [
    {
      index: 0,
      classIndex: 1,
      name: 'Awake',
      signature: 'private void Awake()',
      returnType: 'System.Void',
      rva: 0x01901100,
      address: 0x7B42901100,
    },
    {
      index: 1,
      classIndex: 1,
      name: 'OnPlayerDeath',
      signature: 'public void OnPlayerDeath(PlayerController player)',
      returnType: 'System.Void',
      parameters: [{ name: 'player', type: 'GamePlay.Player.PlayerController' }],
      rva: 0x01901240,
      address: 0x7B42901240,
    },
    {
      index: 2,
      classIndex: 1,
      name: 'RestartLevel',
      signature: 'public void RestartLevel()',
      returnType: 'System.Void',
      rva: 0x01901400,
      address: 0x7B42901400,
    },
    {
      index: 3,
      classIndex: 1,
      name: 'AddScore',
      signature: 'public void AddScore(int points)',
      returnType: 'System.Void',
      parameters: [{ name: 'points', type: 'System.Int32' }],
      rva: 0x01901580,
      address: 0x7B42901580,
    },
  ],
  // CombatManager methods
  2: [
    {
      index: 0,
      classIndex: 2,
      name: 'ExecuteAttack',
      signature: 'public void ExecuteAttack(GameObject target, float damage)',
      returnType: 'System.Void',
      parameters: [
        { name: 'target', type: 'UnityEngine.GameObject' },
        { name: 'damage', type: 'System.Single' },
      ],
      rva: 0x01A10200,
      address: 0x7B42A10200,
    },
    {
      index: 1,
      classIndex: 2,
      name: 'CalculateDamage',
      signature: 'public float CalculateDamage(float baseDamage, bool isCrit)',
      returnType: 'System.Single',
      parameters: [
        { name: 'baseDamage', type: 'System.Single' },
        { name: 'isCrit', type: 'System.Boolean' },
      ],
      rva: 0x01A10350,
      address: 0x7B42A10350,
    },
    {
      index: 2,
      classIndex: 2,
      name: 'ApplyDebuff',
      signature: 'public void ApplyDebuff(int debuffId, float duration)',
      returnType: 'System.Void',
      parameters: [
        { name: 'debuffId', type: 'System.Int32' },
        { name: 'duration', type: 'System.Single' },
      ],
      rva: 0x01A104E0,
      address: 0x7B42A104E0,
    },
  ],
  // GameObject methods
  3: [
    {
      index: 0,
      classIndex: 3,
      name: 'Find',
      signature: 'public static GameObject Find(string name)',
      returnType: 'UnityEngine.GameObject',
      parameters: [{ name: 'name', type: 'System.String' }],
      rva: 0x01C20010,
      address: 0x7B42C20010,
      isStatic: true,
    },
    {
      index: 1,
      classIndex: 3,
      name: 'GetComponent',
      signature: 'public Component GetComponent(Type type)',
      returnType: 'UnityEngine.Component',
      parameters: [{ name: 'type', type: 'System.Type' }],
      rva: 0x01C201A0,
      address: 0x7B42C201A0,
    },
    {
      index: 2,
      classIndex: 3,
      name: 'SetActive',
      signature: 'public void SetActive(bool value)',
      returnType: 'System.Void',
      parameters: [{ name: 'value', type: 'System.Boolean' }],
      rva: 0x01C20300,
      address: 0x7B42C20300,
    },
  ],
};

// Real ARM64 machine instructions for each method
export const SAMPLE_INSTRUCTIONS: Record<string, InstructionDescriptor[]> = {
  // PlayerController.Start
  '0_0': [
    {
      address: 0x7B4282E400,
      rva: 0x0182E400,
      bytes: 'FD 7B BE A9',
      mnemonic: 'stp',
      operands: 'x29, x30, [sp, #-32]!',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E404,
      rva: 0x0182E404,
      bytes: 'FD 03 00 91',
      mnemonic: 'mov',
      operands: 'x29, sp',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E408,
      rva: 0x0182E408,
      bytes: 'F3 03 00 AA',
      mnemonic: 'mov',
      operands: 'x19, x0',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E40C,
      rva: 0x0182E40C,
      bytes: '60 02 40 F9',
      mnemonic: 'ldr',
      operands: 'x0, [x19, #0x20]',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E410,
      rva: 0x0182E410,
      bytes: '1F 00 00 F1',
      mnemonic: 'cmp',
      operands: 'x0, #0',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E414,
      rva: 0x0182E414,
      bytes: '40 00 00 54',
      mnemonic: 'b.eq',
      operands: '0x0182E420',
      flowKind: InstructionFlowKind.DIRECT_BRANCH,
      targetInstructionIndex: 7,
    },
    {
      address: 0x7B4282E418,
      rva: 0x0182E418,
      bytes: '10 01 00 94',
      mnemonic: 'bl',
      operands: '0x01C20010',
      flowKind: InstructionFlowKind.DIRECT_CALL,
      target: {
        classIndex: 3,
        methodIndex: 0,
        name: 'Find',
        ownerName: 'UnityEngine.GameObject',
        signature: 'public static GameObject Find(string name)',
        address: 0x7B42C20010,
        rva: 0x01C20010,
        callSiteAddress: 0x7B4282E418,
        callSiteRva: 0x0182E418,
        callSiteInstructionIndex: 6,
        canOpen: true,
      },
    },
    {
      address: 0x7B4282E41C,
      rva: 0x0182E41C,
      bytes: '60 02 00 F9',
      mnemonic: 'str',
      operands: 'x0, [x19, #0x28]',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E420,
      rva: 0x0182E420,
      bytes: 'E0 03 13 AA',
      mnemonic: 'mov',
      operands: 'x0, x19',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E424,
      rva: 0x0182E424,
      bytes: '2A 04 00 94',
      mnemonic: 'bl',
      operands: '0x0182E720',
      flowKind: InstructionFlowKind.DIRECT_CALL,
      target: {
        classIndex: 0,
        methodIndex: 2,
        name: 'HandleMovement',
        ownerName: 'GamePlay.Player.PlayerController',
        signature: 'private void HandleMovement(float horizontalInput)',
        address: 0x7B4282E720,
        rva: 0x0182E720,
        callSiteAddress: 0x7B4282E424,
        callSiteRva: 0x0182E424,
        callSiteInstructionIndex: 9,
        canOpen: true,
      },
    },
    {
      address: 0x7B4282E428,
      rva: 0x0182E428,
      bytes: 'FD 7B C2 A8',
      mnemonic: 'ldp',
      operands: 'x29, x30, [sp], #32',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282E42C,
      rva: 0x0182E42C,
      bytes: 'C0 03 5F D6',
      mnemonic: 'ret',
      operands: '',
      flowKind: InstructionFlowKind.NONE,
    },
  ],

  // PlayerController.TakeDamage
  '0_4': [
    {
      address: 0x7B4282EA10,
      rva: 0x0182EA10,
      bytes: 'FD 7B BE A9',
      mnemonic: 'stp',
      operands: 'x29, x30, [sp, #-32]!',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA14,
      rva: 0x0182EA14,
      bytes: 'F4 4F 01 A9',
      mnemonic: 'stp',
      operands: 'x20, x19, [sp, #16]',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA18,
      rva: 0x0182EA18,
      bytes: 'F3 03 00 AA',
      mnemonic: 'mov',
      operands: 'x19, x0',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA1C,
      rva: 0x0182EA1C,
      bytes: 'F4 03 01 AA',
      mnemonic: 'mov',
      operands: 'x20, x1',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA20,
      rva: 0x0182EA20,
      bytes: '61 12 40 B9',
      mnemonic: 'ldr',
      operands: 'w1, [x19, #0x20]',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA24,
      rva: 0x0182EA24,
      bytes: '21 00 14 4B',
      mnemonic: 'sub',
      operands: 'w1, w1, w20',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA28,
      rva: 0x0182EA28,
      bytes: '61 12 00 B9',
      mnemonic: 'str',
      operands: 'w1, [x19, #0x20]',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA2C,
      rva: 0x0182EA2C,
      bytes: '1F 00 00 71',
      mnemonic: 'cmp',
      operands: 'w1, #0',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA30,
      rva: 0x0182EA30,
      bytes: '4C 00 00 54',
      mnemonic: 'b.gt',
      operands: '0x0182EA40',
      flowKind: InstructionFlowKind.DIRECT_BRANCH,
      targetInstructionIndex: 10,
    },
    {
      address: 0x7B4282EA34,
      rva: 0x0182EA34,
      bytes: 'E0 03 13 AA',
      mnemonic: 'mov',
      operands: 'x0, x19',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA38,
      rva: 0x0182EA38,
      bytes: '72 00 00 94',
      mnemonic: 'bl',
      operands: '0x0182EC00',
      flowKind: InstructionFlowKind.DIRECT_CALL,
      target: {
        classIndex: 0,
        methodIndex: 5,
        name: 'Die',
        ownerName: 'GamePlay.Player.PlayerController',
        signature: 'private void Die()',
        address: 0x7B4282EC00,
        rva: 0x0182EC00,
        callSiteAddress: 0x7B4282EA38,
        callSiteRva: 0x0182EA38,
        callSiteInstructionIndex: 10,
        canOpen: true,
      },
    },
    {
      address: 0x7B4282EA3C,
      rva: 0x0182EA3C,
      bytes: '55 06 00 94',
      mnemonic: 'bl',
      operands: '0x01901240',
      flowKind: InstructionFlowKind.DIRECT_CALL,
      target: {
        classIndex: 1,
        methodIndex: 1,
        name: 'OnPlayerDeath',
        ownerName: 'GamePlay.Core.GameManager',
        signature: 'public void OnPlayerDeath(PlayerController player)',
        address: 0x7B42901240,
        rva: 0x01901240,
        callSiteAddress: 0x7B4282EA3C,
        callSiteRva: 0x0182EA3C,
        callSiteInstructionIndex: 11,
        canOpen: true,
      },
    },
    {
      address: 0x7B4282EA40,
      rva: 0x0182EA40,
      bytes: 'F4 4F 41 A9',
      mnemonic: 'ldp',
      operands: 'x20, x19, [sp, #16]',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA44,
      rva: 0x0182EA44,
      bytes: 'FD 7B C2 A8',
      mnemonic: 'ldp',
      operands: 'x29, x30, [sp], #32',
      flowKind: InstructionFlowKind.NONE,
    },
    {
      address: 0x7B4282EA48,
      rva: 0x0182EA48,
      bytes: 'C0 03 5F D6',
      mnemonic: 'ret',
      operands: '',
      flowKind: InstructionFlowKind.NONE,
    },
  ],
};

// Direct relationships for building recursive call graphs
export interface MethodCallRelation {
  fromClass: number;
  fromMethod: number;
  toClass: number;
  toMethod: number;
  callSiteRva: string;
}

export const CALL_RELATIONS: MethodCallRelation[] = [
  // PlayerController.Start -> GameObject.Find
  { fromClass: 0, fromMethod: 0, toClass: 3, toMethod: 0, callSiteRva: '0x0182E418' },
  // PlayerController.Start -> PlayerController.HandleMovement
  { fromClass: 0, fromMethod: 0, toClass: 0, toMethod: 2, callSiteRva: '0x0182E424' },
  // PlayerController.TakeDamage -> PlayerController.Die
  { fromClass: 0, fromMethod: 4, toClass: 0, toMethod: 5, callSiteRva: '0x0182EA38' },
  // PlayerController.TakeDamage -> GameManager.OnPlayerDeath
  { fromClass: 0, fromMethod: 4, toClass: 1, toMethod: 1, callSiteRva: '0x0182EA3C' },
  // CombatManager.ExecuteAttack -> PlayerController.TakeDamage
  { fromClass: 2, fromMethod: 0, toClass: 0, toMethod: 4, callSiteRva: '0x01A10288' },
  // CombatManager.ExecuteAttack -> CombatManager.CalculateDamage
  { fromClass: 2, fromMethod: 0, toClass: 2, toMethod: 1, callSiteRva: '0x01A10240' },
  // GameManager.OnPlayerDeath -> GameManager.RestartLevel
  { fromClass: 1, fromMethod: 1, toClass: 1, toMethod: 2, callSiteRva: '0x01901290' },
  // GameManager.Awake -> GameObject.Find
  { fromClass: 1, fromMethod: 0, toClass: 3, toMethod: 0, callSiteRva: '0x01901140' },
  // PlayerController.Update -> PlayerController.HandleMovement
  { fromClass: 0, fromMethod: 1, toClass: 0, toMethod: 2, callSiteRva: '0x0182E590' },
  // PlayerController.Update -> PlayerController.Jump
  { fromClass: 0, fromMethod: 1, toClass: 0, toMethod: 3, callSiteRva: '0x0182E5C4' },
];
