import { userService } from '../services/user.service.js';
import { registryService } from '../services/registry.service.js';
import { auditService } from '../services/audit.service.js';
import { sendVerificationRejectedMail } from '../utils/mail.js';

// Admin-initiated credential operations (approve, restore, reissue) intentionally
// do NOT send emails. The plaintext password is surfaced in the response body for
// the admin to copy and relay manually. Email-on-approve is reserved for the
// coordinator flow, where the campus contact verifies the student.

// All handlers below require requireAuth + requireRole('ADMIN') at the route layer.

export const listPending = async (req, res) => {
  const users = await userService.listPending({ search: req.query.search });

  // Annotate each with registry-match info so the admin UI can highlight
  // exact matches vs. unknowns. Done in a loop to avoid an N+1 — registry
  // lookups are unique-key reads, very cheap.
  const annotated = await Promise.all(
    users.map(async (u) => ({
      ...u,
      registryMatch: await registryService.matchUser({
        registrationNo: u.registrationNo,
        email: u.email,
      }),
    })),
  );
  res.json({ count: annotated.length, users: annotated });
};

export const listStudents = async (req, res) => {
  const users = await userService.listStudents(req.query);
  res.json({ count: users.length, users });
};

// Resolve a registration number to its underlying User. Used by admin
// flows (force-add member, jury assignment) where we want admins to type
// the human-friendly reg# instead of a cuid.
export const lookupByRegistrationNo = async (req, res) => {
  const user = await userService.findByRegistrationNo(req.query.registrationNo);
  res.json({ user });
};

export const approve = async (req, res) => {
  const { user, plaintextPassword } = await userService.approveStudent(req.params.id);

  auditService.record({
    actorId: req.user.id,
    action: 'USER_VERIFIED',
    entityType: 'User',
    entityId: user.id,
    details: { email: user.email },
  });

  // Surface the plaintext password to the admin UI ONLY. This response
  // never leaves the ADMIN-gated route. Treat it as a one-shot reveal —
  // the database stores only the bcrypt hash, so once this response is
  // discarded the password is unrecoverable except via reissue().
  res.json({
    message: 'User verified — share the password manually',
    user,
    password: plaintextPassword,
  });
};

export const reject = async (req, res) => {
  const { user, snapshot } = await userService.rejectStudent(req.params.id);

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
    details: { reason: req.body.reason ?? null },
  });

  res.json({ message: 'User rejected', user });
};

export const revoke = async (req, res) => {
  const { user } = await userService.revokeStudent(req.params.id);

  auditService.record({
    actorId: req.user.id,
    action: 'USER_REVOKED',
    entityType: 'User',
    entityId: user.id,
  });

  res.json({ message: 'Access revoked', user });
};

export const restore = async (req, res) => {
  const { user, plaintextPassword } = await userService.restoreRevokedStudent(req.params.id);

  auditService.record({
    actorId: req.user.id,
    action: 'USER_VERIFIED',
    entityType: 'User',
    entityId: user.id,
    details: { restored: true },
  });

  res.json({
    message: 'Access restored — share the password manually',
    user,
    password: plaintextPassword,
  });
};

export const reissue = async (req, res) => {
  const { user, plaintextPassword } = await userService.reissuePassword(req.params.id);

  auditService.record({
    actorId: req.user.id,
    action: 'USER_VERIFIED',
    entityType: 'User',
    entityId: user.id,
    details: { reissue: true },
  });

  res.json({
    message: 'New password issued — share it manually',
    password: plaintextPassword,
    user,
  });
};
