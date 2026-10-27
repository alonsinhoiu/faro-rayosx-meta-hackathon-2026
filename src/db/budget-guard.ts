import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';

export interface ApiUsageRecord {
  model: string;
  endpoint: string;
  input_tokens?: number;
  output_tokens?: number;
  images_count?: number;
  audio_seconds?: number;
  estimated_cost_usd: number;
}

export class BudgetGuard {
  private db: DatabaseSync;
  private hardLimitUsd: number;

  constructor(dbPath: string = './data/faro_ledger.db', hardLimitUsd: number = 10.00) {
    this.hardLimitUsd = hardLimitUsd;
    
    // Ensure dir exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_usage_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        model TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        input_tokens INTEGER DEFAULT 0,
        output_tokens INTEGER DEFAULT 0,
        images_count INTEGER DEFAULT 0,
        audio_seconds REAL DEFAULT 0,
        estimated_cost_usd REAL NOT NULL,
        status TEXT NOT NULL
      );
    `);
  }

  public getTotalSpentUsd(): number {
    const row = this.db.prepare(`SELECT COALESCE(SUM(estimated_cost_usd), 0) as total FROM api_usage_ledger WHERE status = 'COMPLETED'`).get() as { total: number };
    return row ? Number(row.total) : 0;
  }

  /**
   * Hard Firewall Check: Blocks any outgoing call if dev budget would be breached
   */
  public canSpend(estimatedCallCostUsd: number): boolean {
    const current = this.getTotalSpentUsd();
    return current + estimatedCallCostUsd <= this.hardLimitUsd;
  }

  public recordUsage(record: ApiUsageRecord, status: 'COMPLETED' | 'BLOCKED_BY_GUARD' | 'ERROR' = 'COMPLETED'): void {
    const stmt = this.db.prepare(`
      INSERT INTO api_usage_ledger 
      (timestamp, model, endpoint, input_tokens, output_tokens, images_count, audio_seconds, estimated_cost_usd, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      new Date().toISOString(),
      record.model,
      record.endpoint,
      record.input_tokens ?? 0,
      record.output_tokens ?? 0,
      record.images_count ?? 0,
      record.audio_seconds ?? 0,
      record.estimated_cost_usd,
      status
    );
  }

  public getSummary() {
    const totalSpent = this.getTotalSpentUsd();
    const countRow = this.db.prepare(`SELECT COUNT(*) as cnt FROM api_usage_ledger`).get() as { cnt: number };
    return {
      totalSpentUsd: totalSpent,
      hardLimitUsd: this.hardLimitUsd,
      remainingAllowanceUsd: Math.max(0, this.hardLimitUsd - totalSpent),
      totalCalls: countRow ? countRow.cnt : 0,
    };
  }
}
