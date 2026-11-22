// Test bridge: runs the REAL src/intents of niara-exchange-engine (read-only)
// in a separate node process — Vite does not import UNC paths (\\wsl.localhost).
// Input (stdin): { orders: [{ intent, signature }], cancels: [{ cancel, signature }] }
// with the JSON bodies exactly as the site sends them. Output (stdout): for each
// one, the bytes/digest the engine rebuilds and whether the signature is accepted.
import { pathToFileURL } from "node:url";

const dir = process.env.NIARA_ENGINE_DIR;
if (!dir) throw new Error("NIARA_ENGINE_DIR not set");
const E = await import(pathToFileURL(`${dir}/src/intents/index.ts`).href);
const { CHAINS } = await import(pathToFileURL(`${dir}/src/chains.ts`).href);

let input = "";
for await (const chunk of process.stdin) input += chunk;
const { orders, cancels } = JSON.parse(input);
const hex = (b) => Buffer.from(b).toString("hex");

const out = { orders: [], cancels: [] };
for (const { intent, signature } of orders) {
  const parsed = E.parseOrderIntent(intent);
  const solana = CHAINS[parsed.chain].kind === "solana";
  out.orders.push({
    payload: solana ? hex(E.solanaIntentMessage(parsed)) : E.evmIntentDigest(parsed),
    valid: await E.verifyIntentSignature(parsed, signature),
  });
}
for (const { cancel, signature } of cancels) {
  const parsed = E.parseCancelIntent(cancel);
  const solana = CHAINS[parsed.chain].kind === "solana";
  out.cancels.push({
    payload: solana ? hex(E.solanaCancelMessage(parsed)) : E.evmCancelDigest(parsed),
    valid: await E.verifyCancelSignature(parsed, signature),
  });
}
process.stdout.write(JSON.stringify(out));
