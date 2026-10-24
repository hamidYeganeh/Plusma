import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
  OnApplicationShutdown,
} from "@nestjs/common";
import { Pool, PoolClient, QueryResultRow } from "pg";
export type Transaction = PoolClient;

@Injectable()
export class Database implements OnApplicationShutdown {
  private readonly pool: Pool;
  constructor(@Inject("DATABASE_URL") url: string) {
    this.pool = new Pool({
      connectionString: url,
      max: 10,
      connectionTimeoutMillis: 5000,
      statement_timeout: 15000,
    });
    this.pool.on("error", () => {
      console.error("PostgreSQL idle connection error");
    });
  }
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values: unknown[] = [],
  ) {
    return this.pool.query<T>(sql, values);
  }
  async transaction<T>(run: (tx: Transaction) => Promise<T>): Promise<T> {
    const tx = await this.pool.connect();
    try {
      await tx.query("BEGIN");
      const result = await run(tx);
      await tx.query("COMMIT");
      return result;
    } catch (error) {
      await tx.query("ROLLBACK");
      throw error;
    } finally {
      tx.release();
    }
  }
  async limit(bucket: string, maximum: number, seconds: number) {
    const { rows } = await this.query(
      `INSERT INTO request_limits(bucket,hits) VALUES($1,1)
      ON CONFLICT(bucket) DO UPDATE SET
      hits=CASE WHEN request_limits.window_start < now()-make_interval(secs=>$2) THEN 1 ELSE request_limits.hits+1 END,
      window_start=CASE WHEN request_limits.window_start < now()-make_interval(secs=>$2) THEN now() ELSE request_limits.window_start END
      RETURNING hits`,
      [bucket, seconds],
    );
    return rows[0]!.hits <= maximum;
  }
  async onApplicationShutdown() {
    await this.pool.end();
  }
}
@Global()
@Module({})
export class DatabaseModule {
  static forRoot(url: string): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: "DATABASE_URL", useValue: url }, Database],
      exports: [Database],
    };
  }
}
