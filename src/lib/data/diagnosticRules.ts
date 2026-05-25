export const LOCAL_DIAGNOSTIC_RULES: any[] = [
  {
    "fault_id": "UNBALANCE",
    "category": "Imbalance",
    "name": "Unbalance",
    "name_th": "มอเตอร์ไม่สมดุล",
    "severity_base": "concern",
    "indicators": [
      {
        "type": "order_peak",
        "order": 1.0,
        "tolerance": 0.03,
        "axis": ["H", "V"],
        "condition": "dominant",
        "weight": 50
      },
      {
        "type": "axis_ratio",
        "compare": "radial > axial",
        "min_ratio": 1.5,
        "weight": 30
      },
      {
        "type": "harmonic_absence",
        "orders": [2.0, 3.0, 4.0],
        "max_count": 1,
        "weight": 20
      }
    ],
    "recommendation": {
      "th": "กรุณาตรวจสอบความสะอาดของใบพัด หรือทำการถ่วงสมดุล (Balancing) โรเตอร์ใหม่",
      "en": "Check impeller cleanliness or perform rotor balancing"
    },
    "description": {
      "th": "โรเตอร์หรือส่วนหมุนของเครื่องจักรมีมวลกระจายตัวไม่เท่ากันรอบแกนหมุน ส่งผลให้เกิดแรงเหวี่ยงหนีศูนย์กลางในทิศทางรัศมีขณะทำงาน",
      "en": "The machine's rotor or rotating parts have an uneven distribution of mass around the rotational axis, resulting in centrifugal forces in the radial direction during operation."
    },
    "causes": {
      "th": [
        "การสะสมของคราบฝุ่น ขี้ดิน หรือสิ่งสกปรกบนใบพัดหรือโรเตอร์แบบไม่สม่ำเสมอ",
        "การสึกหรอหรือการกัดกร่อนของใบพัดที่ไม่เท่ากันระหว่างทำงาน",
        "ความผิดพลาดจากการประกอบชิ้นส่วน หรือการติดตั้งสลักน้ำหนักถ่วงสมดุลไม่ถูกต้อง",
        "การบิดเบี้ยวหรือชำรุดเสียหายของใบพัดหลังจากผ่านการใช้งานมาระยะหนึ่ง"
      ],
      "en": [
        "Uneven build-up of dirt, dust, or process materials on the fan blades or rotor.",
        "Asymmetrical wear or erosion of the impeller during operation.",
        "Assembly errors or incorrect installation of rotor balancing counterweights.",
        "Deformation or mechanical damage to the impeller/blades over time."
      ]
    },
    "reasoning": {
      "th": "จากการวิเคราะห์สเปกตรัมความถี่ (FFT) พบว่ามีพลังงานความสั่นสะเทือนโด่งอย่างเห็นได้ชัดที่ความถี่ 1X ของรอบหมุนมอเตอร์ (Running Speed) ในแกนรัศมี (Horizontal และ Vertical) ในขณะที่ยอดฮาร์มอนิกอื่นๆ (2X, 3X, 4X) มีขนาดต่ำมากหรือไม่ปรากฏเลย",
      "en": "FFT spectrum analysis shows a dominant vibration peak at 1X of the motor's running speed in the radial axes (Horizontal and Vertical), while other harmonics (2X, 3X, 4X) remain negligible or absent."
    },
    "how_to_fix": {
      "th": "ทำความสะอาดใบพัดและโรเตอร์เพื่อเอาสิ่งสกปรกออก หากความสั่นสะเทือนยังไม่ลดลง ควรทำความสะอาดพื้นผิว สังเกตความเสียหายเชิงกล และดำเนินการถ่วงสมดุลใหม่ (Dynamic Balancing) หน้างานตามมาตรฐาน",
      "en": "Clean the fan blades and rotor to remove deposits. If vibration persists, inspect for mechanical damage and perform a dynamic balancing session on-site."
    },
    "measurement_method": {
      "th": "ตรวจสอบกราฟความถี่ FFT (Frequency Spectrum) ที่จุด 1X Running Speed ในแนว radial (Horizontal/Vertical) แล้วเปรียบเทียบกับแกนหมุนตามยาว (Axial) ซึ่งแกนรัศมีควรจะสูงกว่าอย่างน้อย 1.5 เท่าขึ้นไป",
      "en": "Analyze the FFT frequency spectrum at 1X Running Speed in the radial directions (H/V) and compare it against the axial (A) direction; radial vibration should be at least 1.5 times higher."
    },
    "references": [
      {
        "source": "Technical Associates of Charlotte - Illustrated Vibration Diagnostic Wall Chart",
        "section": "Mass Unbalance - Force Unbalance",
        "details": "Vibration is sinusoidal and radial (H or V). Peak at 1X RPM is dominant. 90-degree phase difference between Horizontal and Vertical."
      },
      {
        "source": "ISO 20816-1:2016",
        "section": "Measurement and evaluation of machine vibration - Part 1: General guidelines",
        "details": "Provides threshold limits and guidelines for evaluation of vibration severity in rotating machinery due to residual unbalance."
      },
      {
        "source": "Mobius Institute - Vibration Analysis Category II Training Manual",
        "section": "Unbalance Diagnosis Criteria",
        "details": "Mass unbalance produces a steady, stable 1X amplitude in the radial plane, with phase difference corresponding to sensor mounting orientation."
      }
    ]
  },
  {
    "fault_id": "MISALIGNMENT",
    "category": "Alignment",
    "name": "Misalignment",
    "name_th": "เพลาเยื้องศูนย์",
    "severity_base": "concern",
    "indicators": [
      {
        "type": "order_peak",
        "order": 1.0,
        "tolerance": 0.03,
        "axis": ["A"],
        "condition": "present",
        "weight": 30
      },
      {
        "type": "order_peak",
        "order": 2.0,
        "tolerance": 0.03,
        "axis": ["A", "H", "V"],
        "condition": "present",
        "weight": 40
      },
      {
        "type": "axis_ratio",
        "compare": "axial >= 0.5 * radial",
        "min_ratio": 0.5,
        "weight": 30
      }
    ],
    "recommendation": {
      "th": "ตรวจสอบการตั้งศูนย์เพลาและข้อต่อ (Coupling Alignment) รวมถึงสภาพของ Coupling",
      "en": "Check shaft alignment and coupling condition"
    },
    "description": {
      "th": "จุดศูนย์กลางเพลาหมุนของมอเตอร์กับเพลาหมุนของเครื่องขับเคลื่อน (เช่น ปั๊ม, พัดลม) ไม่อยู่ในระนาบและแนวระดับเดียวกัน (มีทั้งแบบเยื้องศูนย์แบบขนาน แบบมุม หรือแบบผสม)",
      "en": "The rotational axes of the motor shaft and the driven shaft (e.g., pump, fan) are not collinear, resulting in angular, parallel, or combined offset misalignment."
    },
    "causes": {
      "th": [
        "การติดตั้งตั้งศูนย์เครื่องจักรเริ่มต้นไม่ได้ระดับที่ถูกต้อง",
        "การขยายตัวทางความร้อนของส่วนต่างๆ ของโครงสร้างขณะทำงานจริง (Thermal Growth)",
        "ความแข็งแรงของฐานเครื่องไม่ดีพอ เกิดการบิดตัวเมื่อมีแรงบิดสะสม (Soft Foot)",
        "การขันน็อตหน้าแปลนคัปปลิ้งแน่นหนาไม่เท่ากัน หรือข้อต่อคัปปลิ้งชำรุดเสียหาย"
      ],
      "en": [
        "Improper initial shaft alignment calibration during machine setup.",
        "Thermal growth of structural components under actual working temperatures.",
        "Structural base deformation due to torque loading or uneven bolting (Soft Foot).",
        "Incorrect coupling installation or worn/damaged coupling components."
      ]
    },
    "reasoning": {
      "th": "การสั่นที่ทิศทางแกนหมุน (Axial) จะโด่งขึ้นมาอย่างผิดสังเกต (มักจะมากกว่า 50% ของแนวแกนรัศมี H/V) โดยมีความสั่นโดดเด่นที่ยอดความถี่ 1X, 2X หรือ 3X ของรอบหมุน",
      "en": "Vibration in the axial direction (A) rises significantly, often exceeding 50% of the radial values (H/V), with high energy peaks visible at 1X, 2X, or 3X running speed harmonics."
    },
    "how_to_fix": {
      "th": "หยุดทำงานเครื่องจักร ตรวจสอบและตั้งศูนย์เพลา (Coupling Alignment) ใหม่โดยใช้เครื่องเลเซอร์ หรือไดอัลเกจให้ได้ค่าความคาดเคลื่อนต่ำกว่าที่มาตรฐานผู้ผลิตระบุ และตรวจสอบสภาพคัปปลิ้ง",
      "en": "Shut down the machine, inspect, and perform a precision coupling alignment using a laser alignment tool or dial indicators, checking for compliance with tolerance standards."
    },
    "measurement_method": {
      "th": "วัดความสั่นทิศทางแกนหมุน (Axial) เปรียบเทียบกับแกนรัศมี (Radial) โดยเพลาเยื้องศูนย์จะมีอัตราส่วน Axial/Radial ตั้งแต่ 0.5 เท่าขึ้นไป และมักพบยอดเด่นที่ 2X ในเกือบทุกแกน",
      "en": "Measure axial vibration compared to radial vibration; misalignment typically shows an Axial-to-Radial ratio >= 0.5, alongside a prominent 2X peak in multiple directions."
    },
    "references": [
      {
        "source": "Technical Associates of Charlotte - Illustrated Vibration Diagnostic Wall Chart",
        "section": "Coupling Misalignment (Angular & Parallel)",
        "details": "Angular misalignment generates high axial 1X and some 2X/3X. Parallel misalignment generates high radial 2X and some 1X/3X. Axial phase is 180 degrees out-of-phase across the coupling."
      },
      {
        "source": "ISO 13373-3:2015",
        "section": "Condition monitoring and diagnostics of machines - Part 3: Guidelines for vibration diagnosis",
        "details": "Outlines typical spectral indicators of shaft misalignment including 2X dominance and axial-to-radial transmission profiles."
      }
    ]
  },
  {
    "fault_id": "LOOSENESS",
    "category": "Looseness",
    "name": "Mechanical Looseness",
    "name_th": "ฐานหลวม / น็อตคลาย",
    "severity_base": "warning",
    "indicators": [
      {
        "type": "harmonic_presence",
        "orders": [2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
        "min_count": 3,
        "axis": ["H", "V"],
        "tolerance": 0.05,
        "weight": 80
      },
      {
        "type": "order_peak",
        "order": 1.0,
        "tolerance": 0.03,
        "axis": ["H", "V"],
        "condition": "present",
        "weight": 20
      }
    ],
    "recommendation": {
      "th": "ตรวจสอบความแน่นของน็อตยึดฐานเครื่อง โครงสร้างรองรับ และจุดจับยึดต่างๆ",
      "en": "Check tightness of foundation bolts, baseplate, and mounting structures"
    },
    "description": {
      "th": "เกิดความหลวมตัวเชิงกลในโครงสร้างเครื่องจักร เช่น น็อตยึดฐานเครื่องหลวม ขาตั้งเครื่องลอย (Soft Foot) หรือความหลวมของชิ้นส่วนภายในเครื่องจักรเอง",
      "en": "Vibration induced by mechanical play, structural weakness, or loose bolts. Examples include foundation bolt loosening, soft foot conditions, or play in bearing housings."
    },
    "causes": {
      "th": [
        "สลักเกลียวหรือน็อตฐานเครื่อง (Foundation Bolts) คลายตัวจากการสั่นสะเทือนสะสม",
        "ฐานคอนกรีตเกิดรอยแตกร้าวชำรุด หรือแผ่นชิมบิดเบี้ยวชำรุด (Soft Foot)",
        "ความหลวมของเสื้อแบริ่ง (Bearing Housing) หรือการติดตั้งแบริ่งหลวมเกินขีดจำกัด",
        "โครงสร้างแท่นเครื่องอ่อนแอหรือชำรุดเสื่อมสภาพตามกาลเวลา"
      ],
      "en": [
        "Loose foundation or anchor bolts due to long-term operational vibration.",
        "Damaged concrete foundation, cracked base frame, or unlevelled shims (Soft Foot).",
        "Excessive clearance in the bearing housing or rotating components.",
        "Weak support structure or degradation of structural joints over time."
      ]
    },
    "reasoning": {
      "th": "สเปกตรัม FFT จะแสดงผลยอดฮาร์มอนิกสั่นสะเทือนหลายตัวเป็นขบวน (1X, 2X, 3X... ไปจนถึง 10X) ซึ่งเป็นรูปแบบของการสั่นแบบไม่เป็นเส้นตรง (Non-linear Response) ที่เกิดจากการกระทบกันของชิ้นส่วน",
      "en": "The FFT spectrum shows a distinct floor of running speed harmonics (1X, 2X, 3X... up to 10X), representing a non-linear structural response caused by impacting elements."
    },
    "how_to_fix": {
      "th": "ทำการตรวจสอบและกวดขันสลักเกลียวยึดฐานเครื่องทั้งหมดด้วยประแจทอร์ค ตรวจเช็คระนาบขาตั้งมอเตอร์ (Soft Foot) เสริมแผ่นชิมซ่อมแซมโครงสร้าง หรือแก้ไขเสื้อแบริ่งที่หลวม",
      "en": "Inspect and retighten all anchor and structural bolts to manufacturer torque specifications. Check for soft foot conditions and reinforce weak structural bases."
    },
    "measurement_method": {
      "th": "ตรวจดูแนวโน้มของกราฟ FFT ในแกนรัศมี (H/V) ค้นหาขบวนฮาร์มอนิกแบบถี่ๆ ในระนาบเดียวกัน และทดสอบวัด Phase shift ระหว่างโครงสร้างกับมอเตอร์เพื่อยืนยันจุดที่มีการหลวมตัว",
      "en": "Look for a family of high-amplitude harmonics (1X-10X) in the radial spectrum, and perform phase analysis across structural joints to locate structural play."
    },
    "references": [
      {
        "source": "Technical Associates of Charlotte - Illustrated Vibration Diagnostic Wall Chart",
        "section": "Mechanical Looseness (Type A, Type B, Type C)",
        "details": "Type A (Structural/Frame) shows 1X radial peak. Type B (Base bolts/Cracks) shows 1X, 2X, 3X radial. Type C (Bearing clearance/Fit) shows fractional harmonics (0.5X, 1.5X) and high-order harmonics."
      },
      {
        "source": "Hewlett-Packard Application Note 243-1",
        "section": "Vibration diagnostics of rotating machinery",
        "details": "Identifies harmonic chains and spectrum skirts as diagnostic indicators of loose fittings and mechanical play."
      }
    ]
  },
  {
    "fault_id": "BEARING_WEAR",
    "category": "Bearing",
    "name": "Bearing Defect",
    "name_th": "ตลับลูกปืนสึกหรอ",
    "severity_base": "warning",
    "indicators": [
      {
        "type": "high_frequency_energy",
        "start_order": 5.0,
        "axis": ["H", "V", "A"],
        "weight": 100
      }
    ],
    "recommendation": {
      "th": "อัดจาระบีหล่อลื่นเพิ่มเติม หรือวางแผนเปลี่ยนตลับลูกปืน (Bearing)",
      "en": "Apply lubrication (grease) or plan for bearing replacement"
    },
    "description": {
      "th": "การเสื่อมสภาพหรือสึกหรอของชิ้นส่วนภายในตลับลูกปืนชนิดเม็ดกลมหรือเม็ดเรียว (เช่น รางวิ่งตัวนอก, รางวิ่งตัวใน, เม็ดลูกปืน หรือกรงประคอง)",
      "en": "Mechanical degradation, fatigue, or wear on rolling element bearing components (Outer race, Inner race, Rolling elements, or Cage)."
    },
    "causes": {
      "th": [
        "การหล่อลื่นไม่ดีพอหรือใช้จาระบีผิดประเภท ทำให้เกิดแรงเสียดทานสะสม",
        "มีสิ่งสกปรก ฝุ่นละออง หรือเศษโลหะเข้าไปผสมในจาระบีจนเกิดการขัดสีระนาบวิ่ง",
        "ความเค้นและภาระที่กระทำกับตลับลูกปืนสูงเกินขีดจำกัด (Overload) หรือการติดตั้งอัดบิดเบี้ยว",
        "การกัดกร่อนจากความชื้น น้ำ หรือกระแสไฟฟ้าหลุกรอดรั่วผ่านแบริ่ง"
      ],
      "en": [
        "Inadequate lubrication or using incorrect grease type, leading to high friction.",
        "Contamination by dust, process materials, or wear particles inside the bearing.",
        "Excessive loads, misaligned bearing installation, or mechanical fatigue over time.",
        "Corrosion from moisture, water ingress, or stray electrical currents passing through."
      ]
    },
    "reasoning": {
      "th": "พบพลังงานความสั่นสะเทือนสูงในย่านความถี่สูง (High Frequency Energy) ในระดับ Harmonic ตั้งแต่ 5X ขึ้นไป ซึ่งชี้วัดถึงแรงสั่นสะเทือนย่อยๆ (Impulse) จากการหมุนข้ามพื้นผิวที่ขรุขระของลูกปืน",
      "en": "High energy levels are observed in the high-frequency spectrum (above 5X order), which points to high-frequency impacts generated as rolling elements pass over surface flaws."
    },
    "how_to_fix": {
      "th": "ทำความสะอาดระบบอัดจาระบี และอัดจาระบีหล่อลื่นชนิดทนความร้อนสูงเพิ่มเติม หากอัดจาระบีแล้วแรงสั่นสะเทือนย่านความถี่สูงไม่ลดลง ควรวางแผนเตรียมเปลี่ยนแบริ่งใหม่ในการซ่อมบำรุงรอบถัดไป",
      "en": "Purge old grease, inject clean high-performance grease, and monitor levels. If high-frequency energy remains high, schedule a bearing replacement during the next maintenance window."
    },
    "measurement_method": {
      "th": "ประเมินกราฟ FFT ในย่านความถี่ระดับสูง และใช้เทคโนโลยี Peak Value/Envelope Spectrum ในการตรวจหาความถี่เฉพาะของแบริ่ง (BPFO, BPFI, BSF, FTF)",
      "en": "Evaluate the high-frequency range of the FFT spectrum. Apply envelopment/demodulation techniques to match bearing defect frequencies (BPFO, BPFI, BSF, FTF)."
    },
    "references": [
      {
        "source": "ISO 13373-3:2015",
        "section": "Vibration diagnosis of rolling element bearings",
        "details": "Defines stages of bearing failures starting from ultrasonic frequencies down to sub-harmonics and synchronous modulation."
      },
      {
        "source": "SKF Bearing Maintenance Handbook",
        "section": "Condition Monitoring and Bearing Diagnostics",
        "details": "Details how lubrication issues show up in vibration spectrums as high-frequency carpet noise and progress to distinct impact peaks."
      }
    ]
  }
];
