import {
  Body,
  Controller,
  Delete,
  DynamicModule,
  Get,
  Inject,
  Module,
  Post,
  Req,
  Res,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  Access,
  SESSION_COOKIE,
  sessionToken,
  StaffGuard,
  StaffRequest,
} from "./access";
export { Access, StaffGuard } from "./access";
export type { StaffRequest } from "./access";
export { hashPassword } from "./password";
@Controller("staff")
class AccessController {
  constructor(
    @Inject(Access) private readonly access: Access,
    @Inject("SECURE_COOKIE") private readonly secure: boolean,
  ) {}
  @Post("login")
  async login(
    @Body() body: unknown,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = body as Record<string, unknown> | null;
    if (
      !data ||
      typeof data.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) ||
      data.email.length > 254 ||
      typeof data.password !== "string" ||
      data.password.length > 256
    )
      throw new BadRequestException("Invalid login");
    const { token, session } = await this.access.login(
      data.email,
      data.password,
      request.ip ?? "unknown",
    );
    response.cookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: this.secure,
      sameSite: "strict",
      path: "/api/v1/staff",
      maxAge: 12 * 60 * 60 * 1000,
    });
    return session;
  }
  @Get("session")
  @UseGuards(StaffGuard)
  session(@Req() request: StaffRequest) {
    return this.access.session(request.staffId);
  }
  @Delete("session")
  @UseGuards(StaffGuard)
  async logout(
    @Req() request: StaffRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.access.logout(sessionToken(request));
    response.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: this.secure,
      sameSite: "strict",
      path: "/api/v1/staff",
    });
    return { ok: true };
  }
}
@Module({})
export class AccessModule {
  static forRoot(secure: boolean): DynamicModule {
    return {
      module: AccessModule,
      global: true,
      controllers: [AccessController],
      providers: [
        Access,
        StaffGuard,
        { provide: "SECURE_COOKIE", useValue: secure },
      ],
      exports: [Access, StaffGuard],
    };
  }
}
