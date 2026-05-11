import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

// ─────────────────────────────────────────────────────────────────────────────
// Idempotent seed.
//
// Every write is an upsert keyed on a stable natural identifier (email, name,
// registrationNo) or on a fixed singleton id. Running this script twice is
// safe and converges to the same state.
//
// What it seeds:
//   - HackathonRules singleton (id="rules")
//   - RoundControl singleton (id="round_control") — all rounds LOCKED
//   - Admin user (env-driven credentials, dev defaults)
//   - 3 Jury users (deterministic dev passwords)
//   - 10 Campus coordinator users (one per institution)
//   - 10 Institutions, 29 Domains, 10 ProblemStatements
//   - 8 sample CollegeRegistry rows (so admin verification flow is testable)
//
// What it does NOT seed:
//   - Students (registration is the user-facing flow)
//   - Teams, evaluations, leaderboard (downstream of student/jury actions)
// ─────────────────────────────────────────────────────────────────────────────

const adapter = new PrismaPg(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const log = (msg) => console.log(`[seed] ${msg}`);

const ROUNDS = parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
const ADMIN_EMAIL = process.env.ADMIN_SEED_EMAIL ?? 'admin@vortex.local';
const ADMIN_PASSWORD = process.env.ADMIN_SEED_PASSWORD ?? 'change-me-on-first-login';

const JURY_DEFAULT_PASSWORD = process.env.JURY_SEED_PASSWORD ?? 'jury-dev-only';
const COORDINATOR_DEFAULT_PASSWORD = process.env.COORDINATOR_SEED_PASSWORD ?? 'coord1234';

// ── singletons ──────────────────────────────────────────────────────────────

const seedRules = async () => {
  const rules = await prisma.hackathonRules.upsert({
    where: { id: 'rules' },
    update: {}, // never overwrite admin's hand-tuned values
    create: {
      id: 'rules',
      minTeamSize: 3,
      maxTeamSize: 5,
      minFemaleMembers: 1,
      minDomainExperts: 1,
      registrationOpen: true,
      leaderboardVisible: false,
      showMarks: false,
    },
  });
  log(`HackathonRules ready (id=${rules.id})`);
};

const seedRoundControl = async () => {
  const rc = await prisma.roundControl.upsert({
    where: { id: 'round_control' },
    update: {},
    create: {
      id: 'round_control',
      round1State: 'LOCKED',
      round2State: 'LOCKED',
      round3State: 'LOCKED',
    },
  });
  log(`RoundControl ready (id=${rc.id})`);
};

// ── taxonomy ────────────────────────────────────────────────────────────────

const INSTITUTIONS = [
  'ITER | SOA',
  'SPS | SOA',
  'SNC | SOA',
  'IMS & SUM | SOA',
  'IDS | SOA',
  'SNIL | SOA',
  'IAS | SOA',
  'IVS & AH | SOA',
  'IBCS | SOA',
  'SHM | SOA',
];

const DOMAINS = [
  'Healthcare & Medical Technology',
  'Pharmaceutical Innovation',
  'Nursing & Patient Care',
  'Mental Health & Wellness',
  'Dental Healthcare',
  'Agriculture & Smart Farming',
  'Veterinary & Animal Welfare',
  'Food Technology',
  'Environmental Sustainability',
  'Climate & Green Technology',
  'Legal Technology',
  'Cybersecurity & Digital Safety',
  'Artificial Intelligence',
  'Education Technology',
  'Business & Finance',
  'Marketing & Consumer Experience',
  'Hospitality & Tourism',
  'Smart Campus Solutions',
  'Social Impact & Community Development',
  'E-Commerce & Retail',
  'Productivity & Workflow Automation',
  'Research & Innovation',
  'IoT & Smart Devices',
  'Public Health Systems',
  'Women Safety & Empowerment',
  'Accessibility & Inclusion',
  'Rural Development',
  'Supply Chain & Logistics',
  'Open Innovation',
];

const PROBLEM_STATEMENTS = [
  ['Healthcare & Medical Technology', 'Remote triage assistant for primary care',
                                      'Build a multilingual intake workflow that prioritizes patients using symptoms, vitals, and urgency rules.'],
  ['Pharmaceutical Innovation',       'Cold-chain visibility for essential medicines',
                                      'Track temperature excursions across storage and transit with automated alerting for quality teams.'],
  ['Mental Health & Wellness',        'Early burnout signal detection for students',
                                      'Design a privacy-conscious wellbeing check-in system with escalation pathways and self-help interventions.'],
  ['Agriculture & Smart Farming',     'Precision irrigation for smallholder farms',
                                      'Use soil, weather, and crop signals to recommend irrigation schedules that reduce water waste.'],
  ['Environmental Sustainability',    'Smart waste segregation feedback loop',
                                      'Prototype a vision-assisted waste sorting system that improves recycling compliance on campus.'],
  ['Cybersecurity & Digital Safety',  'Phishing-resistant SSO for student portals',
                                      'Build a passkey-based SSO with attested device binding and risk-based recovery flows.'],
  ['Artificial Intelligence',         'On-device speech-to-action assistant',
                                      'Create a low-latency assistant that converts natural speech into reliable actions on constrained devices.'],
  ['Smart Campus Solutions',          'Predictive maintenance for campus infrastructure',
                                      'Use equipment telemetry to forecast failures in lifts, labs, and utilities before outages occur.'],
  ['Women Safety & Empowerment',      'Safe-route escort and rapid alert network',
                                      'Develop a route-aware system for emergency escalation, volunteer response, and evidence capture.'],
  ['Supply Chain & Logistics',        'Real-time warehouse routing under congestion',
                                      'Optimize picking and movement paths using live aisle conditions, queueing data, and operational constraints.'],
];

const seedTaxonomy = async () => {
  for (const name of INSTITUTIONS) {
    await prisma.institution.upsert({ where: { name }, update: {}, create: { name } });
  }
  log(`Institutions: ${INSTITUTIONS.length} ensured`);

  for (const name of DOMAINS) {
    await prisma.domain.upsert({ where: { name }, update: {}, create: { name } });
  }
  log(`Domains: ${DOMAINS.length} ensured`);

  // Problem statements are seeded idempotently by (title, domainId).
  // Remove legacy seed data that is no longer part of the supported domain set.
  const removableProblemStatements = await prisma.problemStatement.findMany({
    where: {
      domain: { name: { notIn: DOMAINS } },
      teams: { none: {} },
    },
    select: { id: true },
  });

  if (removableProblemStatements.length) {
    await prisma.problemStatement.deleteMany({
      where: { id: { in: removableProblemStatements.map((ps) => ps.id) } },
    });
    log(`Outdated ProblemStatements removed: ${removableProblemStatements.length}`);
  }

  const removableDomains = await prisma.domain.findMany({
    where: { name: { notIn: DOMAINS } },
    include: {
      _count: {
        select: {
          users: true,
          problemStatements: true,
          teams: true,
        },
      },
    },
  });

  let removedDomains = 0;
  for (const domain of removableDomains) {
    const { users, problemStatements, teams } = domain._count;
    if (users + problemStatements + teams > 0) {
      log(`Skipped outdated domain "${domain.name}" (users=${users}, problemStatements=${problemStatements}, teams=${teams})`);
      continue;
    }
    await prisma.domain.delete({ where: { id: domain.id } });
    removedDomains += 1;
  }

  if (removedDomains) log(`Outdated domains removed: ${removedDomains}`);

  // Problem statements are keyed by title within a domain for idempotent seeding.
  const domainByName = Object.fromEntries(
    (await prisma.domain.findMany()).map((d) => [d.name, d.id]),
  );

  for (const [domainName, title, description] of PROBLEM_STATEMENTS) {
    const domainId = domainByName[domainName];
    if (!domainId) continue;
    const existing = await prisma.problemStatement.findFirst({
      where: { title, domainId },
      select: { id: true },
    });
    if (!existing) {
      await prisma.problemStatement.create({ data: { title, description, domainId } });
    }
  }
  log(`ProblemStatements: ${PROBLEM_STATEMENTS.length} ensured`);
};

// ── users ──────────────────────────────────────────────────────────────────

const upsertPrivilegedUser = async ({ email, fullName, role, password, institutionId }) => {
  const passwordHash = await bcrypt.hash(password, ROUNDS);
  return prisma.user.upsert({
    where: { email },
    update: institutionId ? { institutionId } : {}, // do not reset password on re-seed; admin can rotate via API
    create: {
      email,
      fullName,
      role,
      institutionId,
      verificationStatus: 'VERIFIED',
      passwordHash,
      passwordIssuedAt: new Date(),
    },
    select: { id: true, email: true, role: true },
  });
};

const seedAdmin = async () => {
  const admin = await upsertPrivilegedUser({
    email: ADMIN_EMAIL,
    fullName: 'Vortex Admin',
    role: 'ADMIN',
    password: ADMIN_PASSWORD,
  });
  log(`Admin ready (${admin.email})`);
  if (ADMIN_PASSWORD === 'change-me-on-first-login') {
    log('  ⚠ using default admin password — set ADMIN_SEED_PASSWORD in .env');
  }
};

const JURY_SPECS = [
  { email: 'jury.alpha@vortex.local',  fullName: 'Jury Alpha'  },
  { email: 'jury.bravo@vortex.local',  fullName: 'Jury Bravo'  },
  { email: 'jury.charlie@vortex.local',fullName: 'Jury Charlie'},
];

const seedJuries = async () => {
  for (const spec of JURY_SPECS) {
    await upsertPrivilegedUser({
      ...spec,
      role: 'JURY',
      password: JURY_DEFAULT_PASSWORD,
    });
  }
  log(`Juries: ${JURY_SPECS.length} ensured (default password: ${JURY_DEFAULT_PASSWORD})`);
};

const COORDINATOR_SPECS = [
  { institutionName: 'ITER | SOA', email: 'coordinator.iter@vortex.local' },
  { institutionName: 'SPS | SOA', email: 'coordinator.sps@vortex.local' },
  { institutionName: 'SNC | SOA', email: 'coordinator.snc@vortex.local' },
  { institutionName: 'IMS & SUM | SOA', email: 'coordinator.ims@vortex.local' },
  { institutionName: 'IDS | SOA', email: 'coordinator.ids@vortex.local' },
  { institutionName: 'SNIL | SOA', email: 'coordinator.snil@vortex.local' },
  { institutionName: 'IAS | SOA', email: 'coordinator.ias@vortex.local' },
  { institutionName: 'IVS & AH | SOA', email: 'coordinator.ivs@vortex.local' },
  { institutionName: 'IBCS | SOA', email: 'coordinator.ibcs@vortex.local' },
  { institutionName: 'SHM | SOA', email: 'coordinator.shm@vortex.local' },
];

const seedCoordinators = async () => {
  const instByName = Object.fromEntries(
    (await prisma.institution.findMany()).map((i) => [i.name, i.id]),
  );

  for (const spec of COORDINATOR_SPECS) {
    const institutionId = instByName[spec.institutionName];
    if (!institutionId) continue;
    await upsertPrivilegedUser({
      email: spec.email,
      fullName: `${spec.institutionName} Coordinator`,
      role: 'COORDINATOR',
      institutionId,
      password: COORDINATOR_DEFAULT_PASSWORD,
    });
  }

  log(`Coordinators: ${COORDINATOR_SPECS.length} ensured (default password: ${COORDINATOR_DEFAULT_PASSWORD})`);
};

// ── registry ────────────────────────────────────────────────────────────────

const REGISTRY_SAMPLES = [
  ['2026-VRTX-100', 'Alice Vance',     'alice.vance@vortex.local',     'ITER | SOA'],
  ['2026-VRTX-101', 'Bob Smith',       'bob.smith@vortex.local',       'SPS | SOA'],
  ['2026-VRTX-102', 'Carla Mendes',    'carla.mendes@vortex.local',    'SNC | SOA'],
  ['2026-VRTX-103', 'Devraj Patil',    'devraj.patil@vortex.local',    'IMS & SUM | SOA'],
  ['2026-VRTX-104', 'Esha Nair',       'esha.nair@vortex.local',       'IDS | SOA'],
  ['2026-VRTX-105', 'Farhan Iqbal',    'farhan.iqbal@vortex.local',    'SNIL | SOA'],
  ['2026-VRTX-106', 'Gita Roy',        'gita.roy@vortex.local',        'IAS | SOA'],
  ['2026-VRTX-107', 'Hari Menon',      'hari.menon@vortex.local',      'IVS & AH | SOA'],
];

const seedRegistry = async () => {
  const instByName = Object.fromEntries(
    (await prisma.institution.findMany()).map((i) => [i.name, i.id]),
  );

  for (const [registrationNo, fullName, email, institutionName] of REGISTRY_SAMPLES) {
    const institutionId = instByName[institutionName];
    if (!institutionId) continue;
    await prisma.collegeRegistry.upsert({
      where: { registrationNo },
      update: { fullName, email, institutionId },
      create: { registrationNo, fullName, email, institutionId },
    });
  }
  log(`CollegeRegistry: ${REGISTRY_SAMPLES.length} ensured`);
};

const cleanupInstitutions = async () => {
  const removableInstitutions = await prisma.institution.findMany({
    where: { name: { notIn: INSTITUTIONS } },
    include: {
      _count: {
        select: {
          users: true,
          registry: true,
        },
      },
    },
  });

  let removedInstitutions = 0;
  for (const institution of removableInstitutions) {
    const { users, registry } = institution._count;
    if (users + registry > 0) {
      log(`Skipped outdated institution "${institution.name}" (users=${users}, registry=${registry})`);
      continue;
    }
    await prisma.institution.delete({ where: { id: institution.id } });
    removedInstitutions += 1;
  }

  if (removedInstitutions) log(`Outdated institutions removed: ${removedInstitutions}`);
};

// ── orchestration ──────────────────────────────────────────────────────────

const main = async () => {
  log('start');
  await seedRules();
  await seedRoundControl();
  await seedTaxonomy();
  await seedAdmin();
  await seedJuries();
  await seedCoordinators();
  await seedRegistry();
  await cleanupInstitutions();
  log('done');
};

main()
  .catch((err) => {
    console.error('[seed] failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
