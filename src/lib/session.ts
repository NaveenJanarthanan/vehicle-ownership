import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as { id: string; email: string; name?: string | null };
}
