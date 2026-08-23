import { Router } from 'express';
import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import {
  VerifyRequestSchema,
  type CheckResult,
  type Receipt,
  type StepUpProposal,
  type VerifyResponse,
} from '@concord/schema';
import {
  CATALOG,
  CHECKER_VERSION,
  EXTRACTOR_VERSION,
  PROMPT_VERSION,
  SCHEMA_VERSION,
  computeReceiptHash,
  createLLMProvider,
  createPaymentsAdapter,
  decide,
  evaluateDeterministicChecks,
  resolveStepUpProposal,
  signHash,
  validateConstraintSet,
} from '@concord/core';
import { pool } from '../db/index.js';

export const verifyRouter = Router();

const DEFAULT_MERCHANT_ID = '00000000-0000-0000-0000-000000000001';

verifyRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  const requestId = `req_${crypto.randomBytes(8).toString('hex')}`;

  // 1. Zod Request validation
  const parsedBody = VerifyRequestSchema.safeParse(req.body);
  if (!parsedBody.success) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid verify request payload',
        details: parsedBody.error.errors,
        request_id: requestId,
      },
    });
    return;
  }

  const { intent_text, cart, strictness: requestedStrictness, mandate } = parsedBody.data;

  if (!cart.lines || cart.lines.length === 0) {
    res.status(400).json({
      error: { code: 'EMPTY_CART', message: 'Cart cannot be empty', request_id: requestId },
    });
    return;
  }

  const merchantId = cart.merchant_id || DEFAULT_MERCHANT_ID;
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  // 2. Idempotency Check
  if (idempotencyKey) {
    const rawReqHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ intent_text, cart }))
      .digest('hex');

    const existingKey = await pool.query(
      `SELECT status, request_hash, receipt_id FROM idempotency_keys WHERE merchant_id = $1 AND key = $2`,
      [merchantId, idempotencyKey]
    );

    if (existingKey.rows.length > 0) {
      const stored = existingKey.rows[0];
      if (stored.request_hash !== rawReqHash) {
        res.status(409).json({
          error: {
            code: 'IDEMPOTENCY_KEY_REUSED',
            message: 'Idempotency key reused with different request body',
            request_id: requestId,
          },
        });
        return;
      }

      if (stored.status === 'completed' && stored.receipt_id) {
        const cachedReceipt = await pool.query(
          `SELECT r.*, json_agg(c.*) as checks_list FROM receipts r LEFT JOIN checks c ON c.receipt_id = r.id WHERE r.id = $1 GROUP BY r.id`,
          [stored.receipt_id]
        );
        if (cachedReceipt.rows.length > 0) {
          const r = cachedReceipt.rows[0];
          res.json({
            decision: r.decision,
            receipt_id: r.id,
            sequence_number: Number(r.sequence_number),
            hash: r.hash,
            signature: r.signature,
            checks: r.checks_list || [],
            degraded: r.degraded,
            latency_ms: r.latency_ms,
          });
          return;
        }
      }
    }
  }

  // 3. Extraction (with cache)
  const extractStart = Date.now();
  const intentHash = crypto.createHash('sha256').update(intent_text.trim()).digest('hex');
  const llmProvider = createLLMProvider(process.env.LLM_PROVIDER, process.env.LLM_API_KEY);

  let constraintSet: any = null;
  let fromCache = false;

  const cachedExtraction = await pool.query(
    `SELECT constraint_set, confidence FROM extraction_cache WHERE intent_hash = $1 AND extractor_version = $2 AND prompt_version = $3`,
    [intentHash, EXTRACTOR_VERSION, PROMPT_VERSION]
  );

  if (cachedExtraction.rows.length > 0) {
    constraintSet = cachedExtraction.rows[0].constraint_set;
    fromCache = true;
    // Update hit count asynchronously
    pool.query(
      `UPDATE extraction_cache SET hit_count = hit_count + 1, last_hit_at = now() WHERE intent_hash = $1 AND extractor_version = $2 AND prompt_version = $3`,
      [intentHash, EXTRACTOR_VERSION, PROMPT_VERSION]
    ).catch(() => {});
  } else {
    constraintSet = await llmProvider.extractConstraints(intent_text);
    // Cache write
    pool.query(
      `INSERT INTO extraction_cache (intent_hash, extractor_version, prompt_version, constraint_set, confidence, hit_count)
       VALUES ($1, $2, $3, $4, $5, 1)
       ON CONFLICT (intent_hash, extractor_version, prompt_version) DO NOTHING`,
      [intentHash, EXTRACTOR_VERSION, PROMPT_VERSION, JSON.stringify(constraintSet), constraintSet.extraction_confidence]
    ).catch(() => {});
  }

  const extractDuration = Date.now() - extractStart;

  // 4. Extraction Validator
  const validation = validateConstraintSet(constraintSet, cart.currency);
  const extractionConf = validation.valid ? constraintSet.extraction_confidence : 0.4;

  // 5. Deterministic Checks (Layer 1)
  const detStart = Date.now();
  const deterministicChecks = evaluateDeterministicChecks(
    constraintSet,
    cart,
    mandate?.allowed_merchants
  );
  const detDuration = Date.now() - detStart;

  // 6. Semantic Checks (Layer 2)
  const semStart = Date.now();
  let semanticChecks: CheckResult[] = [];
  let degraded = false;

  try {
    semanticChecks = await llmProvider.evaluateSemantic(constraintSet, cart);
  } catch {
    degraded = true;
    semanticChecks = [
      {
        check_id: `chk_sem_unavailable`,
        constraint_id: 'c_category',
        constraint_kind: 'category',
        hardness: 'hard',
        layer: 'semantic',
        line_sku: cart.lines[0]?.sku || null,
        verdict: 'unavailable',
        confidence: 0,
        reason: 'Semantic evaluation layer unavailable',
        observed: null,
        expected: null,
      },
    ];
  }
  const semDuration = Date.now() - semStart;

  const allChecks: CheckResult[] = [...deterministicChecks, ...semanticChecks];

  // 7. Decision Algebra
  const strictness = requestedStrictness ?? 0.75;
  const outcome = decide(allChecks, extractionConf, strictness);

  // 8. Step-Up Proposal Resolver (if step_up)
  let stepUpProposal: StepUpProposal | null = null;
  if (outcome.decision === 'step_up') {
    stepUpProposal = resolveStepUpProposal(constraintSet, cart, CATALOG);
  }

  // 9. Razorpay Payment Order (if pass)
  let razorpayOrderId: string | null = null;
  const paymentsAdapter = createPaymentsAdapter(
    process.env.PAYMENTS_PROVIDER,
    process.env.RAZORPAY_KEY_ID,
    process.env.RAZORPAY_KEY_SECRET
  );

  const totalDuration = Date.now() - startTime;
  const latencyMs = {
    extract: extractDuration,
    deterministic: detDuration,
    semantic: semDuration,
    total: totalDuration,
  };

  const versions = {
    extractor: EXTRACTOR_VERSION,
    checker: CHECKER_VERSION,
    schema: SCHEMA_VERSION,
    prompt: PROMPT_VERSION,
  };

  // 10. Atomic Append Transaction (Row Lock on Merchant Chain Head)
  const client = await pool.connect();
  let savedReceiptId = '';
  let sequenceNumber = 1;
  let receiptHash = '';
  let receiptSig = '';

  try {
    await client.query('BEGIN');

    // 10.1 Lock Merchant
    const merchantRes = await client.query(
      `SELECT id, chain_head_id, chain_length, signing_key_version FROM merchants WHERE id = $1 FOR UPDATE`,
      [merchantId]
    );

    let prevHash: string | null = null;
    let signingKeyVersion = 1;

    if (merchantRes.rows.length === 0) {
      // Auto create merchant if demo
      await client.query(
        `INSERT INTO merchants (id, name, strictness, signing_key_version, chain_length) VALUES ($1, 'Auto Provisioned Merchant', 0.75, 1, 0)`,
        [merchantId]
      );
      sequenceNumber = 1;
      prevHash = null;
    } else {
      const mRow = merchantRes.rows[0];
      const chainLen = Number(mRow.chain_length || 0);
      sequenceNumber = chainLen + 1;
      signingKeyVersion = mRow.signing_key_version || 1;

      if (chainLen > 0 && mRow.chain_head_id) {
        const headRes = await client.query(`SELECT hash FROM receipts WHERE id = $1`, [mRow.chain_head_id]);
        if (headRes.rows.length > 0) {
          prevHash = headRes.rows[0].hash;
        }
      }
    }

    // 10.2 Create Receipt Payload
    const receiptId = crypto.randomUUID();
    savedReceiptId = receiptId;

    const receiptWithoutSig: Omit<Receipt, 'signature'> = {
      receipt_id: receiptId,
      merchant_id: merchantId,
      sequence_number: sequenceNumber,
      prev_hash: prevHash,
      hash: '', // will compute
      signing_key_version: signingKeyVersion,
      issued_at: new Date().toISOString(),
      decision: outcome.decision,
      strictness_used: strictness,
      extraction_confidence: extractionConf,
      degraded,
      intent_text,
      intent_hash: intentHash,
      constraint_set: constraintSet,
      cart,
      cart_total_minor: cart.total_amount,
      currency: cart.currency,
      checks: allChecks,
      versions,
      latency_ms: latencyMs,
      request_id: requestId,
    };

    // 10.3 Compute SHA-256 Hash and Ed25519 Signature
    receiptHash = computeReceiptHash(receiptWithoutSig);
    const privateKey = process.env.SIGNING_PRIVATE_KEY_V1 || 'MC4CAQAwBQYDK2VwBCIEIJ72Ru8DtvdSlHbnfln3kcXtX0XCKXRIGbT1dXAhZJQg';
    receiptSig = signHash(receiptHash, privateKey);

    // 10.4 Insert Receipt
    await client.query(
      `INSERT INTO receipts (
        id, merchant_id, sequence_number, prev_hash, hash, signature,
        signing_key_version, decision, strictness_used, extraction_confidence,
        degraded, intent_text, intent_hash, constraint_set, cart,
        cart_total_minor, currency, versions, latency_ms, request_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
      [
        receiptId,
        merchantId,
        sequenceNumber,
        prevHash,
        receiptHash,
        receiptSig,
        signingKeyVersion,
        outcome.decision,
        strictness,
        extractionConf,
        degraded,
        intent_text,
        intentHash,
        JSON.stringify(constraintSet),
        JSON.stringify(cart),
        cart.total_amount,
        cart.currency,
        JSON.stringify(versions),
        JSON.stringify(latencyMs),
        requestId,
      ]
    );

    // 10.5 Insert Checks
    for (const c of allChecks) {
      await client.query(
        `INSERT INTO checks (
          receipt_id, merchant_id, constraint_id, constraint_kind,
          hardness, layer, line_sku, verdict, confidence,
          raw_confidence, reason, observed, expected
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          receiptId,
          merchantId,
          c.constraint_id,
          c.constraint_kind,
          c.hardness,
          c.layer,
          c.line_sku,
          c.verdict,
          c.confidence,
          c.raw_confidence ?? null,
          c.reason,
          JSON.stringify(c.observed),
          JSON.stringify(c.expected),
        ]
      );
    }

    // 10.6 Update Merchant Head
    await client.query(
      `UPDATE merchants SET chain_head_id = $1, chain_length = chain_length + 1 WHERE id = $2`,
      [receiptId, merchantId]
    );

    // 10.7 Save Idempotency Key if present
    if (idempotencyKey) {
      const rawReqHash = crypto
        .createHash('sha256')
        .update(JSON.stringify({ intent_text, cart }))
        .digest('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO idempotency_keys (merchant_id, key, request_hash, receipt_id, status, expires_at)
         VALUES ($1, $2, $3, $4, 'completed', $5)
         ON CONFLICT (merchant_id, key) DO UPDATE SET status = 'completed', receipt_id = $4`,
        [merchantId, idempotencyKey, rawReqHash, receiptId, expiresAt]
      );
    }

    await client.query('COMMIT');
  } catch (dbErr) {
    await client.query('ROLLBACK');
    console.error('Transaction failed during verify append:', dbErr);
    res.status(503).json({
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Could not commit audit receipt to ledger; request aborted.',
        request_id: requestId,
      },
    });
    return;
  } finally {
    client.release();
  }

  // If passed, create Razorpay test order
  if (outcome.decision === 'pass') {
    try {
      const order = await paymentsAdapter.createOrder({
        amountMinor: cart.total_amount,
        currency: cart.currency,
        receiptId: savedReceiptId,
      });
      razorpayOrderId = order.orderId;
    } catch {
      razorpayOrderId = `order_test_${crypto.randomBytes(6).toString('hex')}`;
    }
  }

  const response: VerifyResponse = {
    decision: outcome.decision,
    receipt_id: savedReceiptId,
    sequence_number: sequenceNumber,
    hash: receiptHash,
    signature: receiptSig,
    checks: allChecks,
    degraded,
    step_up_proposal: stepUpProposal,
    razorpay_order_id: razorpayOrderId,
    latency_ms: latencyMs,
  };

  res.status(200).json(response);
});
