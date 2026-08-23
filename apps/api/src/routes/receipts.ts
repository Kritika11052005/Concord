import { Router } from 'express';
import type { Request, Response } from 'express';
import { pool } from '../db/index.js';
import { verifySignature } from '@concord/core';
import type { PublicVerifyResult } from '@concord/schema';

export const receiptsRouter = Router();

// 1. Authenticated / Console Receipt Detail (Full Evidence)
receiptsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const receiptRes = await pool.query(`SELECT * FROM receipts WHERE id = $1`, [id]);
    if (receiptRes.rows.length === 0) {
      res.status(404).json({ error: { code: 'RECEIPT_NOT_FOUND', message: `Receipt ${id} not found` } });
      return;
    }

    const checksRes = await pool.query(
      `SELECT * FROM checks WHERE receipt_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    const stepUpRes = await pool.query(
      `SELECT * FROM step_up_resolutions WHERE receipt_id = $1`,
      [id]
    );

    const receipt = receiptRes.rows[0];
    res.json({
      receipt: {
        receipt_id: receipt.id,
        merchant_id: receipt.merchant_id,
        sequence_number: Number(receipt.sequence_number),
        prev_hash: receipt.prev_hash,
        hash: receipt.hash,
        signature: receipt.signature,
        signing_key_version: receipt.signing_key_version,
        issued_at: receipt.issued_at,
        decision: receipt.decision,
        strictness_used: Number(receipt.strictness_used),
        extraction_confidence: Number(receipt.extraction_confidence),
        degraded: receipt.degraded,
        intent_text: receipt.intent_text,
        intent_hash: receipt.intent_hash,
        constraint_set: receipt.constraint_set,
        cart: receipt.cart,
        cart_total_minor: Number(receipt.cart_total_minor),
        currency: receipt.currency,
        versions: receipt.versions,
        latency_ms: receipt.latency_ms,
        request_id: receipt.request_id,
        checks: checksRes.rows,
        resolution: stepUpRes.rows[0] || null,
      },
    });
  } catch (err) {
    console.error('Error fetching receipt:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve receipt' } });
  }
});

// 2. Zero-Auth Public Receipt Verifier (Proof without PII)
receiptsRouter.get('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const receiptRes = await pool.query(`SELECT * FROM receipts WHERE id = $1`, [id]);
    if (receiptRes.rows.length === 0) {
      res.status(404).json({ error: { code: 'RECEIPT_NOT_FOUND', message: `Receipt ${id} not found` } });
      return;
    }

    const r = receiptRes.rows[0];
    const publicKey = process.env.SIGNING_PUBLIC_KEY_V1 || 'MCowBQYDK2VwAyEAmY9GcdsdHa2RGWfynRvZx6mh6hvNJC2ofF74NGM30z0=';

    // Verify Ed25519 digital signature
    const signatureValid = verifySignature(r.hash, r.signature, publicKey);

    // Verify chain link against predecessor if sequence > 1
    let chainLinkValid = true;
    if (Number(r.sequence_number) > 1) {
      if (!r.prev_hash) {
        chainLinkValid = false;
      } else {
        const prevRes = await pool.query(
          `SELECT hash FROM receipts WHERE merchant_id = $1 AND sequence_number = $2`,
          [r.merchant_id, Number(r.sequence_number) - 1]
        );
        if (prevRes.rows.length === 0 || prevRes.rows[0].hash !== r.prev_hash) {
          chainLinkValid = false;
        }
      }
    } else {
      chainLinkValid = r.prev_hash === null;
    }

    const checksRes = await pool.query(
      `SELECT constraint_id, constraint_kind, layer, verdict, confidence, reason FROM checks WHERE receipt_id = $1`,
      [id]
    );

    const publicResult: PublicVerifyResult = {
      receipt_id: r.id,
      sequence_number: Number(r.sequence_number),
      prev_hash: r.prev_hash,
      hash: r.hash,
      signature: r.signature,
      signature_valid: signatureValid,
      chain_link_valid: chainLinkValid,
      signing_key_version: r.signing_key_version,
      issued_at: r.issued_at,
      decision: r.decision,
      strictness_used: Number(r.strictness_used),
      checks_summary: checksRes.rows.map((c) => ({
        check_id: c.constraint_id,
        constraint_kind: c.constraint_kind,
        layer: c.layer,
        verdict: c.verdict,
        confidence: Number(c.confidence),
        reason: c.reason,
      })),
      versions: r.versions,
    };

    res.json(publicResult);
  } catch (err) {
    console.error('Error verifying receipt:', err);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Verification error' } });
  }
});
