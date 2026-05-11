export const homePathForRole = (role) => {
  if (role === 'ADMIN') return '/admin';
  if (role === 'JURY') return '/jury';
  if (role === 'COORDINATOR') return '/coordinator';
  return '/dashboard';
};
