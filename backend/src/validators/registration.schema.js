import { z } from 'zod';

const url = z.string().url().max(500).optional().or(z.literal('').transform(() => undefined));
const optionalTrimmed = (max) => z.string().trim().min(1).max(max).optional();
const optionalTextarea = (max) => z.string().trim().max(max).optional();
const stringList = z.array(z.string().trim().min(1).max(80)).max(12).optional();
const cuidList = z.array(z.string().cuid()).min(1).max(4).optional();
const requiredTrimmed = (max) => z.string().trim().min(1).max(max);
const requiredTextarea = (max) => z.string().trim().min(1).max(max);
const requiredStringList = z.array(z.string().trim().min(1).max(80)).min(1).max(12);

export const registrationSchema = z.object({
  fullName:       z.string().trim().min(2).max(120),
  email:          z.string().email().toLowerCase().trim(),
  registrationNo: z.string().trim().min(1).max(50),
  institutionId:  z.string().cuid(),
  domainId:       z.string().cuid(),
  preferredDomains: cuidList,
  track:          z.string().trim().min(1).max(80).optional(),
  degree:         requiredTrimmed(80),
  yearSemester:   requiredTrimmed(80),
  contributionAreas: requiredStringList,
  preferredTeamRole: requiredTrimmed(80),
  technicalSkills: optionalTextarea(500),
  nonTechnicalSkills: optionalTextarea(500),
  phone:          z.string().trim().min(7).max(20).optional(),
  discordId:      z.string().trim().max(60).optional(),
  gender:         z.enum(['MALE', 'FEMALE', 'OTHER']),
  profilePicUrl:  url,
  linkedinUrl:    url,
  githubUrl:      url,
  portfolioUrl:   url,
  resumeDriveLink: url,
  researchPublicationUrl: url,
  bio:            requiredTextarea(1000),
  certificationsAchievements: optionalTextarea(1500),
  projectInitiative: optionalTextarea(1500),
  participationExperience: optionalTextarea(1500),
  achievements:   optionalTextarea(1500),
  hackathonExperience: optionalTextarea(1500),
});
