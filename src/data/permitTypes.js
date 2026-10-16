export const PERMIT_TYPES = [
  {
    id: 'hot_work',
    name: 'Hot Work / أعمال ساخنة',
    emoji: '🔥',
    colorClass: 'orange',
    defaultRisk: 'riskCritical',
    dynamicFields: [
      { id: 'hotWorkType', label: 'Hot Work Type / نوع العمل الساخن', type: 'select', options: ['Welding / لحام', 'Cutting / قطع', 'Grinding / طحن', 'Brazing / لحام بالنحاس', 'Other / أخرى'], required: true },
      { id: 'fireWatchName', label: 'Fire Watch Name / اسم مراقب الحريق', type: 'text', required: true },
      { id: 'clearanceDistance', label: 'Clearance from flammables (m) / البُعد عن المشتعلات', type: 'number', required: true },
      { id: 'gasTestResult', label: 'Gas Test Result / نتيجة فحص الغاز', type: 'text', required: false },
    ],
    checklist: [
      'إبعاد المواد القابلة للاشتعال 11 متر على الأقل',
      'توفير طفاية حريق صالحة للاستخدام',
      'تعيين مراقب حريق (Fire Watch) طوال فترة العمل',
      'فحص خلو بيئة العمل من الغازات القابلة للاشتعال',
      'تغطية البالوعات والفتحات بأغطية غير قابلة للاشتعال',
    ]
  },
  {
    id: 'cold_work',
    name: 'Cold Work / أعمال باردة',
    emoji: '🔧',
    colorClass: 'blue',
    defaultRisk: 'riskMedium',
    dynamicFields: [
      { id: 'workEquipment', label: 'Equipment Used / المعدات المستخدمة', type: 'text', required: true },
      { id: 'ppeRequired', label: 'PPE Required / مهمات الوقاية المطلوبة', type: 'text', required: true },
      { id: 'nearbyHazards', label: 'Nearby Hazards / المخاطر المجاورة', type: 'text', required: false },
    ],
    checklist: [
      'ارتداء مهمات الوقاية الشخصية الأساسية',
      'التأكد من صلاحية جميع الأدوات والمعدات',
      'الحفاظ على نظافة وترتيب بيئة العمل',
      'إبلاغ المشرف عند اكتشاف أي مخاطر',
    ]
  },
  {
    id: 'confined_space',
    name: 'Confined Space Entry / دخول أماكن مغلقة',
    emoji: '🚪',
    colorClass: 'amber',
    defaultRisk: 'riskCritical',
    dynamicFields: [
      { id: 'spaceDescription', label: 'Space Description / وصف المكان المغلق', type: 'text', required: true },
      { id: 'o2Level', label: 'O₂ Level (%) / نسبة الأكسجين', type: 'number', required: true },
      { id: 'gasLevel', label: 'Toxic Gas Level (ppm) / مستوى الغازات السامة', type: 'number', required: true },
      { id: 'holeWatchName', label: 'Hole Watch Name / اسم المراقب الخارجي', type: 'text', required: true },
      { id: 'rescuePlanReady', label: 'Rescue Plan Ready / خطة الإنقاذ جاهزة', type: 'select', options: ['Yes / نعم', 'No / لا'], required: true },
    ],
    checklist: [
      'قياس نسبة الأكسجين (يجب 19.5% - 23.5%)',
      'قياس مستوى الغازات السامة وتأكيد السلامة',
      'توفير تهوية ميكانيكية مستمرة',
      'تواجد مراقب خارجي (Hole Watch) طوال الوقت',
      'جاهزية خطة الطوارئ وأدوات الإنقاذ',
      'عزل جميع مصادر الطاقة (LOTO)',
    ]
  },
  {
    id: 'lifting',
    name: 'Lifting / أعمال رفع',
    emoji: '🏗️',
    colorClass: 'purple',
    defaultRisk: 'riskHigh',
    dynamicFields: [
      { id: 'liftingEquipment', label: 'Lifting Equipment / معدة الرفع', type: 'text', required: true },
      { id: 'loadWeight', label: 'Load Weight (tons) / وزن الحمولة (طن)', type: 'number', required: true },
      { id: 'riggerName', label: 'Certified Rigger / اسم Rigger المعتمد', type: 'text', required: true },
      { id: 'windSpeed', label: 'Current Wind Speed (km/h) / سرعة الرياح', type: 'number', required: false },
    ],
    checklist: [
      'فحص واير الرفع والتأكد من سلامته',
      'تطويق منطقة الرفع بالكامل',
      'اعتماد رجل الإشارة (Rigger)',
      'عدم تجاوز الحمولة القصوى للمعدة',
      'فرد الركائز (Outriggers) بالكامل',
    ]
  },
  {
    id: 'electrical',
    name: 'Electrical Work / أعمال كهربائية',
    emoji: '⚡',
    colorClass: 'yellow',
    defaultRisk: 'riskHigh',
    dynamicFields: [
      { id: 'voltageLevel', label: 'Voltage Level (V) / الجهد الكهربائي', type: 'number', required: true },
      { id: 'panelId', label: 'Panel/Circuit ID / رقم اللوحة', type: 'text', required: true },
      { id: 'lotoApplied', label: 'LOTO Applied / تم تطبيق LOTO', type: 'select', options: ['Yes / نعم', 'No / لا'], required: true },
    ],
    checklist: [
      'تطبيق نظام عزل الطاقة (LOTO) بشكل كامل',
      'التحقق من حالة Zero Energy',
      'استخدام أدوات وملابس عازلة للكهرباء',
      'التأكد من صلاحية نظام التأريض (Earthing)',
    ]
  },
  {
    id: 'loto',
    name: 'LOTO / عزل مصادر الطاقة',
    emoji: '🔒',
    colorClass: 'red',
    defaultRisk: 'riskCritical',
    dynamicFields: [
      { id: 'energySourceType', label: 'Energy Source Type / نوع مصدر الطاقة', type: 'select', options: ['Electrical / كهربائي', 'Hydraulic / هيدروليكي', 'Pneumatic / هوائي', 'Mechanical / ميكانيكي', 'Multiple / متعدد'], required: true },
      { id: 'isolationPoints', label: 'Number of Isolation Points / عدد نقاط العزل', type: 'number', required: true },
      { id: 'affectedEquipment', label: 'Affected Equipment / المعدة المراد عزلها', type: 'text', required: true },
      { id: 'zeroEnergyVerified', label: 'Zero Energy Verified / تم التحقق من Zero Energy', type: 'select', options: ['Yes / نعم', 'No / لا'], required: true },
      { id: 'storedEnergyReleased', label: 'Stored Energy Released / تم تفريغ الطاقة المخزنة', type: 'select', options: ['Yes / نعم', 'N/A / لا ينطبق'], required: true },
    ],
    checklist: [
      'فصل التيار من المصدر ووضع القفل الشخصي',
      'تفريغ أي طاقة كامنة (ضغط، سوائل، هواء)',
      'اختبار المعدة للتأكد من حالة Zero Energy',
      'وضع اللافتات التحذيرية على نقاط العزل',
      'كل عامل يحتفظ بمفتاح قفله الخاص',
    ]
  },
  {
    id: 'excavation',
    name: 'Excavation / أعمال حفر',
    emoji: '⛏️',
    colorClass: 'stone',
    defaultRisk: 'riskHigh',
    dynamicFields: [
      { id: 'excavationDepth', label: 'Depth (m) / عمق الحفر (م)', type: 'number', required: true },
      { id: 'excavationWidth', label: 'Width (m) / عرض الحفر (م)', type: 'number', required: true },
      { id: 'soilType', label: 'Soil Type / نوع التربة', type: 'select', options: ['Type A - Stable / صنف أ - مستقرة', 'Type B - Moderate / صنف ب - متوسطة', 'Type C - Unstable / صنف ج - غير مستقرة'], required: true },
      { id: 'undergroundServices', label: 'Underground Services / فحص الخدمات الأرضية', type: 'select', options: ['Cleared / تم الفحص - آمن', 'Marked / تم الترقيم', 'Not Checked / لم يتم الفحص'], required: true },
      { id: 'shoringRequired', label: 'Shoring Required / مطلوب تدعيم', type: 'select', options: ['Yes / نعم', 'No / لا'], required: true },
    ],
    checklist: [
      'فحص وتحديد جميع الخدمات الأرضية',
      'تركيب حواجز وتحذيرات حول منطقة الحفر',
      'التأكد من استقرار جوانب الحفرة',
      'توفير وسيلة دخول وخروج آمنة',
      'فحص الحفرة بعد كل هطول أمطار',
    ]
  },
  {
    id: 'scaffold_tag',
    name: 'Scaffold Tag / بطاقة سقالة',
    emoji: '🏗',
    colorClass: 'green',
    defaultRisk: 'riskHigh',
    dynamicFields: [
      { id: 'scaffoldHeight', label: 'Scaffold Height (m) / ارتفاع السقالة (م)', type: 'number', required: true },
      { id: 'scaffoldType', label: 'Scaffold Type / نوع السقالة', type: 'select', options: ['Fixed / ثابتة', 'Mobile / متحركة', 'Suspended / معلقة', 'Cantilever / كونسول'], required: true },
      { id: 'tagColor', label: 'Tag Color / لون البطاقة', type: 'select', options: ['Green - Safe / أخضر - آمن', 'Yellow - Caution / أصفر - تنبيه', 'Red - Do Not Use / أحمر - ممنوع'], required: true },
      { id: 'maxLoad', label: 'Max Load (kg) / الحمولة القصوى', type: 'number', required: true },
    ],
    checklist: [
      'فحص هيكل السقالة ومكوناتها يومياً',
      'التأكد من اكتمال حواجز الحماية (Guardrails)',
      'حزام الأمان إلزامي فوق 1.8 متر',
      'ربط السقالة بالمبنى أو توفير دعامات تثبيت',
      'تعليق بطاقة الحالة المناسبة بشكل واضح',
    ]
  },
  {
    id: 'heavy_lift',
    name: 'Heavy Lift / رفع ثقيل',
    emoji: '🏋️',
    colorClass: 'indigo',
    defaultRisk: 'riskCritical',
    dynamicFields: [
      { id: 'liftingPlan', label: 'Lifting Plan Ref. / مرجع خطة الرفع', type: 'text', required: true },
      { id: 'craneCapacity', label: 'Crane Capacity (tons) / سعة الرافعة', type: 'number', required: true },
      { id: 'liftLoadWeight', label: 'Load Weight (tons) / وزن الحمولة', type: 'number', required: true },
      { id: 'liftCategory', label: 'Lift Category / تصنيف الرفع', type: 'select', options: ['Routine / عادي', 'Non-Routine / غير عادي', 'Critical / حرج', 'Tandem / مزدوج'], required: true },
      { id: 'groundCondition', label: 'Ground Condition / حالة الأرض', type: 'select', options: ['Solid / صلبة', 'Soft - Pads Required / لينة - تحتاج ألواح', 'Unknown / غير معروف'], required: true },
    ],
    checklist: [
      'الحصول على خطة الرفع المعتمدة',
      'فحص واير الرفع ومعدات الشد (Rigging)',
      'فرد الركائز بالكامل على أرض صلبة',
      'تطويق منطقة الرفع ومنع المرور أسفل الحمولة',
      'التأكد أن الحمولة لا تتجاوز 80% من سعة الرافعة',
    ]
  },
  {
    id: 'electrical_isolation',
    name: 'Electrical Isolation / عزل كهربائي',
    emoji: '🔌',
    colorClass: 'rose',
    defaultRisk: 'riskCritical',
    dynamicFields: [
      { id: 'circuitId', label: 'Circuit/Panel ID / رقم الدائرة/اللوحة', type: 'text', required: true },
      { id: 'systemVoltage', label: 'System Voltage (kV) / جهد النظام', type: 'number', required: true },
      { id: 'isolationMethod', label: 'Isolation Method / طريقة العزل', type: 'select', options: ['Circuit Breaker + Lock / قاطع + قفل', 'Fuse Removal / فصل الفيوز', 'Disconnect Switch / مفتاح فصل', 'Other / أخرى'], required: true },
      { id: 'testingDevice', label: 'Testing Device Used / جهاز اختبار الجهد', type: 'text', required: true },
      { id: 'affectedSystems', label: 'Affected Systems / الأنظمة المتأثرة', type: 'text', required: true },
    ],
    checklist: [
      'مراجعة مخططات الدائرة الكهربائية',
      'استخدام جهاز اختبار الجهد لتأكيد انعدام الطاقة',
      'تطبيق قفل (Lock) ولافتة (Tag) على نقطة العزل',
      'تفريغ المكثفات والطاقة المخزنة',
      'إخطار مركز التحكم والأقسام المتأثرة',
    ]
  }
];

export const RISK_LEVELS = [
  { id: 'riskLow',      label: 'Low / منخفض',    color: 'emerald', emoji: '🟢' },
  { id: 'riskMedium',   label: 'Medium / متوسط',  color: 'amber',   emoji: '🟡' },
  { id: 'riskHigh',     label: 'High / عالي',     color: 'orange',  emoji: '🟠' },
  { id: 'riskCritical', label: 'Critical / حرج',  color: 'red',     emoji: '🔴' },
];

export const APPROVAL_LEVELS = [
  { level: 0, roleKey: null,         label: 'Submitted',         labelAr: 'تم التقديم' },
  { level: 1, roleKey: 'supervisor', label: 'Supervisor Review', labelAr: 'مراجعة المشرف' },
  { level: 2, roleKey: 'safety',     label: 'Safety Engineer',   labelAr: 'اعتماد مهندس السلامة' },
  { level: 3, roleKey: 'pm',         label: 'Project Manager',   labelAr: 'اعتماد مدير المشروع' },
  { level: 4, roleKey: null,         label: 'Fully Approved',    labelAr: 'معتمد بالكامل' },
];
