import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomBytes } from "node:crypto";
import type { Request } from "express";
import type { StaffSession } from "@repo/contracts";
import { Database } from "../database";
import { verifyPassword } from "./password";
export const SESSION_COOKIE = "plusma_session";
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export type StaffRequest = Request & { staffId: string };
export function sessionToken(request: Request) {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${SESSION_COOKIE}=`));
  return cookie?.slice(SESSION_COOKIE.length + 1) ?? "";
}
@Injectable()
export class Access {
  constructor(@Inject(Database) private readonly db: Database) {}
  async login(email: string, password: string, ip: string) {
    const allowed = await this.db.limit(
      `login:${digest(ip + email.toLowerCase())}`,
      10,
      900,
    );
    if (!allowed)
      throw new HttpException("Too many login attempts. Try again later.", 429);
    const { rows } = await this.db.query(
      "SELECT * FROM staff_users WHERE email=$1",
      [email.toLowerCase()],
    );
    // Keep the expensive password check on both paths to avoid a simple identity oracle.
    const fallback =
      "scrypt:00000000000000000000000000000000:" + "00".repeat(64);
    const matches = await verifyPassword(
      password,
      rows[0]?.password_hash ?? fallback,
    );
    if (!rows[0] || !matches)
      throw new UnauthorizedException("Invalid email or password");
    const token = randomBytes(32).toString("base64url");
    await this.db.query(
      "INSERT INTO staff_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '12 hours')",
      [digest(token), rows[0].id],
    );
    return { token, session: await this.session(rows[0].id) };
  }
  async identify(token: string): Promise<string> {
    if (!/^[\w-]{43}$/.test(token)) throw new UnauthorizedException();
    const { rows } = await this.db.query(
      "SELECT user_id FROM staff_sessions WHERE token_hash=$1 AND expires_at>now()",
      [digest(token)],
    );
    if (!rows[0]) throw new UnauthorizedException();
    return rows[0].user_id;
  }
  async logout(token: string) {
    await this.db.query("DELETE FROM staff_sessions WHERE token_hash=$1", [
      digest(token),
    ]);
  }
  async session(userId: string): Promise<StaffSession> {
    const { rows: users } = await this.db.query(
      "SELECT id,name,email FROM staff_users WHERE id=$1",
      [userId],
    );
    if (!users[0]) throw new UnauthorizedException();
    const { rows: venues } = await this.db.query(
      `SELECT v.id,v.slug,v.name,v.organization_id AS "organizationId",m.role
      FROM memberships m JOIN venues v ON v.organization_id=m.organization_id
      LEFT JOIN venue_permissions p ON p.venue_id=v.id AND p.user_id=m.user_id
      WHERE m.user_id=$1 AND (m.role='owner' OR p.venue_id IS NOT NULL) ORDER BY v.name`,
      [userId],
    );
    return {
      user: users[0] as StaffSession["user"],
      venues: venues as StaffSession["venues"],
    };
  }
  async authorize(userId: string, slug: string): Promise<string> {
    const session = await this.session(userId);
    const venue = session.venues.find((item) => item.slug === slug);
    if (!venue) throw new ForbiddenException("Venue access denied");
    return venue.id;
  }
}
@Injectable()
export class StaffGuard implements CanActivate {
  constructor(@Inject(Access) private readonly access: Access) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<StaffRequest>();
    request.staffId = await this.access.identify(sessionToken(request));
    return true;
  }
}
