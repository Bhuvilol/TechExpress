import { userService } from '../services/user.service.js';
import { verifyPassword } from '../utils/crypto.js';
import { signAccessToken } from '../middleware/auth.js';
import { Unauthorized, Forbidden } from '../utils/errors.js';

// Login. Single canonical 401 for "wrong email or password" to avoid email
// enumeration. Status-based rejections (REJECTED/REVOKED) get distinct
// 403 codes because the user already proved they know the password — at
// that point hiding the reason is just hostile UX.

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await userService.findForAuth(email);

  // Combine "no such user" and "wrong password" into one branch.
  if (!user || !user.passwordHash) {
    throw Unauthorized('Invalid email or password');
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw Unauthorized('Invalid email or password');

  // Past this point the credentials are valid. Now enforce account status.
  if (user.verificationStatus === 'PENDING') {
    throw Forbidden('Account is pending verification', { code: 'ACCOUNT_PENDING' });
  }
  if (user.verificationStatus === 'REJECTED') {
    throw Forbidden('Account verification was rejected', { code: 'ACCOUNT_REJECTED' });
  }
  if (user.verificationStatus === 'REVOKED') {
    throw Forbidden('Account access has been revoked', { code: 'ACCOUNT_REVOKED' });
  }
  if (user.verificationStatus !== 'VERIFIED') {
    throw Forbidden('Account is not active');
  }

  await userService.recordLogin(user.id);
  const token = signAccessToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      role: user.role,
      email: user.email,
      fullName: user.fullName,
      institution: user.institution ?? null,
    },
  });
};

export const me = async (req, res) => {
  const user = await userService.findById(req.user.id);
  if (!user) throw Unauthorized('Account no longer exists');
  res.json({ user });
};
