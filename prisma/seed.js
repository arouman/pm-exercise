// Deterministic seed: same data every run, on every machine. No Math.random().
// Re-runs safely (truncates first, then inserts).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ---------- Helpers ----------

const D = (iso) => new Date(iso);

// ---------- Users ----------

const users = [
  { id: 'usr_proc_1', name: 'Diana Chen',     email: 'diana.chen@subbase.demo',     role: 'PROCUREMENT' },
  { id: 'usr_proc_2', name: 'Marcus Patel',   email: 'marcus.patel@subbase.demo',   role: 'PROCUREMENT' },
  { id: 'usr_proc_3', name: 'Sasha Ivanova',  email: 'sasha.ivanova@subbase.demo',  role: 'PROCUREMENT' },
  { id: 'usr_super_1', name: 'Eli Brooks',    email: 'eli.brooks@subbase.demo',     role: 'SUPERINTENDENT' },
  { id: 'usr_super_2', name: 'Tomas Reyes',   email: 'tomas.reyes@subbase.demo',    role: 'SUPERINTENDENT' },
  { id: 'usr_super_3', name: 'Priya Shah',    email: 'priya.shah@subbase.demo',     role: 'SUPERINTENDENT' },
  { id: 'usr_super_4', name: 'Jordan Nakai',  email: 'jordan.nakai@subbase.demo',   role: 'SUPERINTENDENT' },
  { id: 'usr_fleet_1', name: 'Robin Castillo', email: 'robin.castillo@subbase.demo', role: 'FLEET_MANAGER' },
];

// ---------- Vendors ----------

const vendors = [
  {
    id: 'vnd_concrete', name: 'Cornerstone Concrete Supply', category: 'CONCRETE',
    contactEmail: 'sales@cornerstonecs.com', contactPhone: '+1 415-555-2010', paymentTerms: 'Net 30',
  },
  {
    id: 'vnd_rebar', name: 'Ironline Reinforcement Co.', category: 'REBAR',
    contactEmail: 'orders@ironline.com', contactPhone: '+1 213-555-7788', paymentTerms: 'Net 30',
  },
  {
    id: 'vnd_fasteners', name: 'Bolthouse Industrial', category: 'FASTENERS',
    contactEmail: 'service@bolthouse.com', contactPhone: '+1 312-555-3401', paymentTerms: 'Net 15',
  },
  {
    id: 'vnd_lumber', name: 'Pacific Lumber & Form', category: 'LUMBER',
    contactEmail: 'desk@paclumber.com', contactPhone: '+1 503-555-9120', paymentTerms: 'Net 30',
  },
  {
    id: 'vnd_rental', name: 'Western Equipment Rentals', category: 'TOOLS_RENTAL_EXTERNAL',
    contactEmail: 'rentals@westernequip.com', contactPhone: '+1 602-555-4477', paymentTerms: 'Net 15',
  },
];

// ---------- Materials ----------

