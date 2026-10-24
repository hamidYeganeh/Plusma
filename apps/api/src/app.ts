import "reflect-metadata";
import {
  Controller,
  Get,
  Inject,
  Module,
  ServiceUnavailableException,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json } from "express";
import { Database, DatabaseModule } from "../modules/database";
import { AccessModule } from "../modules/access";
import { CafeModule } from "../modules/cafe";
export type ApiOptions = {
  databaseUrl: string;
  secret: string;
  origins: string[];
  production?: boolean;
  logger?: false;
};
export async function createApp(options: ApiOptions) {
  if (options.secret.length < 32)
    throw new Error("APP_SECRET must contain at least 32 characters");
  if (!options.origins.length) throw new Error("TRUSTED_ORIGINS required");
  @Controller()
  class HealthController {
    constructor(@Inject(Database) private readonly db: Database) {}
    @Get("health") async health() {
      try {
        await this.db.query("SELECT 1");
        return { status: "ok" };
      } catch {
        throw new ServiceUnavailableException("Database unavailable");
      }
    }
  }
  @Module({
    imports: [
      DatabaseModule.forRoot(options.databaseUrl),
      AccessModule.forRoot(!!options.production),
      CafeModule.forRoot(options.secret),
    ],
    controllers: [HealthController],
  })
  class AppModule {}
  const app = await NestFactory.create(AppModule, {
    logger: options.logger,
    bodyParser: false,
  });
  app.setGlobalPrefix("api/v1");
  const express = app.getHttpAdapter().getInstance();
  express.disable("x-powered-by");
  app.use(json({ limit: "16kb" }));
  app.use(
    (
      request: import("express").Request,
      response: import("express").Response,
      next: import("express").NextFunction,
    ) => {
      response.setHeader("Cache-Control", "no-store");
      response.setHeader("X-Content-Type-Options", "nosniff");
      const origin = request.headers.origin;
      const mutation = !["GET", "HEAD", "OPTIONS"].includes(request.method);
      if (
        mutation &&
        ((origin && !options.origins.includes(origin)) ||
          request.headers["sec-fetch-site"] === "cross-site" ||
          (request.headers.cookie && !origin))
      ) {
        return response
          .status(403)
          .json({ statusCode: 403, message: "Untrusted request origin" });
      }
      if (
        mutation &&
        request.method === "POST" &&
        !request.is("application/json")
      )
        return response
          .status(415)
          .json({ statusCode: 415, message: "application/json required" });
      next();
    },
  );
  app.enableShutdownHooks();
  return app;
}
