import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ForensicRentalAuditResult, RenterProfile } from '../types/audit.js';
import { TrueMonthlyCostResult } from '../validators/financial.js';
import { VetoEvaluationResult } from '../validators/veto.js';
import { DualScorecardResult } from '../validators/scorecard.js';

export interface StoredPropertyRecord {
  id: string;
  created_at: string;
  title: string;
  commune: string;
  listed_rent_clp: number;
  true_monthly_cost_clp: number;
  evidence_coverage_pct: number;
  fit_score_100: number;
  is_vetoed: boolean;
  verdict: string;
  audit_payload_json: string;
  post_tour_notes?: string;
}

export class PropertiesRepository {
  private db: DatabaseSync;

  constructor(dbPath: string = './data/faro_ledger.db') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new DatabaseSync(dbPath);
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        title TEXT NOT NULL,
        commune TEXT NOT NULL,
        listed_rent_clp INTEGER NOT NULL,
        true_monthly_cost_clp INTEGER NOT NULL,
        evidence_coverage_pct INTEGER NOT NULL,
        fit_score_100 INTEGER NOT NULL,
        is_vetoed INTEGER NOT NULL,
        verdict TEXT NOT NULL,
        audit_payload_json TEXT NOT NULL,
        post_tour_notes TEXT DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS user_profiles (
        id TEXT PRIMARY KEY,
        updated_at TEXT NOT NULL,
        profile_json TEXT NOT NULL
      );
    `);

    try {
      this.db.exec(`ALTER TABLE properties ADD COLUMN post_tour_notes TEXT DEFAULT ''`);
    } catch {
      // Column already exists
    }
  }

  public saveProperty(
    id: string,
    title: string,
    commune: string,
    cost: TrueMonthlyCostResult,
    veto: VetoEvaluationResult,
    scorecard: DualScorecardResult,
    audit: ForensicRentalAuditResult,
    postTourNotes: string = ''
  ): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO properties
      (id, created_at, title, commune, listed_rent_clp, true_monthly_cost_clp, evidence_coverage_pct, fit_score_100, is_vetoed, verdict, audit_payload_json, post_tour_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      new Date().toISOString(),
      title,
      commune,
      cost.base_rent_clp,
      cost.true_monthly_cost_year_one_clp,
      scorecard.evidence_coverage_pct,
      scorecard.verified_fit_score_100,
      veto.is_vetoed ? 1 : 0,
      veto.verdict,
      JSON.stringify(audit),
      postTourNotes
    );
  }

  public listProperties(): StoredPropertyRecord[] {
    const rows = this.db.prepare(`SELECT * FROM properties ORDER BY created_at DESC`).all() as any[];
    return rows.map((r) => ({
      ...r,
      is_vetoed: Boolean(r.is_vetoed),
    }));
  }

  public getPropertyById(id: string): (StoredPropertyRecord & { audit: ForensicRentalAuditResult }) | null {
    const row = this.db.prepare(`SELECT * FROM properties WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return {
      ...row,
      is_vetoed: Boolean(row.is_vetoed),
      audit: JSON.parse(row.audit_payload_json),
    };
  }

  public attachPostTourNote(id: string, noteText: string, updatedAudit?: ForensicRentalAuditResult): void {
    if (updatedAudit) {
      const stmt = this.db.prepare(`
        UPDATE properties SET post_tour_notes = ?, audit_payload_json = ? WHERE id = ?
      `);
      stmt.run(noteText, JSON.stringify(updatedAudit), id);
    } else {
      const stmt = this.db.prepare(`
        UPDATE properties SET post_tour_notes = ? WHERE id = ?
      `);
      stmt.run(noteText, id);
    }
  }

  public saveUserProfile(profileId: string, profile: RenterProfile): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_profiles (id, updated_at, profile_json) VALUES (?, ?, ?)
    `);
    stmt.run(profileId, new Date().toISOString(), JSON.stringify(profile));
  }

  public getUserProfile(profileId = 'default_user'): RenterProfile | null {
    const row = this.db.prepare(`SELECT profile_json FROM user_profiles WHERE id = ?`).get(profileId) as any;
    return row ? JSON.parse(row.profile_json) : null;
  }
}
