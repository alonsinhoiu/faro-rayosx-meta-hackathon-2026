import { calculateTrueMonthlyCost, computeDualScorecard, evaluateDealBreakerVeto } from './calculations';
import type { AuditApiResponse, RenterProfile, SampleFixture, WorkbenchCase } from './types';

const API_BASE = '';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function getHealth(): Promise<{ status: string; budget_summary?: unknown }> {
  return fetchJson('/api/health');
}

export function fixtureToCase(fixture: SampleFixture): WorkbenchCase {
  const cost = calculateTrueMonthlyCost(fixture.audit_result.financial_extraction);
  const veto = evaluateDealBreakerVeto(fixture.audit_result, cost, fixture.renter_profile);
  const scorecard = computeDualScorecard(fixture.audit_result.rubric_15_checks);
  return {
    renterProfile: fixture.renter_profile,
    listingAd: fixture.listing_ad,
    audit: fixture.audit_result,
    cost,
    veto,
    scorecard,
    fromCache: true,
  };
}

export async function loadSampleCase(): Promise<WorkbenchCase> {
  const fixture = await fetchJson<SampleFixture>('/api/fixtures/sample');
  return fixtureToCase(fixture);
}

export async function auditListing(listingText: string, renterProfile: RenterProfile): Promise<WorkbenchCase> {
  const data = await fetchJson<AuditApiResponse>('/api/audit', {
    method: 'POST',
    body: JSON.stringify({
      listingText,
      renterProfile,
      title: listingText.slice(0, 80) || 'Aviso auditado',
      commune: 'Santiago',
    }),
  });
  // La API ya trae cálculos deterministas; se usan tal cual.
  // Fallback: si faltaran, recalcular en cliente.
  const cost =
    data.financial_breakdown ??
    calculateTrueMonthlyCost(data.audit.financial_extraction);
  const veto =
    data.veto_evaluation ??
    evaluateDealBreakerVeto(data.audit, cost, renterProfile);
  const scorecard =
    data.dual_scorecard ?? computeDualScorecard(data.audit.rubric_15_checks);
  return {
    renterProfile,
    listingAd: {
      title: 'Aviso auditado',
      commune: 'Santiago',
      address_hint: '',
      body_text: listingText,
    },
    audit: data.audit,
    cost,
    veto,
    scorecard,
    reasoningSummary: data.reasoning_summary,
    fromCache: data.from_cache,
    propertyId: data.property_id,
  };
}
