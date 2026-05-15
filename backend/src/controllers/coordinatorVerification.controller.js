import { userService } from '../services/user.service.js';
import { auditService } from '../services/audit.service.js';
import { Forbidden } from '../utils/errors.js';
import {
  sendVerificationApprovedMail,
  sendVerificationRejectedMail,
} from '../utils/mail.js';

const requireCoordinatorInstitutionId = (req) => {
  if (!req.user.institutionId) throw Forbidden('Coordinator is not assigned to an institution');
  return req.user.institutionId;
};

export const listPending = async (req, res) => {
  const institutionId = requireCoordinatorInstitutionId(req);
  const users = await userService.listPending({
    search: req.query.search,
    institutionId,
  });
  res.json({ count: users.length, users });
};

export const listStudents = async (req, res) => {
  const institutionId = requireCoordinatorInstitutionId(req);
  const users = await userService.listStudents({
    status: req.query.status,
    search: req.query.search,
    institutionId,
  });
  res.json({ count: users.length, users });
};

export const approve = async (req, res) => {
  const institutionId = requireCoordinatorInstitutionId(req);
  const { user, plaintextPassword } = await userService.approveStudent(req.params.id, { institutionId });

  await sendVerificationApprovedMail({
    to: user.email,
    fullName: user.fullName,
    password: plaintextPassword,
  });

  auditService.record({
    actorId: req.user.id,
    action: 'USER_VERIFIED',
    entityType: 'User',
    entityId: user.id,
    details: { email: user.email, via: 'COORDINATOR' },
  });

  // Coordinators must NEVER see the plaintext password — they only confirm
  // identity. The password is delivered exclusively to the student by email.
  res.json({
    message: 'User verified and credentials emailed',
    user,
  });
};

export const reject = async (req, res) => {
  const institutionId = requireCoordinatorInstitutionId(req);
  const { user, snapshot } = await userService.rejectStudent(req.params.id, { institutionId });

  await sendVerificationRejectedMail({
    to: snapshot.email,
    fullName: snapshot.fullName,
    reason: req.body.reason,
  });

  auditService.record({
    actorId: req.user.id,
    action: 'USER_REJECTED',
    entityType: 'User',
    entityId: user.id,
    details: { reason: req.body.reason ?? null, via: 'COORDINATOR' },
  });

  res.json({ message: 'User rejected', user });
};
