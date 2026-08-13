import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

/** Avatars are stored as data URLs on the user row, so keep them small. */
const MAX_AVATAR_BYTES = 400_000;
const MIN_PASSWORD_LENGTH = 8;

const publicUser = (u: {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: Date;
}) => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  role: u.role,
  phone: u.phone || undefined,
  avatar_url: u.avatar_url || undefined,
  created_at: u.created_at,
});

// GET /api/profile?user_id=
export async function GET(req: NextRequest) {
  try {
    const user_id = req.nextUrl.searchParams.get('user_id');
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const user = await db.user.findUnique({
      where: { id: user_id },
      include: { doctor: { select: { specialization: true, bio: true, consultation_fee: true, license_number: true } } },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ user: publicUser(user), doctor: user.doctor || null });
  } catch (error) {
    console.error('[PROFILE/GET]', error);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

/**
 * PATCH /api/profile — update the signed-in user's own details, avatar or password.
 *
 * A password change requires the current password. That check is what stops an
 * unattended session (or anyone who can reach this route with a user id) from
 * taking the account over.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, full_name, phone, avatar_url, current_password, new_password, specialization, bio } = body;

    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 });

    const user = await db.user.findUnique({ where: { id: user_id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data: Record<string, unknown> = {};

    if (typeof full_name === 'string') {
      const trimmed = full_name.trim();
      if (trimmed.length < 2) return NextResponse.json({ error: 'Full name is too short.' }, { status: 400 });
      data.full_name = trimmed;
    }

    if (typeof phone === 'string') {
      data.phone = phone.trim() || null;
    }

    if (avatar_url !== undefined) {
      if (avatar_url === null || avatar_url === '') {
        data.avatar_url = null;
      } else if (typeof avatar_url !== 'string') {
        return NextResponse.json({ error: 'Invalid image.' }, { status: 400 });
      } else if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(avatar_url) && !/^https?:\/\//i.test(avatar_url)) {
        return NextResponse.json({ error: 'Profile image must be a PNG, JPEG, WebP or GIF.' }, { status: 400 });
      } else if (avatar_url.length > MAX_AVATAR_BYTES) {
        return NextResponse.json(
          { error: 'That image is too large. Please choose one under about 300 KB.' },
          { status: 413 }
        );
      } else {
        data.avatar_url = avatar_url;
      }
    }

    if (new_password) {
      if (typeof new_password !== 'string' || new_password.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
          { status: 400 }
        );
      }
      if (!current_password) {
        return NextResponse.json({ error: 'Enter your current password to set a new one.' }, { status: 400 });
      }

      const matches = await bcrypt.compare(String(current_password), user.password);
      if (!matches) {
        return NextResponse.json({ error: 'Your current password is incorrect.' }, { status: 401 });
      }

      data.password = await bcrypt.hash(new_password, 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
    }

    const updated = await db.user.update({ where: { id: user_id }, data });

    // Doctors keep their clinical profile on the Doctor row.
    if ((specialization || bio) && updated.role === 'DOCTOR') {
      await db.doctor
        .update({
          where: { user_id },
          data: {
            ...(specialization ? { specialization: String(specialization) } : {}),
            ...(bio ? { bio: String(bio) } : {}),
          },
        })
        .catch(() => undefined);
    }

    await db.auditLog.create({
      data: {
        actor: updated.email,
        action: data.password ? 'PASSWORD_CHANGED' : 'PROFILE_UPDATED',
        entity: 'User',
        entity_id: user_id,
        details: data.password
          ? 'Account password changed by the user.'
          : `Updated: ${Object.keys(data).join(', ')}`,
      },
    });

    return NextResponse.json({ success: true, user: publicUser(updated) });
  } catch (error) {
    console.error('[PROFILE/PATCH]', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
