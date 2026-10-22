import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";
import assert from "node:assert/strict";

const source = (await readFile(new URL("./service-worker.template.js", import.meta.url), "utf8"))
  .replace("__VERSION__", '"test"').replace("__PRECACHE__", JSON.stringify(["/", "/cifra/nivel/5/30", "/offline.html", "/_next/static/game.js"]));
function worker({ offline = false, failPath } = {}) {
  const handlers = {}, stores = new Map();
  const key = (url) => new URL(typeof url === "string" ? url : url.url, "https://cranea.test").href;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { put: async (url, response) => store.set(key(url), response), match: async (url) => store.get(key(url))?.clone() };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const state = { offline, claimed: false, skipped: false };
  vm.runInNewContext(source, {
    self: { location: { origin: "https://cranea.test" }, addEventListener: (name, fn) => { handlers[name] = fn; }, clients: { claim: async () => { state.claimed = true; } }, skipWaiting: () => { state.skipped = true; } },
    caches, Request, URL,
    fetch: async (request) => {
      if (state.offline) throw new Error("offline");
      const path = new URL(request.url).pathname;
      return new Response(`document:${path}`, { status: path === failPath ? 500 : 200, headers: { "Content-Type": "text/html" } });
    },
  });
  return { caches, state, handlers, run(name) { let promise; handlers[name]({ waitUntil(p) { promise = p; } }); return promise; }, request(path, { flight = false, method = "GET" } = {}) {
    let promise;
    handlers.fetch({ request: { url: new URL(path, "https://cranea.test").href, method, mode: "navigate", headers: new Headers(flight ? { RSC: "1" } : {}) }, respondWith(p) { promise = p; } });
    return promise;
  } };
}
test("an unvisited level, assets and unknown-route fallback work offline", async () => {
  const sw = worker(); await sw.run("install"); sw.state.offline = true;
  assert.equal(await (await sw.request("/cifra/nivel/5/30")).text(), "document:/cifra/nivel/5/30");
  assert.equal(await (await sw.request("/_next/static/game.js")).text(), "document:/_next/static/game.js");
  assert.equal(await (await sw.request("/unknown")).text(), "document:/offline.html");
  assert.equal((await sw.request("/cifra/nivel/5/30?_rsc=abc", { flight: true })).headers.get("Content-Type"), "text/html");
});
test("updates wait for consent and activation preserves unrelated storage", async () => {
  const sw = worker(); await sw.caches.open("other-app"); await sw.caches.open("cranea-old");
  await sw.run("install"); assert.equal(sw.state.skipped, false);
  sw.handlers.message({ data: { type: "SKIP_WAITING" } }); assert.equal(sw.state.skipped, true);
  await sw.run("activate");
  assert.deepEqual(await sw.caches.keys(), ["other-app", "cranea-test"]);
  assert.equal(sw.state.claimed, true);
});
test("a failed resource prevents installation", async () => {
  const sw = worker({ failPath: "/cifra/nivel/5/30" });
  await assert.rejects(sw.run("install"), /No se pudo guardar/);
  assert.equal(sw.state.claimed, false);
});
test("writes and cross-origin requests are not intercepted", () => {
  const sw = worker();
  assert.equal(sw.request("/", { method: "POST" }), undefined);
  assert.equal(sw.request("https://another.test/"), undefined);
});
