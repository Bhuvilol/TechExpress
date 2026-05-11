import { prisma } from '../config/db.js';
import { hashPassword, generateSixDigitCode } from '../utils/crypto.js';
import { logger } from '../utils/logger.js';

const VALID_GENDERS = new Set(['MALE', 'FEMALE', 'OTHER']);

const splitMulti = (value) => {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value)
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean);
};

const cleanString = (value, max) => {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  if (!str) return undefined;
  return max ? str.slice(0, max) : str;
};

const cleanBool = (value) => {
  if (value === undefined || value === null || value === '') return false;
  const s = String(value).trim().toUpperCase();
  return s === 'TRUE' || s === 'YES' || s === '1' || s === 'Y';
};

export const testingImportService = {
  async loadTaxonomy() {
    const [institutions, domains] = await Promise.all([
      prisma.institution.findMany({ select: { id: true, name: true } }),
      prisma.domain.findMany({ select: { id: true, name: true } }),
    ]);
    const institutionByName = new Map(institutions.map((i) => [i.name.toLowerCase(), i]));
    const domainByName = new Map(domains.map((d) => [d.name.toLowerCase(), d]));
    return { institutionByName, domainByName, institutions, domains };
  },

  async importRows(rows) {
    const { institutionByName, domainByName } = await this.loadTaxonomy();

    const results = [];
    let created = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] ?? {};
      const rowNumber = i + 1;

      try {
        const fullName = cleanString(row.fullName, 120);
        const email = cleanString(row.email, 200)?.toLowerCase();
        const registrationNo = cleanString(row.registrationNo, 50);
        const institutionName = cleanString(row.institutionName, 200);
        const primaryDomainName = cleanString(row.primaryDomainName, 200);
        const gender = cleanString(row.gender)?.toUpperCase();
        const degree = cleanString(row.degree, 80);
        const yearSemester = cleanString(row.yearSemester, 80);
        const preferredTeamRole = cleanString(row.preferredTeamRole, 80);
        const bio = cleanString(row.bio, 1000);
        const contributionAreas = splitMulti(row.contributionAreas);
        const preferredDomainNames = splitMulti(row.preferredDomainNames);

        if (!fullName) throw new Error('Missing fullName');
        if (!email) throw new Error('Missing email');
        if (!registrationNo) throw new Error('Missing registrationNo');
        if (!institutionName) throw new Error('Missing institutionName');
        if (!primaryDomainName) throw new Error('Missing primaryDomainName');
        if (!gender || !VALID_GENDERS.has(gender)) {
          throw new Error('gender must be MALE, FEMALE, or OTHER');
        }
        if (!degree) throw new Error('Missing degree');
        if (!yearSemester) throw new Error('Missing yearSemester');
        if (!preferredTeamRole) throw new Error('Missing preferredTeamRole');
        if (!bio) throw new Error('Missing bio');
        if (contributionAreas.length === 0) throw new Error('contributionAreas is required (use | to separate values)');

        const institution = institutionByName.get(institutionName.toLowerCase());
        if (!institution) throw new Error(`Unknown institution: "${institutionName}"`);

        const domain = domainByName.get(primaryDomainName.toLowerCase());
        if (!domain) throw new Error(`Unknown primary domain: "${primaryDomainName}"`);

        const preferredDomainIds = [];
        for (const name of preferredDomainNames) {
          const d = domainByName.get(name.toLowerCase());
          if (!d) throw new Error(`Unknown preferred domain: "${name}"`);
          preferredDomainIds.push(d.id);
        }

        // Conflict check (email or registrationNo)
        const conflict = await prisma.user.findFirst({
          where: { OR: [{ email }, { registrationNo }] },
          select: { email: true, registrationNo: true },
        });
        if (conflict) {
          const field = conflict.email === email ? 'email' : 'registrationNo';
          throw new Error(`Duplicate ${field}`);
        }

        const plainPassword = cleanString(row.plainPassword, 120) ?? generateSixDigitCode();
        const passwordHash = await hashPassword(plainPassword);

        const data = {
          fullName,
          email,
          registrationNo,
          institutionId: institution.id,
          domainId: domain.id,
          preferredDomains: preferredDomainIds,
          track: cleanString(row.track, 80),
          degree,
          yearSemester,
          gender,
          contributionAreas,
          preferredTeamRole,
          technicalSkills: cleanString(row.technicalSkills, 500),
          nonTechnicalSkills: cleanString(row.nonTechnicalSkills, 500),
          phone: cleanString(row.phone, 20),
          discordId: cleanString(row.discordId, 60),
          profilePicUrl: cleanString(row.profilePicUrl, 500),
          linkedinUrl: cleanString(row.linkedinUrl, 500),
          githubUrl: cleanString(row.githubUrl, 500),
          portfolioUrl: cleanString(row.portfolioUrl, 500),
          resumeDriveLink: cleanString(row.resumeDriveLink, 500),
          researchPublicationUrl: cleanString(row.researchPublicationUrl, 500),
          bio,
          certificationsAchievements: cleanString(row.certificationsAchievements, 1500),
          projectInitiative: cleanString(row.projectInitiative, 1500),
          participationExperience: cleanString(row.participationExperience, 1500),
          achievements: cleanString(row.achievements, 1500),
          hackathonExperience: cleanString(row.hackathonExperience, 1500),
          isDomainExpert: cleanBool(row.isDomainExpert),
          role: 'STUDENT',
          verificationStatus: 'VERIFIED',
          passwordHash,
          passwordIssuedAt: new Date(),
        };

        const user = await prisma.user.create({
          data,
          select: { id: true, email: true, fullName: true, registrationNo: true },
        });

        created += 1;
        results.push({
          row: rowNumber,
          status: 'created',
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          registrationNo: user.registrationNo,
          plainPassword,
        });
      } catch (err) {
        failed += 1;
        results.push({
          row: rowNumber,
          status: 'failed',
          email: row?.email ?? null,
          error: err.message,
        });
        logger.warn('testing_import.row_failed', { row: rowNumber, err: err.message });
      }
    }

    return { total: rows.length, created, failed, results };
  },
};
