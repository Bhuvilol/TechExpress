import XLSX from 'xlsx';
import { testingImportService } from '../services/testingImport.service.js';

const TEMPLATE_HEADERS = [
  'fullName',
  'email',
  'registrationNo',
  'institutionName',
  'primaryDomainName',
  'preferredDomainNames',
  'track',
  'degree',
  'yearSemester',
  'gender',
  'contributionAreas',
  'preferredTeamRole',
  'technicalSkills',
  'nonTechnicalSkills',
  'phone',
  'discordId',
  'profilePicUrl',
  'linkedinUrl',
  'githubUrl',
  'portfolioUrl',
  'resumeDriveLink',
  'researchPublicationUrl',
  'bio',
  'certificationsAchievements',
  'projectInitiative',
  'participationExperience',
  'achievements',
  'hackathonExperience',
  'isDomainExpert',
  'plainPassword',
];

const SAMPLE_ROW = {
  fullName: 'Alice Vance',
  email: 'alice.vance.test1@vortex.com',
  registrationNo: 'TEST-0001',
  institutionName: 'ITER | SOA',
  primaryDomainName: 'Artificial Intelligence',
  preferredDomainNames: 'Artificial Intelligence|Smart Campus Solutions',
  track: 'Healthcare Innovation',
  degree: 'Undergraduate',
  yearSemester: '3rd Year / Semester 6',
  gender: 'FEMALE',
  contributionAreas: 'Technical Development|Presentation & Pitching',
  preferredTeamRole: 'Frontend Developer',
  technicalSkills: 'React|Vite|Node.js',
  nonTechnicalSkills: 'Leadership|Communication',
  phone: '+919876543210',
  discordId: 'alice_discord',
  profilePicUrl: '',
  linkedinUrl: 'https://linkedin.com/in/alice',
  githubUrl: 'https://github.com/alice',
  portfolioUrl: '',
  resumeDriveLink: '',
  researchPublicationUrl: '',
  bio: 'Interested in AI products for healthcare.',
  certificationsAchievements: '',
  projectInitiative: '',
  participationExperience: '',
  achievements: '',
  hackathonExperience: '',
  isDomainExpert: 'TRUE',
  plainPassword: 'alice123',
};

export const downloadTemplate = async (_req, res) => {
  const { institutions, domains } = await testingImportService.loadTaxonomy();

  const workbook = XLSX.utils.book_new();

  const sampleSheet = XLSX.utils.json_to_sheet([SAMPLE_ROW], { header: TEMPLATE_HEADERS });
  XLSX.utils.book_append_sheet(workbook, sampleSheet, 'Users');

  const instSheet = XLSX.utils.json_to_sheet(
    institutions.length ? institutions.map((i) => ({ institutionName: i.name })) : [{ institutionName: '(no institutions exist yet)' }],
  );
  XLSX.utils.book_append_sheet(workbook, instSheet, 'Institutions');

  const domSheet = XLSX.utils.json_to_sheet(
    domains.length ? domains.map((d) => ({ domainName: d.name })) : [{ domainName: '(no domains exist yet)' }],
  );
  XLSX.utils.book_append_sheet(workbook, domSheet, 'Domains');

  const instructionRows = [
    { Field: 'fullName', Required: 'YES', Notes: 'Student full name (2-120 chars)' },
    { Field: 'email', Required: 'YES', Notes: 'Must be unique. Lowercased on import.' },
    { Field: 'registrationNo', Required: 'YES', Notes: 'Must be unique.' },
    { Field: 'institutionName', Required: 'YES', Notes: 'Exact name from Institutions sheet' },
    { Field: 'primaryDomainName', Required: 'YES', Notes: 'Exact name from Domains sheet' },
    { Field: 'preferredDomainNames', Required: 'no', Notes: 'Multiple, separated by | (pipe)' },
    { Field: 'track', Required: 'no', Notes: 'Free text' },
    { Field: 'degree', Required: 'YES', Notes: 'e.g. Undergraduate' },
    { Field: 'yearSemester', Required: 'YES', Notes: 'e.g. "3rd Year / Semester 6"' },
    { Field: 'gender', Required: 'YES', Notes: 'MALE | FEMALE | OTHER' },
    { Field: 'contributionAreas', Required: 'YES', Notes: 'Multiple, separated by |' },
    { Field: 'preferredTeamRole', Required: 'YES', Notes: 'Free text' },
    { Field: 'technicalSkills', Required: 'no', Notes: 'Free text (use | for lists)' },
    { Field: 'nonTechnicalSkills', Required: 'no', Notes: 'Free text (use | for lists)' },
    { Field: 'phone', Required: 'no', Notes: 'Including country code' },
    { Field: 'discordId', Required: 'no', Notes: 'Free text' },
    { Field: 'profilePicUrl', Required: 'no', Notes: 'URL' },
    { Field: 'linkedinUrl', Required: 'no', Notes: 'URL' },
    { Field: 'githubUrl', Required: 'no', Notes: 'URL' },
    { Field: 'portfolioUrl', Required: 'no', Notes: 'URL' },
    { Field: 'resumeDriveLink', Required: 'no', Notes: 'URL' },
    { Field: 'researchPublicationUrl', Required: 'no', Notes: 'URL' },
    { Field: 'bio', Required: 'YES', Notes: 'Up to 1000 chars' },
    { Field: 'certificationsAchievements', Required: 'no', Notes: 'Long text' },
    { Field: 'projectInitiative', Required: 'no', Notes: 'Long text' },
    { Field: 'participationExperience', Required: 'no', Notes: 'Long text' },
    { Field: 'achievements', Required: 'no', Notes: 'Long text' },
    { Field: 'hackathonExperience', Required: 'no', Notes: 'Long text' },
    { Field: 'isDomainExpert', Required: 'no', Notes: 'TRUE | FALSE (default FALSE)' },
    { Field: 'plainPassword', Required: 'no', Notes: 'If blank, a random 6-digit password is generated' },
  ];
  const instructionsSheet = XLSX.utils.json_to_sheet(instructionRows);
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="vortex-testing-template.xlsx"');
  res.send(buffer);
};

export const importUsers = async (req, res) => {
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return res.status(400).json({ error: 'rows array is required' });
  }
  if (rows.length > 500) {
    return res.status(400).json({ error: 'Max 500 rows per import' });
  }

  const summary = await testingImportService.importRows(rows);
  res.json(summary);
};

export const exportResults = async (req, res) => {
  const { results } = req.body;
  if (!Array.isArray(results)) {
    return res.status(400).json({ error: 'results array required' });
  }
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(results);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Import Results');
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="testing-import-results-${new Date().toISOString().slice(0, 10)}.xlsx"`);
  res.send(buffer);
};