const materials = [
  // Concrete (vnd_concrete)
  { id: 'mat_c_4000',  sku: 'CON-4000', name: '4000 PSI Ready-Mix Concrete', category: 'CONCRETE', unit: 'CY',  unitPrice: 165.00, vendorId: 'vnd_concrete' },
  { id: 'mat_c_5000',  sku: 'CON-5000', name: '5000 PSI Ready-Mix Concrete', category: 'CONCRETE', unit: 'CY',  unitPrice: 185.00, vendorId: 'vnd_concrete' },
  { id: 'mat_c_6000',  sku: 'CON-6000', name: '6000 PSI High-Strength Mix',  category: 'CONCRETE', unit: 'CY',  unitPrice: 215.00, vendorId: 'vnd_concrete' },
  { id: 'mat_c_grout', sku: 'CON-GRT',  name: 'Non-Shrink Grout, 50 lb',      category: 'CONCRETE', unit: 'BAG', unitPrice: 28.50, vendorId: 'vnd_concrete' },
  { id: 'mat_c_cure',  sku: 'CON-CURE', name: 'Concrete Curing Compound, 5 gal', category: 'CONCRETE', unit: 'EA', unitPrice: 78.00, vendorId: 'vnd_concrete' },
  { id: 'mat_c_seal',  sku: 'CON-SEAL', name: 'Penetrating Concrete Sealer, 5 gal', category: 'CONCRETE', unit: 'EA', unitPrice: 142.00, vendorId: 'vnd_concrete' },
  { id: 'mat_c_form',  sku: 'CON-FORM', name: 'Form Release Agent, 5 gal',    category: 'CONCRETE', unit: 'EA',  unitPrice: 64.00, vendorId: 'vnd_concrete' },
  { id: 'mat_c_fiber', sku: 'CON-FBR',  name: 'Synthetic Fiber Mesh, 1.5 lb bag', category: 'CONCRETE', unit: 'BAG', unitPrice: 12.25, vendorId: 'vnd_concrete' },

  // Rebar (vnd_rebar)
  { id: 'mat_r_4',  sku: 'RBR-4',  name: '#4 Rebar Grade 60, 20 ft',  category: 'REBAR', unit: 'LF', unitPrice: 1.85, vendorId: 'vnd_rebar' },
  { id: 'mat_r_5',  sku: 'RBR-5',  name: '#5 Rebar Grade 60, 20 ft',  category: 'REBAR', unit: 'LF', unitPrice: 2.40, vendorId: 'vnd_rebar' },
  { id: 'mat_r_6',  sku: 'RBR-6',  name: '#6 Rebar Grade 60, 20 ft',  category: 'REBAR', unit: 'LF', unitPrice: 3.10, vendorId: 'vnd_rebar' },
  { id: 'mat_r_8',  sku: 'RBR-8',  name: '#8 Rebar Grade 60, 20 ft',  category: 'REBAR', unit: 'LF', unitPrice: 4.95, vendorId: 'vnd_rebar' },
  { id: 'mat_r_chair', sku: 'RBR-CHR', name: 'Plastic Rebar Chair, 3 in', category: 'REBAR', unit: 'EA', unitPrice: 0.42, vendorId: 'vnd_rebar' },
  { id: 'mat_r_tie', sku: 'RBR-TIE', name: 'Black Annealed Tie Wire 16 ga, 3.5 lb roll', category: 'REBAR', unit: 'EA', unitPrice: 8.75, vendorId: 'vnd_rebar' },
  { id: 'mat_r_dowel', sku: 'RBR-DWL', name: 'Dowel Bar #5, 18 in',     category: 'REBAR', unit: 'EA', unitPrice: 3.20, vendorId: 'vnd_rebar' },
  { id: 'mat_r_mesh', sku: 'RBR-MESH', name: 'Welded Wire Mesh 6x6, 5 ft x 10 ft', category: 'REBAR', unit: 'EA', unitPrice: 38.50, vendorId: 'vnd_rebar' },

  // Fasteners (vnd_fasteners)
  { id: 'mat_f_anchor_1', sku: 'FST-ANC-1/2', name: 'Wedge Anchor 1/2 x 4 3/4 in',  category: 'FASTENERS', unit: 'EA', unitPrice: 1.85, vendorId: 'vnd_fasteners' },
  { id: 'mat_f_anchor_2', sku: 'FST-ANC-3/4', name: 'Wedge Anchor 3/4 x 7 in',      category: 'FASTENERS', unit: 'EA', unitPrice: 3.65, vendorId: 'vnd_fasteners' },
  { id: 'mat_f_bolt_a',   sku: 'FST-BLT-A325', name: 'A325 Structural Bolt 3/4 x 2 1/2 in', category: 'FASTENERS', unit: 'EA', unitPrice: 2.10, vendorId: 'vnd_fasteners' },
  { id: 'mat_f_bolt_b',   sku: 'FST-BLT-A490', name: 'A490 High-Strength Bolt 7/8 x 3 in', category: 'FASTENERS', unit: 'EA', unitPrice: 4.80, vendorId: 'vnd_fasteners' },
  { id: 'mat_f_nut',      sku: 'FST-NUT-A325', name: 'A325 Heavy Hex Nut 3/4 in',   category: 'FASTENERS', unit: 'EA', unitPrice: 0.55, vendorId: 'vnd_fasteners' },
  { id: 'mat_f_washer',   sku: 'FST-WSH',     name: 'F436 Hardened Washer 3/4 in', category: 'FASTENERS', unit: 'EA', unitPrice: 0.22, vendorId: 'vnd_fasteners' },
  { id: 'mat_f_screw',    sku: 'FST-TEK-3',   name: 'Tek Self-Drilling Screw #12 x 3 in', category: 'FASTENERS', unit: 'EA', unitPrice: 0.18, vendorId: 'vnd_fasteners' },
  { id: 'mat_f_epoxy',    sku: 'FST-EPX',     name: 'Anchoring Epoxy Adhesive, 22 oz', category: 'FASTENERS', unit: 'EA', unitPrice: 38.00, vendorId: 'vnd_fasteners' },

  // Lumber (vnd_lumber)
  { id: 'mat_l_2x4',    sku: 'LMB-2x4-8',   name: '2x4 SPF Stud, 8 ft',          category: 'LUMBER', unit: 'EA', unitPrice: 4.85, vendorId: 'vnd_lumber' },
  { id: 'mat_l_2x6',    sku: 'LMB-2x6-12',  name: '2x6 SPF, 12 ft',              category: 'LUMBER', unit: 'EA', unitPrice: 10.20, vendorId: 'vnd_lumber' },
  { id: 'mat_l_4x4',    sku: 'LMB-4x4-8',   name: '4x4 SPF Post, 8 ft',          category: 'LUMBER', unit: 'EA', unitPrice: 17.60, vendorId: 'vnd_lumber' },
  { id: 'mat_l_ply_3/4', sku: 'LMB-PLY-3/4', name: '3/4 in CDX Plywood, 4x8 sheet', category: 'LUMBER', unit: 'EA', unitPrice: 58.00, vendorId: 'vnd_lumber' },
  { id: 'mat_l_form_ply', sku: 'LMB-FORM-3/4', name: '3/4 in Form Ply HDO, 4x8', category: 'LUMBER', unit: 'EA', unitPrice: 102.00, vendorId: 'vnd_lumber' },
  { id: 'mat_l_lvl',    sku: 'LMB-LVL-16',  name: '1 3/4 x 11 7/8 LVL Beam, 16 ft', category: 'LUMBER', unit: 'EA', unitPrice: 184.00, vendorId: 'vnd_lumber' },
  { id: 'mat_l_screws', sku: 'LMB-DECK-3',  name: 'Deck Screws 3 in, 5 lb box',  category: 'LUMBER', unit: 'EA', unitPrice: 32.50, vendorId: 'vnd_lumber' },
  { id: 'mat_l_nails',  sku: 'LMB-NAIL-16', name: '16d Framing Nails, 50 lb box', category: 'LUMBER', unit: 'EA', unitPrice: 78.00, vendorId: 'vnd_lumber' },

  // Tools / external rental hints (vnd_rental) — these foreshadow the rental domain
  // the candidate will design, but ship as ordinary procurable line items (i.e. SubBase
  // currently treats external rentals as a vendor purchase).
  { id: 'mat_t_compactor', sku: 'TLS-COMP-PLT', name: 'Plate Compactor Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 95.00, vendorId: 'vnd_rental' },
  { id: 'mat_t_concrete_saw', sku: 'TLS-SAW-CNC', name: 'Walk-Behind Concrete Saw Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 215.00, vendorId: 'vnd_rental' },
  { id: 'mat_t_pump',      sku: 'TLS-PUMP-3', name: '3 in Submersible Pump Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 75.00, vendorId: 'vnd_rental' },
  { id: 'mat_t_genset',    sku: 'TLS-GEN-25', name: '25 kW Towable Generator Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 245.00, vendorId: 'vnd_rental' },
  { id: 'mat_t_lift',      sku: 'TLS-LIFT-26', name: '26 ft Scissor Lift Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 185.00, vendorId: 'vnd_rental' },
  { id: 'mat_t_trowel',    sku: 'TLS-TRWL', name: 'Power Trowel 36 in Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 130.00, vendorId: 'vnd_rental' },
  { id: 'mat_t_breaker',   sku: 'TLS-BRK-65', name: '65 lb Pneumatic Breaker Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 88.00, vendorId: 'vnd_rental' },
  { id: 'mat_t_skidsteer', sku: 'TLS-SKID', name: 'Skid-Steer Loader Daily Rental', category: 'TOOLS_RENTAL_EXTERNAL', unit: 'EA', unitPrice: 320.00, vendorId: 'vnd_rental' },
];

// ---------- Projects ----------

const projects = [
  {
    id: 'prj_hudson',
    name: 'Hudson Yards Phase 3 — Foundation',
    customer: 'Turner Construction',
    address: '500 W 33rd St, New York, NY 10001',
    status: 'ACTIVE',
    startDate: D('2026-01-08'),
    projectedEndDate: D('2026-11-30'),
  },
  {
    id: 'prj_lax',
    name: 'LAX Terminal 9 — Concrete Package',
    customer: 'Baker Concrete',
    address: '1 World Way, Los Angeles, CA 90045',
    status: 'ACTIVE',
    startDate: D('2025-09-15'),
    projectedEndDate: D('2026-08-20'),
  },
  {
    id: 'prj_mission',
    name: 'Mission Bay Block 4 — Structural',
    customer: 'Neon',
    address: '450 Channel St, San Francisco, CA 94158',
    status: 'ACTIVE',
    startDate: D('2026-02-03'),
    projectedEndDate: D('2027-01-15'),
  },
  {
    id: 'prj_seaport',
    name: 'Boston Seaport Tower II — Site Prep',
    customer: 'Turner Construction',
    address: '100 Seaport Blvd, Boston, MA 02210',
    status: 'ON_HOLD',
    startDate: D('2025-11-01'),
    projectedEndDate: D('2026-12-10'),
  },
];

const projectUsers = [
  // Hudson Yards — Diana (proc), Eli + Tomas (supers), Robin (fleet)
  { projectId: 'prj_hudson',  userId: 'usr_proc_1' },
  { projectId: 'prj_hudson',  userId: 'usr_super_1' },
  { projectId: 'prj_hudson',  userId: 'usr_super_2' },
  { projectId: 'prj_hudson',  userId: 'usr_fleet_1' },
  // LAX — Marcus (proc), Priya (super), Robin (fleet)
  { projectId: 'prj_lax',     userId: 'usr_proc_2' },
  { projectId: 'prj_lax',     userId: 'usr_super_3' },
  { projectId: 'prj_lax',     userId: 'usr_fleet_1' },
  // Mission Bay — Sasha (proc), Jordan (super)
  { projectId: 'prj_mission', userId: 'usr_proc_3' },
  { projectId: 'prj_mission', userId: 'usr_super_4' },
  // Seaport (on hold) — Diana (proc), Eli (super)
  { projectId: 'prj_seaport', userId: 'usr_proc_1' },
  { projectId: 'prj_seaport', userId: 'usr_super_1' },
];

// ---------- Purchase Orders ----------
// Mix of statuses, vendors, projects. Created in a way that matches the project owners.

const purchaseOrders = [
  // --- Hudson Yards
  {
    id: 'po_1001', poNumber: 'PO-1001', status: 'RECEIVED',
    expectedDelivery: D('2026-03-04'), createdAt: D('2026-02-21'),
    vendorId: 'vnd_concrete', projectId: 'prj_hudson', createdById: 'usr_proc_1',
    lines: [
      { id: 'pol_1001_1', materialId: 'mat_c_5000', quantity: 220, unitPrice: 185.00 },
      { id: 'pol_1001_2', materialId: 'mat_c_cure', quantity: 40,  unitPrice: 78.00 },
    ],
  },
  {
    id: 'po_1002', poNumber: 'PO-1002', status: 'PARTIALLY_RECEIVED',
    expectedDelivery: D('2026-05-18'), createdAt: D('2026-04-30'),
    vendorId: 'vnd_rebar', projectId: 'prj_hudson', createdById: 'usr_proc_1',
    lines: [
      { id: 'pol_1002_1', materialId: 'mat_r_5', quantity: 4200, unitPrice: 2.40 },
      { id: 'pol_1002_2', materialId: 'mat_r_6', quantity: 1800, unitPrice: 3.10 },
      { id: 'pol_1002_3', materialId: 'mat_r_tie', quantity: 60, unitPrice: 8.75 },
    ],
  },
  {
    id: 'po_1003', poNumber: 'PO-1003', status: 'SUBMITTED',
    expectedDelivery: D('2026-06-12'), createdAt: D('2026-05-15'),
    rentalStart: D('2026-06-12'), expectedOffRent: D('2026-07-15'), actualOffRent: null,
    vendorId: 'vnd_rental', projectId: 'prj_hudson', createdById: 'usr_proc_1',
    lines: [
      { id: 'pol_1003_1', materialId: 'mat_t_pump',     quantity: 3, unitPrice: 75.00 },
      { id: 'pol_1003_2', materialId: 'mat_t_genset',   quantity: 1, unitPrice: 245.00 },
    ],
  },
  {
    id: 'po_1004', poNumber: 'PO-1004', status: 'DRAFT',
    expectedDelivery: null, createdAt: D('2026-05-20'),
    vendorId: 'vnd_fasteners', projectId: 'prj_hudson', createdById: 'usr_proc_1',
    lines: [
      { id: 'pol_1004_1', materialId: 'mat_f_bolt_a', quantity: 800, unitPrice: 2.10 },
      { id: 'pol_1004_2', materialId: 'mat_f_nut',    quantity: 800, unitPrice: 0.55 },
      { id: 'pol_1004_3', materialId: 'mat_f_washer', quantity: 1600, unitPrice: 0.22 },
    ],
  },

  // --- LAX
  {
    id: 'po_1005', poNumber: 'PO-1005', status: 'RECEIVED',
    expectedDelivery: D('2026-01-22'), createdAt: D('2026-01-09'),
    vendorId: 'vnd_concrete', projectId: 'prj_lax', createdById: 'usr_proc_2',
    lines: [
      { id: 'pol_1005_1', materialId: 'mat_c_4000', quantity: 380, unitPrice: 165.00 },
      { id: 'pol_1005_2', materialId: 'mat_c_seal', quantity: 16, unitPrice: 142.00 },
    ],
  },
  {
    id: 'po_1006', poNumber: 'PO-1006', status: 'RECEIVED',
    expectedDelivery: D('2026-02-26'), createdAt: D('2026-02-12'),
    vendorId: 'vnd_lumber', projectId: 'prj_lax', createdById: 'usr_proc_2',
    lines: [
      { id: 'pol_1006_1', materialId: 'mat_l_form_ply', quantity: 120, unitPrice: 102.00 },
      { id: 'pol_1006_2', materialId: 'mat_l_2x4',      quantity: 400, unitPrice: 4.85 },
      { id: 'pol_1006_3', materialId: 'mat_l_screws',   quantity: 30,  unitPrice: 32.50 },
    ],
  },
  {
    id: 'po_1007', poNumber: 'PO-1007', status: 'PARTIALLY_RECEIVED',
    expectedDelivery: D('2026-05-09'), createdAt: D('2026-04-20'),
    vendorId: 'vnd_rebar', projectId: 'prj_lax', createdById: 'usr_proc_2',
    lines: [
      { id: 'pol_1007_1', materialId: 'mat_r_4',    quantity: 3200, unitPrice: 1.85 },
      { id: 'pol_1007_2', materialId: 'mat_r_mesh', quantity: 80,   unitPrice: 38.50 },
    ],
  },
  {
    id: 'po_1008', poNumber: 'PO-1008', status: 'CLOSED',
    expectedDelivery: D('2026-03-15'), createdAt: D('2026-02-28'),
    rentalStart: D('2026-03-08'), expectedOffRent: D('2026-04-30'), actualOffRent: D('2026-04-28'),
    vendorId: 'vnd_rental', projectId: 'prj_lax', createdById: 'usr_proc_2',
    lines: [
      { id: 'pol_1008_1', materialId: 'mat_t_compactor', quantity: 6, unitPrice: 95.00 },
      { id: 'pol_1008_2', materialId: 'mat_t_trowel',    quantity: 2, unitPrice: 130.00 },
    ],
  },

  // --- Mission Bay
  {
    id: 'po_1009', poNumber: 'PO-1009', status: 'RECEIVED',
    expectedDelivery: D('2026-03-19'), createdAt: D('2026-03-05'),
    vendorId: 'vnd_concrete', projectId: 'prj_mission', createdById: 'usr_proc_3',
    lines: [
      { id: 'pol_1009_1', materialId: 'mat_c_6000', quantity: 140, unitPrice: 215.00 },
    ],
  },
  {
    id: 'po_1010', poNumber: 'PO-1010', status: 'SUBMITTED',
    expectedDelivery: D('2026-06-04'), createdAt: D('2026-05-12'),
    vendorId: 'vnd_rebar', projectId: 'prj_mission', createdById: 'usr_proc_3',
    lines: [
      { id: 'pol_1010_1', materialId: 'mat_r_8',    quantity: 2400, unitPrice: 4.95 },
      { id: 'pol_1010_2', materialId: 'mat_r_dowel', quantity: 600, unitPrice: 3.20 },
    ],
  },
  {
    id: 'po_1011', poNumber: 'PO-1011', status: 'PARTIALLY_RECEIVED',
    expectedDelivery: D('2026-05-21'), createdAt: D('2026-04-28'),
    vendorId: 'vnd_fasteners', projectId: 'prj_mission', createdById: 'usr_proc_3',
    lines: [
      { id: 'pol_1011_1', materialId: 'mat_f_anchor_1', quantity: 1200, unitPrice: 1.85 },
      { id: 'pol_1011_2', materialId: 'mat_f_anchor_2', quantity: 400,  unitPrice: 3.65 },
      { id: 'pol_1011_3', materialId: 'mat_f_epoxy',    quantity: 24,   unitPrice: 38.00 },
    ],
  },
  {
    id: 'po_1012', poNumber: 'PO-1012', status: 'DRAFT',
    expectedDelivery: null, createdAt: D('2026-05-19'),
    vendorId: 'vnd_lumber', projectId: 'prj_mission', createdById: 'usr_proc_3',
    lines: [
      { id: 'pol_1012_1', materialId: 'mat_l_lvl',    quantity: 18, unitPrice: 184.00 },
      { id: 'pol_1012_2', materialId: 'mat_l_4x4',    quantity: 60, unitPrice: 17.60 },
    ],
  },

  // --- Seaport (on hold — keep some history)
  {
    id: 'po_1013', poNumber: 'PO-1013', status: 'CLOSED',
    expectedDelivery: D('2025-12-04'), createdAt: D('2025-11-15'),
    vendorId: 'vnd_lumber', projectId: 'prj_seaport', createdById: 'usr_proc_1',
    lines: [
      { id: 'pol_1013_1', materialId: 'mat_l_ply_3/4', quantity: 80, unitPrice: 58.00 },
      { id: 'pol_1013_2', materialId: 'mat_l_nails',  quantity: 12, unitPrice: 78.00 },
    ],
  },
  {
    id: 'po_1014', poNumber: 'PO-1014', status: 'CLOSED',
    expectedDelivery: D('2025-12-18'), createdAt: D('2025-12-01'),
    vendorId: 'vnd_concrete', projectId: 'prj_seaport', createdById: 'usr_proc_1',
    lines: [
      { id: 'pol_1014_1', materialId: 'mat_c_grout', quantity: 60, unitPrice: 28.50 },
      { id: 'pol_1014_2', materialId: 'mat_c_form',  quantity: 8,  unitPrice: 64.00 },
    ],
  },
  {
    id: 'po_1015', poNumber: 'PO-1015', status: 'RECEIVED',
    expectedDelivery: D('2026-02-08'), createdAt: D('2026-01-22'),
    // Deliberately OVERDUE: expectedOffRent is in the past, actualOffRent still null on
    // 2026-06-13 — drives a non-zero off-rent $ waste number on the dashboard's first load.
    rentalStart: D('2026-02-07'), expectedOffRent: D('2026-05-31'), actualOffRent: null,
    vendorId: 'vnd_rental', projectId: 'prj_hudson', createdById: 'usr_proc_1',
    lines: [
      { id: 'pol_1015_1', materialId: 'mat_t_skidsteer', quantity: 2, unitPrice: 320.00 },
      { id: 'pol_1015_2', materialId: 'mat_t_breaker',   quantity: 1, unitPrice: 88.00 },
    ],
  },
];

// Compute line totals + PO totals.
for (const po of purchaseOrders) {
  let total = 0;
  for (const line of po.lines) {
    line.lineTotal = +(line.quantity * line.unitPrice).toFixed(2);
    total += line.lineTotal;
  }
  po.total = +total.toFixed(2);
}

// ---------- Deliveries ----------
// Receive most RECEIVED POs in full, some PARTIALLY_RECEIVED ones partially.

const deliveries = [
  // PO-1001 RECEIVED full (Hudson) — Eli received
  {
    id: 'del_1001a', purchaseOrderId: 'po_1001', deliveredAt: D('2026-03-03T09:15:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_1', notes: 'On schedule, no damage.',
    lines: [
      { id: 'dl_1001a_1', purchaseOrderLineId: 'pol_1001_1', quantityReceived: 220 },
      { id: 'dl_1001a_2', purchaseOrderLineId: 'pol_1001_2', quantityReceived: 40 },
    ],
  },
  // PO-1002 PARTIAL (Hudson) — 2 deliveries, third pending
  {
    id: 'del_1002a', purchaseOrderId: 'po_1002', deliveredAt: D('2026-05-10T13:00:00Z'),
    status: 'PARTIAL', receivedById: 'usr_super_2', notes: 'First load, #5 only.',
    lines: [
      { id: 'dl_1002a_1', purchaseOrderLineId: 'pol_1002_1', quantityReceived: 2400 },
    ],
  },
  {
    id: 'del_1002b', purchaseOrderId: 'po_1002', deliveredAt: D('2026-05-17T10:30:00Z'),
    status: 'PARTIAL', receivedById: 'usr_super_1', notes: 'Remaining #5 + first half of #6.',
    lines: [
      { id: 'dl_1002b_1', purchaseOrderLineId: 'pol_1002_1', quantityReceived: 1800 },
      { id: 'dl_1002b_2', purchaseOrderLineId: 'pol_1002_2', quantityReceived: 900 },
      { id: 'dl_1002b_3', purchaseOrderLineId: 'pol_1002_3', quantityReceived: 60 },
    ],
  },
  // PO-1005 RECEIVED full (LAX) — Priya received
  {
    id: 'del_1005a', purchaseOrderId: 'po_1005', deliveredAt: D('2026-01-21T08:45:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_3', notes: null,
    lines: [
      { id: 'dl_1005a_1', purchaseOrderLineId: 'pol_1005_1', quantityReceived: 380 },
      { id: 'dl_1005a_2', purchaseOrderLineId: 'pol_1005_2', quantityReceived: 16 },
    ],
  },
  // PO-1006 RECEIVED full (LAX)
  {
    id: 'del_1006a', purchaseOrderId: 'po_1006', deliveredAt: D('2026-02-25T11:00:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_3', notes: 'Stack #4 staged near gate 6.',
    lines: [
      { id: 'dl_1006a_1', purchaseOrderLineId: 'pol_1006_1', quantityReceived: 120 },
      { id: 'dl_1006a_2', purchaseOrderLineId: 'pol_1006_2', quantityReceived: 400 },
      { id: 'dl_1006a_3', purchaseOrderLineId: 'pol_1006_3', quantityReceived: 30 },
    ],
  },
  // PO-1007 PARTIAL (LAX)
  {
    id: 'del_1007a', purchaseOrderId: 'po_1007', deliveredAt: D('2026-05-07T07:30:00Z'),
    status: 'PARTIAL', receivedById: 'usr_super_3', notes: '#4 short — backorder noted.',
    lines: [
      { id: 'dl_1007a_1', purchaseOrderLineId: 'pol_1007_1', quantityReceived: 2400 },
      { id: 'dl_1007a_2', purchaseOrderLineId: 'pol_1007_2', quantityReceived: 80 },
    ],
  },
  // PO-1008 CLOSED (LAX) — 2 partial rental returns then closed
  {
    id: 'del_1008a', purchaseOrderId: 'po_1008', deliveredAt: D('2026-03-08T09:00:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_3', notes: 'Equipment on-site.',
    lines: [
      { id: 'dl_1008a_1', purchaseOrderLineId: 'pol_1008_1', quantityReceived: 6 },
      { id: 'dl_1008a_2', purchaseOrderLineId: 'pol_1008_2', quantityReceived: 2 },
    ],
  },
  // PO-1009 RECEIVED full (Mission Bay)
  {
    id: 'del_1009a', purchaseOrderId: 'po_1009', deliveredAt: D('2026-03-18T08:00:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_4', notes: 'Cold-pour mix, used same day.',
    lines: [
      { id: 'dl_1009a_1', purchaseOrderLineId: 'pol_1009_1', quantityReceived: 140 },
    ],
  },
  // PO-1011 PARTIAL (Mission Bay)
  {
    id: 'del_1011a', purchaseOrderId: 'po_1011', deliveredAt: D('2026-05-18T15:00:00Z'),
    status: 'PARTIAL', receivedById: 'usr_super_4', notes: 'Wedge anchors partial, epoxy full.',
    lines: [
      { id: 'dl_1011a_1', purchaseOrderLineId: 'pol_1011_1', quantityReceived: 800 },
      { id: 'dl_1011a_3', purchaseOrderLineId: 'pol_1011_3', quantityReceived: 24 },
    ],
  },
  // PO-1013 CLOSED (Seaport)
  {
    id: 'del_1013a', purchaseOrderId: 'po_1013', deliveredAt: D('2025-12-03T10:00:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_1', notes: null,
    lines: [
      { id: 'dl_1013a_1', purchaseOrderLineId: 'pol_1013_1', quantityReceived: 80 },
      { id: 'dl_1013a_2', purchaseOrderLineId: 'pol_1013_2', quantityReceived: 12 },
    ],
  },
  // PO-1014 CLOSED (Seaport)
  {
    id: 'del_1014a', purchaseOrderId: 'po_1014', deliveredAt: D('2025-12-17T09:00:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_1', notes: null,
    lines: [
      { id: 'dl_1014a_1', purchaseOrderLineId: 'pol_1014_1', quantityReceived: 60 },
      { id: 'dl_1014a_2', purchaseOrderLineId: 'pol_1014_2', quantityReceived: 8 },
    ],
  },
  // PO-1015 RECEIVED (Hudson) — rental equipment
  {
    id: 'del_1015a', purchaseOrderId: 'po_1015', deliveredAt: D('2026-02-07T08:30:00Z'),
    status: 'COMPLETE', receivedById: 'usr_super_2', notes: 'Skid steers tagged HY-SS-1, HY-SS-2.',
    lines: [
      { id: 'dl_1015a_1', purchaseOrderLineId: 'pol_1015_1', quantityReceived: 2 },
      { id: 'dl_1015a_2', purchaseOrderLineId: 'pol_1015_2', quantityReceived: 1 },
    ],
  },
  // Future pending deliveries (just so the dashboard "pending" KPI is non-zero)
  {
    id: 'del_1003a', purchaseOrderId: 'po_1003', deliveredAt: D('2026-06-12T08:00:00Z'),
    status: 'PENDING', receivedById: 'usr_super_1', notes: 'Scheduled drop-off.',
    lines: [],
  },
  {
    id: 'del_1010a', purchaseOrderId: 'po_1010', deliveredAt: D('2026-06-04T08:00:00Z'),
    status: 'PENDING', receivedById: 'usr_super_4', notes: 'Expected morning.',
    lines: [],
  },
];

// ---------- Inventory ----------
// Compute current quantityOnHand per (material, project) from the COMPLETE/PARTIAL
// deliveries minus a deterministic "consumption" subtracted for realism.

function computeInventory() {
  // map: `${materialId}|${projectId}` -> { received, consumed }
  const bucket = new Map();
  const projectByPO = new Map(purchaseOrders.map((po) => [po.id, po.projectId]));
  const materialByPOLine = new Map();
  for (const po of purchaseOrders) {
    for (const line of po.lines) materialByPOLine.set(line.id, line.materialId);
  }

  for (const del of deliveries) {
    if (del.status === 'PENDING') continue;
    const projectId = projectByPO.get(del.purchaseOrderId);
    for (const dl of del.lines) {
      const materialId = materialByPOLine.get(dl.purchaseOrderLineId);
      const key = `${materialId}|${projectId}`;
      const entry = bucket.get(key) || { received: 0, consumed: 0 };
      entry.received += dl.quantityReceived;
      bucket.set(key, entry);
    }
  }

  // Deterministic consumption: rough fraction by material category.
  // Rental equipment items: "consumed" = used and returned, so reduce heavily.
  // Concrete/grout/cure: high consumption (60-80%).
  // Rebar/lumber/fasteners: moderate (30-50%).
  const consumptionRate = {
    CONCRETE: 0.7,
    REBAR: 0.4,
    FASTENERS: 0.35,
    LUMBER: 0.5,
    TOOLS_RENTAL_EXTERNAL: 0.9,
  };
  const matCategory = Object.fromEntries(materials.map((m) => [m.id, m.category]));

  const items = [];
  const txns = [];
  let invIdx = 0;
  let txnIdx = 0;

  for (const [key, { received }] of bucket) {
    const [materialId, projectId] = key.split('|');
    const rate = consumptionRate[matCategory[materialId]] ?? 0.4;
    const consumed = Math.round(received * rate * 100) / 100;
    const onHand = +(received - consumed).toFixed(2);

    items.push({
      id: `inv_${++invIdx}`,
      materialId,
      projectId,
      quantityOnHand: onHand,
      // Use the last delivery date as lastUpdatedAt approximation
      lastUpdatedAt: D('2026-05-20'),
    });

    // One IN transaction (aggregated receipt) + one OUT (consumption) per (mat, proj)
    txns.push({
      id: `txn_${++txnIdx}`,
      type: 'IN',
      quantity: received,
      reference: 'Aggregate receipts from PO deliveries',
      materialId, projectId,
      fromProjectId: null,
      userId: 'usr_super_1',
      createdAt: D('2026-04-15'),
    });
    if (consumed > 0) {
      txns.push({
        id: `txn_${++txnIdx}`,
        type: 'OUT',
        quantity: consumed,
        reference: 'Production consumption (rolled up)',
        materialId, projectId,
        fromProjectId: null,
        userId: 'usr_super_2',
        createdAt: D('2026-05-10'),
      });
    }
  }

  // Add a couple of TRANSFER transactions between projects for realism
  txns.push({
    id: `txn_${++txnIdx}`,
    type: 'TRANSFER',
    quantity: 200,
    reference: 'Surplus rebar moved to Hudson Yards',
    materialId: 'mat_r_4', projectId: 'prj_hudson',
    fromProjectId: 'prj_lax',
    userId: 'usr_fleet_1',
    createdAt: D('2026-05-12'),
  });
  txns.push({
    id: `txn_${++txnIdx}`,
    type: 'TRANSFER',
    quantity: 24,
    reference: 'Form ply rotated to Mission Bay',
    materialId: 'mat_l_form_ply', projectId: 'prj_mission',
    fromProjectId: 'prj_lax',
    userId: 'usr_fleet_1',
    createdAt: D('2026-05-15'),
  });

  return { items, txns };
}

// ---------- Rentals: Equipment ----------
// Reference "today" for the seed is 2026-06-13. Owned fleet uses the BKR- prefix (Baker is the
// strategy anchor); rented-in machines reuse the HY-/LAX- tags already named in delivery notes
// and tie back to the rent-in POs (po_1015, po_1003, po_1008).

const equipment = [
  // --- Owned fleet (Baker) ---
  { id: 'eqp_own_ss204', assetTag: 'BKR-SS-204', name: 'Bobcat S650 Skid Steer', category: 'SKID_STEER', ownership: 'OWNED', status: 'IN_USE', dailyRate: 280, make: 'Bobcat', model: 'S650', year: 2022, vendorId: null, purchaseOrderId: null, currentProjectId: 'prj_lax' },
  { id: 'eqp_own_lift12', assetTag: 'BKR-LIFT-12', name: 'Genie GS-2632 Scissor Lift', category: 'LIFT', ownership: 'OWNED', status: 'IN_USE', dailyRate: 160, make: 'Genie', model: 'GS-2632', year: 2021, vendorId: null, purchaseOrderId: null, currentProjectId: 'prj_lax' },
  { id: 'eqp_own_comp08', assetTag: 'BKR-COMP-08', name: 'Wacker Plate Compactor', category: 'COMPACTOR', ownership: 'OWNED', status: 'AVAILABLE', dailyRate: 85, make: 'Wacker Neuson', model: 'WP1550', year: 2020, vendorId: null, purchaseOrderId: null, currentProjectId: null },
  { id: 'eqp_own_gen25', assetTag: 'BKR-GEN-25', name: '25 kW Towable Generator', category: 'GENERATOR', ownership: 'OWNED', status: 'IN_USE', dailyRate: 220, make: 'Generac', model: 'MLT-25', year: 2019, vendorId: null, purchaseOrderId: null, currentProjectId: 'prj_hudson' },
  { id: 'eqp_own_trwl03', assetTag: 'BKR-TRWL-03', name: '36 in Power Trowel', category: 'TROWEL', ownership: 'OWNED', status: 'IDLE', dailyRate: 120, make: 'Allen', model: 'HD36', year: 2021, vendorId: null, purchaseOrderId: null, currentProjectId: 'prj_mission' },
  { id: 'eqp_own_exc14', assetTag: 'BKR-EXC-14', name: 'CAT 305 Mini Excavator', category: 'EXCAVATOR', ownership: 'OWNED', status: 'DOWN', dailyRate: 480, make: 'Caterpillar', model: '305 CR', year: 2020, vendorId: null, purchaseOrderId: null, currentProjectId: 'prj_lax' },
  { id: 'eqp_own_saw22', assetTag: 'BKR-SAW-22', name: 'Walk-Behind Concrete Saw', category: 'SAW', ownership: 'OWNED', status: 'AVAILABLE', dailyRate: 130, make: 'Husqvarna', model: 'FS 400', year: 2022, vendorId: null, purchaseOrderId: null, currentProjectId: null },
  { id: 'eqp_own_pump09', assetTag: 'BKR-PUMP-09', name: '3 in Submersible Pump', category: 'PUMP', ownership: 'OWNED', status: 'IN_USE', dailyRate: 70, make: 'Multiquip', model: 'ST2037', year: 2021, vendorId: null, purchaseOrderId: null, currentProjectId: 'prj_mission' },

  // --- Rented-in (Western Equipment Rentals) ---
  // po_1015 (Hudson) — the overdue rental. All three machines are still in the field past the
  // PO's expectedOffRent (2026-05-31), so they drive the off-rent waste number.
  { id: 'eqp_rent_ss1', assetTag: 'HY-SS-1', name: 'Skid-Steer Loader (rental)', category: 'SKID_STEER', ownership: 'RENTED', status: 'IN_USE', dailyRate: 320, make: 'Bobcat', model: 'S76', year: 2023, vendorId: 'vnd_rental', purchaseOrderId: 'po_1015', currentProjectId: 'prj_hudson' },
  { id: 'eqp_rent_ss2', assetTag: 'HY-SS-2', name: 'Skid-Steer Loader (rental)', category: 'SKID_STEER', ownership: 'RENTED', status: 'IDLE', dailyRate: 320, make: 'Bobcat', model: 'S76', year: 2023, vendorId: 'vnd_rental', purchaseOrderId: 'po_1015', currentProjectId: 'prj_hudson' },
  { id: 'eqp_rent_brk1', assetTag: 'HY-BRK-1', name: '65 lb Pneumatic Breaker (rental)', category: 'BREAKER', ownership: 'RENTED', status: 'IN_USE', dailyRate: 88, make: 'APT', model: 'TX65', year: 2022, vendorId: 'vnd_rental', purchaseOrderId: 'po_1015', currentProjectId: 'prj_hudson' },
  // po_1003 (Hudson) — recent rental, still within term (not overdue).
  { id: 'eqp_rent_pump1', assetTag: 'HY-PUMP-1', name: '3 in Submersible Pump (rental)', category: 'PUMP', ownership: 'RENTED', status: 'IN_USE', dailyRate: 75, make: 'Multiquip', model: 'ST2040', year: 2023, vendorId: 'vnd_rental', purchaseOrderId: 'po_1003', currentProjectId: 'prj_hudson' },
  { id: 'eqp_rent_gen1', assetTag: 'HY-GEN-1', name: '25 kW Towable Generator (rental)', category: 'GENERATOR', ownership: 'RENTED', status: 'IN_USE', dailyRate: 245, make: 'Doosan', model: 'G25', year: 2023, vendorId: 'vnd_rental', purchaseOrderId: 'po_1003', currentProjectId: 'prj_hudson' },
  // po_1008 (LAX) — closed rental, already returned to the vendor.
  { id: 'eqp_rent_comp1', assetTag: 'LAX-COMP-1', name: 'Plate Compactor (rental)', category: 'COMPACTOR', ownership: 'RENTED', status: 'RETURNED', dailyRate: 95, make: 'Wacker Neuson', model: 'WP1550', year: 2022, vendorId: 'vnd_rental', purchaseOrderId: 'po_1008', currentProjectId: 'prj_lax' },
];

// ---------- Rentals: Assignments ----------
// Machine x project x date range. Includes one deliberate scheduling conflict (BKR-SS-204
// double-booked across overlapping ranges) so the conflict-warning UI has live data.

const equipmentAssignments = [
  // BKR-SS-204 — CONFLICT: asg_ss204_lax (LAX, active) overlaps asg_ss204_hud (Hudson, scheduled)
  // on 2026-06-15..2026-06-20.
  { id: 'asg_ss204_lax', equipmentId: 'eqp_own_ss204', projectId: 'prj_lax', startDate: D('2026-05-01'), expectedEndDate: D('2026-06-20'), actualEndDate: null, status: 'ACTIVE', dailyRate: 280, notes: 'Site grading, terminal apron.', createdById: 'usr_fleet_1' },
  { id: 'asg_ss204_hud', equipmentId: 'eqp_own_ss204', projectId: 'prj_hudson', startDate: D('2026-06-15'), expectedEndDate: D('2026-07-10'), actualEndDate: null, status: 'SCHEDULED', dailyRate: 280, notes: 'Double-booked — needs resolution.', createdById: 'usr_fleet_1' },
  { id: 'asg_lift12', equipmentId: 'eqp_own_lift12', projectId: 'prj_lax', startDate: D('2026-04-01'), expectedEndDate: D('2026-07-15'), actualEndDate: null, status: 'ACTIVE', dailyRate: 160, notes: null, createdById: 'usr_fleet_1' },
  { id: 'asg_gen25', equipmentId: 'eqp_own_gen25', projectId: 'prj_hudson', startDate: D('2026-03-01'), expectedEndDate: D('2026-08-01'), actualEndDate: null, status: 'ACTIVE', dailyRate: 220, notes: 'Temp power, tower crane base.', createdById: 'usr_fleet_1' },
  { id: 'asg_trwl03', equipmentId: 'eqp_own_trwl03', projectId: 'prj_mission', startDate: D('2026-05-01'), expectedEndDate: D('2026-06-05'), actualEndDate: D('2026-06-04'), status: 'RETURNED', dailyRate: 120, notes: 'Returned damaged — see check-in.', createdById: 'usr_fleet_1' },
  { id: 'asg_pump09', equipmentId: 'eqp_own_pump09', projectId: 'prj_mission', startDate: D('2026-05-10'), expectedEndDate: D('2026-07-01'), actualEndDate: null, status: 'ACTIVE', dailyRate: 70, notes: null, createdById: 'usr_fleet_1' },
  { id: 'asg_exc14', equipmentId: 'eqp_own_exc14', projectId: 'prj_lax', startDate: D('2026-04-15'), expectedEndDate: D('2026-09-01'), actualEndDate: null, status: 'ACTIVE', dailyRate: 480, notes: 'Down for hydraulic repair.', createdById: 'usr_fleet_1' },
  // Rented-in machines on po_1015 (Hudson) — still on rent past term
  { id: 'asg_ss1', equipmentId: 'eqp_rent_ss1', projectId: 'prj_hudson', startDate: D('2026-02-07'), expectedEndDate: D('2026-05-31'), actualEndDate: null, status: 'ACTIVE', dailyRate: 320, notes: 'On rent past term.', createdById: 'usr_fleet_1' },
  { id: 'asg_ss2', equipmentId: 'eqp_rent_ss2', projectId: 'prj_hudson', startDate: D('2026-02-07'), expectedEndDate: D('2026-05-31'), actualEndDate: null, status: 'ACTIVE', dailyRate: 320, notes: 'Idle on site, still on rent — return it.', createdById: 'usr_fleet_1' },
  { id: 'asg_brk1', equipmentId: 'eqp_rent_brk1', projectId: 'prj_hudson', startDate: D('2026-02-07'), expectedEndDate: D('2026-05-31'), actualEndDate: null, status: 'ACTIVE', dailyRate: 88, notes: null, createdById: 'usr_fleet_1' },
  // Rented-in machines on po_1003 (Hudson) — within term
  { id: 'asg_pump1', equipmentId: 'eqp_rent_pump1', projectId: 'prj_hudson', startDate: D('2026-06-12'), expectedEndDate: D('2026-07-15'), actualEndDate: null, status: 'ACTIVE', dailyRate: 75, notes: null, createdById: 'usr_fleet_1' },
  { id: 'asg_gen1', equipmentId: 'eqp_rent_gen1', projectId: 'prj_hudson', startDate: D('2026-06-12'), expectedEndDate: D('2026-07-15'), actualEndDate: null, status: 'ACTIVE', dailyRate: 245, notes: null, createdById: 'usr_fleet_1' },
  // Rented-in machine on po_1008 (LAX) — completed and returned
  { id: 'asg_comp1', equipmentId: 'eqp_rent_comp1', projectId: 'prj_lax', startDate: D('2026-03-08'), expectedEndDate: D('2026-04-30'), actualEndDate: D('2026-04-28'), status: 'RETURNED', dailyRate: 95, notes: 'Off-rented two days early.', createdById: 'usr_fleet_1' },
];

// ---------- Rentals: Events ----------
// Field check-out/check-in/off-rent/down history. Includes a DAMAGED check-in with a photo
// (dispute evidence) and events whose syncedAt trails occurredAt (captured offline, synced later).

const equipmentEvents = [
  { id: 'evt_ss1_out', equipmentId: 'eqp_rent_ss1', assignmentId: 'asg_ss1', type: 'CHECK_OUT', condition: 'GOOD', photoUrl: null, notes: 'Received from Western, fuel full.', projectId: 'prj_hudson', userId: 'usr_super_2', occurredAt: D('2026-02-07T08:30:00Z'), syncedAt: D('2026-02-07T08:30:00Z') },
  { id: 'evt_ss2_out', equipmentId: 'eqp_rent_ss2', assignmentId: 'asg_ss2', type: 'CHECK_OUT', condition: 'GOOD', photoUrl: null, notes: null, projectId: 'prj_hudson', userId: 'usr_super_2', occurredAt: D('2026-02-07T08:35:00Z'), syncedAt: D('2026-02-07T08:35:00Z') },
  { id: 'evt_trwl_out', equipmentId: 'eqp_own_trwl03', assignmentId: 'asg_trwl03', type: 'CHECK_OUT', condition: 'GOOD', photoUrl: null, notes: 'Blades good.', projectId: 'prj_mission', userId: 'usr_super_4', occurredAt: D('2026-05-01T07:00:00Z'), syncedAt: D('2026-05-01T07:00:00Z') },
  // DAMAGED check-in with a photo — the dispute-evidence story. Captured in the field at 16:30
  // with no signal, synced at 19:45 once back online (offline gap).
  { id: 'evt_trwl_in', equipmentId: 'eqp_own_trwl03', assignmentId: 'asg_trwl03', type: 'CHECK_IN', condition: 'DAMAGED', photoUrl: 'photos/BKR-TRWL-03-20260604-blade.jpg', notes: 'Returned with bent blade and oil leak. Photographed at handoff.', projectId: 'prj_mission', userId: 'usr_super_4', occurredAt: D('2026-06-04T16:30:00Z'), syncedAt: D('2026-06-04T19:45:00Z') },
  { id: 'evt_comp_out', equipmentId: 'eqp_rent_comp1', assignmentId: 'asg_comp1', type: 'CHECK_OUT', condition: 'GOOD', photoUrl: null, notes: null, projectId: 'prj_lax', userId: 'usr_super_3', occurredAt: D('2026-03-08T09:00:00Z'), syncedAt: D('2026-03-08T09:00:00Z') },
  { id: 'evt_comp_off', equipmentId: 'eqp_rent_comp1', assignmentId: 'asg_comp1', type: 'OFF_RENT', condition: 'GOOD', photoUrl: null, notes: 'Picked up by Western, two days early.', projectId: 'prj_lax', userId: 'usr_super_3', occurredAt: D('2026-04-28T14:00:00Z'), syncedAt: D('2026-04-28T14:00:00Z') },
  // Breakdown reported from the field — offline gap, and backs the open MaintenanceRecord.
  { id: 'evt_exc_down', equipmentId: 'eqp_own_exc14', assignmentId: 'asg_exc14', type: 'DOWN', condition: 'NEEDS_SERVICE', photoUrl: 'photos/BKR-EXC-14-20260610-hydraulic.jpg', notes: 'Hydraulic leak — boom will not lift. Tagged out of service.', projectId: 'prj_lax', userId: 'usr_super_3', occurredAt: D('2026-06-10T11:00:00Z'), syncedAt: D('2026-06-10T14:20:00Z') },
];

// ---------- Rentals: Maintenance ----------

const maintenanceRecords = [
  { id: 'mnt_exc14', equipmentId: 'eqp_own_exc14', status: 'DOWN', issue: 'Hydraulic leak — boom will not lift. Awaiting CAT field service.', reportedAt: D('2026-06-10T11:05:00Z'), resolvedAt: null, reportedById: 'usr_super_3' },
];

// ---------- Run ----------

async function main() {
  console.log('Resetting tables…');
  // Delete in FK-safe order. Rentals first: events + maintenance reference assignments/equipment,
  // assignments reference equipment, and equipment references PO/vendor/project (deleted below).
  await prisma.equipmentEvent.deleteMany();
  await prisma.maintenanceRecord.deleteMany();
  await prisma.equipmentAssignment.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.deliveryLine.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.projectUser.deleteMany();
  await prisma.project.deleteMany();
  await prisma.material.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  console.log('Inserting users…');
  await prisma.user.createMany({ data: users });

  console.log('Inserting vendors…');
  await prisma.vendor.createMany({ data: vendors });

  console.log('Inserting materials…');
  await prisma.material.createMany({ data: materials });

  console.log('Inserting projects…');
  await prisma.project.createMany({ data: projects });

  console.log('Inserting project assignments…');
  await prisma.projectUser.createMany({ data: projectUsers });

  console.log('Inserting purchase orders + lines…');
  for (const po of purchaseOrders) {
    const { lines, ...poData } = po;
    await prisma.purchaseOrder.create({
      data: { ...poData, lines: { create: lines } },
    });
  }

  console.log('Inserting deliveries + lines…');
  for (const del of deliveries) {
    const { lines, ...delData } = del;
    await prisma.delivery.create({
      data: { ...delData, lines: { create: lines } },
    });
  }

  console.log('Computing + inserting inventory…');
  const { items, txns } = computeInventory();
  await prisma.inventoryItem.createMany({ data: items });
  await prisma.inventoryTransaction.createMany({ data: txns });

  console.log('Inserting equipment…');
  await prisma.equipment.createMany({ data: equipment });

  console.log('Inserting equipment assignments…');
  await prisma.equipmentAssignment.createMany({ data: equipmentAssignments });

  console.log('Inserting equipment events…');
  await prisma.equipmentEvent.createMany({ data: equipmentEvents });

  console.log('Inserting maintenance records…');
  await prisma.maintenanceRecord.createMany({ data: maintenanceRecords });

  console.log('Seed complete.');
  console.log(
    `  users=${users.length} vendors=${vendors.length} materials=${materials.length}`,
  );
  console.log(
    `  projects=${projects.length} POs=${purchaseOrders.length} deliveries=${deliveries.length}`,
  );
  console.log(`  inventoryItems=${items.length} transactions=${txns.length}`);
  console.log(
    `  equipment=${equipment.length} assignments=${equipmentAssignments.length}` +
      ` events=${equipmentEvents.length} maintenance=${maintenanceRecords.length}`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
