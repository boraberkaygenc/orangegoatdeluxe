// smoke-test route module (kept: harmless)
export function routes(ctx) { return [{ method: 'GET', path: '/api/ping', handler: async (req, res) => ctx.send(res, 200, { ok: true, dir: ctx.DIR, rev: ctx.db.rev }) }]; }
