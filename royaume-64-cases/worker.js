// Cloudflare Worker du Royaume des 64 Cases.
// IMPORTANT : le mot mystère n'est jamais écrit dans ce fichier.
// Il doit être enregistré dans Cloudflare comme secret MYSTERY_WORD.
// La clé SIGNING_KEY doit également être enregistrée comme secret.

const SOLUTIONS = {
  1: [{ move: "g6g7" }],
  2: [{ move: "b1c3" }],
  3: [{ move: "c1h6" }],
  4: [{ move: "a1a8" }],
  5: [{ move: "d1h5" }],
  6: [
    { move: "h5h7", reply: "g8f8" },
    { move: "h7f7" }
  ],
  7: [
    { move: "b1c3" },
    { move: "c3e4" },
    { move: "e4g5" }
  ],
  8: [{ move: "e5f7" }],
  9: [
    { move: "a1a8", reply: "g8f7" },
    { move: "a8h8", reply: "f7e6" },
    { move: "h8h7" }
  ]
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/start") {
        requireSecrets(env);
        const token = await signState({ p: 1, s: 0, exp: Date.now() + 86400000 }, env.SIGNING_KEY);
        return json({ token });
      }

      if (request.method === "POST" && url.pathname === "/move") {
        requireSecrets(env);
        const body = await request.json();
        const state = await verifyState(body.token, env.SIGNING_KEY);
        if (!state) return json({ error: "Session invalide ou expirée." }, 401);
        if (state.p > 9) return json({ error: "La partie est déjà terminée." }, 400);

        const expected = SOLUTIONS[state.p]?.[state.s];
        if (!expected) return json({ error: "État de partie invalide." }, 400);

        const move = String(body.move || "").toLowerCase().trim();
        if (move !== expected.move) {
          return json({ correct: false, message: "Ce n'est pas le bon coup. Observe encore l'échiquier." });
        }

        let nextPuzzle = state.p;
        let nextStep = state.s + 1;
        let puzzleComplete = false;

        if (nextStep >= SOLUTIONS[state.p].length) {
          puzzleComplete = true;
          nextPuzzle += 1;
          nextStep = 0;
        }

        const gameComplete = nextPuzzle === 10;
        const token = await signState({
          p: nextPuzzle,
          s: nextStep,
          exp: Date.now() + 86400000
        }, env.SIGNING_KEY);

        return json({
          correct: true,
          token,
          step: puzzleComplete ? SOLUTIONS[state.p].length : nextStep,
          puzzleComplete,
          gameComplete,
          opponentMove: expected.reply || null,
          message: puzzleComplete ? "Épreuve réussie." : "Bon coup. Continue."
        });
      }

      if (request.method === "POST" && url.pathname === "/mystery") {
        requireSecrets(env);
        const body = await request.json();
        const state = await verifyState(body.token, env.SIGNING_KEY);
        if (!state) return json({ error: "Session invalide ou expirée." }, 401);
        if (state.p !== 10) return json({ error: "Les neuf épreuves doivent être terminées." }, 403);
        return json({ word: env.MYSTERY_WORD });
      }

      return json({ error: "Route inconnue." }, 404);
    } catch (error) {
      return json({ error: "Erreur du serveur de jeu." }, 500);
    }
  }
};

function requireSecrets(env) {
  if (!env.SIGNING_KEY || !env.MYSTERY_WORD) {
    throw new Error("Secrets Cloudflare manquants");
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" }
  });
}

function base64UrlEncode(bytes) {
  let binary = "";
  bytes.forEach(byte => binary += String.fromCharCode(byte));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function getHmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signState(state, secret) {
  const payloadBytes = new TextEncoder().encode(JSON.stringify(state));
  const payload = base64UrlEncode(payloadBytes);
  const key = await getHmacKey(secret);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return `${payload}.${base64UrlEncode(signature)}`;
}

async function verifyState(token, secret) {
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".");
  const key = await getHmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecode(signature),
    new TextEncoder().encode(payload)
  );
  if (!valid) return null;
  const state = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
  if (!state.exp || Date.now() > state.exp) return null;
  return state;
}
