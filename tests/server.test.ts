import test from 'node:test';
import assert from 'node:assert/strict';
import * as http from 'node:http';
import { server } from '../dist/server.js';

test('Server API: serves static React Workbench from client/dist', async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as any;
  const baseUrl = `http://localhost:${addr.port}`;

  try {
    const res = await fetch(`${baseUrl}/`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('FARO Rayos-X') || html.includes('id="root"'));
  } finally {
    server.close();
  }
});

test('Server API: health check returns ok and budget summary', async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as any;
  const baseUrl = `http://localhost:${addr.port}`;

  try {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data: any = await res.json();
    assert.equal(data.status, 'ok');
    assert.ok(data.budget_summary);
    assert.equal(typeof data.budget_summary.totalSpentUsd, 'number');
  } finally {
    server.close();
  }
});

test('Server API: POST /api/audit runs end-to-end pipeline and saves property', async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as any;
  const baseUrl = `http://localhost:${addr.port}`;

  try {
    const payload = {
      title: 'Depto Providencia Prueba',
      commune: 'Providencia',
      listingText: 'Espectacular depto Providencia $560.000 GGCC $65.000 pet-friendly',
      renterProfile: {
        max_total_monthly_budget_clp: 680000,
        requires_pet_friendly: true,
        requires_washer_connection: true,
        requires_direct_natural_light: true,
        max_minutes_to_metro: 15,
        preferred_communes: ['Providencia'],
      },
    };

    const res = await fetch(`${baseUrl}/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const data: any = await res.json();

    assert.ok(data.property_id);
    assert.ok(data.financial_breakdown);
    assert.ok(data.veto_evaluation);
    assert.ok(data.dual_scorecard);
    assert.ok(data.audit);
    assert.equal(data.financial_breakdown.base_rent_clp, 560000);
    assert.equal(data.veto_evaluation.verdict, 'VETOED_BY_CONSTRAINT');

    // Verify it appears in GET /api/properties
    const listRes = await fetch(`${baseUrl}/api/properties`);
    assert.equal(listRes.status, 200);
    const listData: any = await listRes.json();
    assert.ok(listData.properties.length > 0);
  } finally {
    server.close();
  }
});
