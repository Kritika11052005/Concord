import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db/index.js';

export const consoleRouter = Router();

const DEFAULT_MERCHANT_ID = '00000000-0000-0000-0000-000000000001';

// 1. Order Feed
consoleRouter.get('/orders', async (req: Request, res: Response): Promise<void> => {
  const { decision, limit = '50', offset = '0' } = req.query;
  const merchantId = (req.query.merchant_id as string) || DEFAULT_MERCHANT_ID;

  try {
    let query = `
      SELECT r.id, r.sequence_number, r.decision, r.intent_text, r.cart_total_minor,
             r.currency, r.latency_ms, r.issued_at, r.hash,
             (SELECT reason FROM checks WHERE receipt_id = r.id AND verdict = 'fail' LIMIT 1) as failing_reason
        FROM receipts r
       WHERE r.merchant_id = $1
    `;
    const params: any[] = [merchantId];

    if (decision && typeof decision === 'string' && decision !== 'all') {
      params.push(decision);
      query += ` AND r.decision = $${params.length}`;
    }

    query += ` ORDER BY r.issued_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const result = await pool.query(query, params);

    const countRes = await pool.query(
      `SELECT count(*) as total FROM receipts WHERE merchant_id = $1`,
      [merchantId]
    );

    res.json({
      orders: result.rows.map((row) => ({
        id: row.id,
        sequence_number: Number(row.sequence_number),
        decision: row.decision,
        intent_text: row.intent_text,
        cart_total: Number(row.cart_total_minor),
        currency: row.currency,
        latency_total: row.latency_ms?.total || 0,
        failing_reason: row.failing_reason,
        issued_at: row.issued_at,
        hash: row.hash,
      })),
      total: Number(countRes.rows[0]?.total || 0),
    });
  } catch (err) {
    console.error('Console orders fetch error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } });
  }
});

// 2. Console Ops Metrics
consoleRouter.get('/metrics', async (req: Request, res: Response): Promise<void> => {
  const merchantId = (req.query.merchant_id as string) || DEFAULT_MERCHANT_ID;

  try {
    // 2.1 Decision Mix
    const decisionRes = await pool.query(
      `SELECT decision, count(*)::int as count FROM receipts WHERE merchant_id = $1 GROUP BY decision`,
      [merchantId]
    );

    const decisionMix: Record<string, number> = { pass: 0, step_up: 0, decline: 0 };
    for (const r of decisionRes.rows) {
      decisionMix[r.decision] = r.count;
    }

    // 2.2 Checks fired & failure frequency
    const checksRes = await pool.query(
      `SELECT constraint_kind,
              count(*) FILTER (WHERE verdict = 'fail')::int AS failures,
              count(*)::int AS total
         FROM checks
        WHERE merchant_id = $1
        GROUP BY constraint_kind
        ORDER BY failures DESC`,
      [merchantId]
    );

    // 2.3 Degradation Rate
    const degRes = await pool.query(
      `SELECT COALESCE(avg(degraded::int), 0)::float as degradation_rate FROM receipts WHERE merchant_id = $1`,
      [merchantId]
    );

    // 2.4 Strictness
    const merchantRes = await pool.query(
      `SELECT strictness, chain_length FROM merchants WHERE id = $1`,
      [merchantId]
    );

    const strictness = Number(merchantRes.rows[0]?.strictness || 0.75);
    const chainLength = Number(merchantRes.rows[0]?.chain_length || 0);

    res.json({
      decision_mix: decisionMix,
      checks_breakdown: checksRes.rows,
      degradation_rate: degRes.rows[0]?.degradation_rate || 0,
      strictness,
      chain_length: chainLength,
      cache_hit_rate: 0.82, // Aggregated demo metric
      p95_latency_ms: 185,
    });
  } catch (err) {
    console.error('Console metrics fetch error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch metrics' } });
  }
});

// 3. Settings Update (Strictness)
consoleRouter.post('/settings', async (req: Request, res: Response): Promise<void> => {
  const { strictness, merchant_id } = req.body;
  const merchantId = merchant_id || DEFAULT_MERCHANT_ID;

  if (typeof strictness !== 'number' || strictness < 0.5 || strictness > 0.95) {
    res.status(400).json({ error: { code: 'INVALID_STRICTNESS', message: 'Strictness must be between 0.50 and 0.95' } });
    return;
  }

  try {
    await pool.query(
      `UPDATE merchants SET strictness = $1 WHERE id = $2`,
      [strictness, merchantId]
    );
    res.json({ status: 'ok', strictness });
  } catch (err) {
    console.error('Settings update error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } });
  }
});

// 4. Step-Up Resolution Submission
consoleRouter.post('/step-up', async (req: Request, res: Response): Promise<void> => {
  const { receipt_id, resolution, proposed_sku, replacement_receipt_id } = req.body;

  if (!receipt_id || !['accepted', 'overridden', 'abandoned'].includes(resolution)) {
    res.status(400).json({ error: { code: 'INVALID_RESOLUTION', message: 'Valid receipt_id and resolution required' } });
    return;
  }

  try {
    await pool.query(
      `INSERT INTO step_up_resolutions (receipt_id, resolution, proposed_sku, replacement_receipt_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (receipt_id) DO UPDATE
       SET resolution = $2, proposed_sku = $3, replacement_receipt_id = $4, resolved_at = now()`,
      [receipt_id, resolution, proposed_sku || null, replacement_receipt_id || null]
    );

    res.json({ status: 'ok', receipt_id, resolution });
  } catch (err) {
    console.error('Step-up resolution save error:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to record resolution' } });
  }
});
