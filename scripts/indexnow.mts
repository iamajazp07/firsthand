/**
 * indexnow — tell Bing, Yandex and the other IndexNow engines about new URLs.
 *
 *   npm run indexnow            submit every URL in both sitemaps (one-off)
 *   import { submitUrls }       used by write-news after each run
 *
 * The key is public by design: IndexNow proves ownership by fetching
 * https://<host>/<key>.txt, which lives in public/ and is served on every host.
 * One request per host, because IndexNow rejects a urlList that mixes hosts.
 */

const KEY = "f42ab01cb7a026a312ecba64cc04972f";
const ENDPOINT = "https://api.indexnow.org/indexnow";
/** IndexNow accepts up to 10,000 URLs per request. */
const MAX_PER_REQUEST = 10000;

export const SITEMAPS = [
  "https://readfirsthand.com/sitemap.xml",
  "https://health.readfirsthand.com/sitemap.xml",
];

/** Submit URLs, grouped by host. Never throws: a failed ping must not fail the caller. */
export async function submitUrls(urls: string[]): Promise<string[]> {
  const byHost = new Map<string, string[]>();
  for (const u of urls) {
    const host = new URL(u).host;
    byHost.set(host, [...(byHost.get(host) ?? []), u]);
  }

  const results: string[] = [];
  for (const [host, list] of byHost) {
    for (let i = 0; i < list.length; i += MAX_PER_REQUEST) {
      const urlList = list.slice(i, i + MAX_PER_REQUEST);
      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host,
            key: KEY,
            keyLocation: `https://${host}/${KEY}.txt`,
            urlList,
          }),
        });
        results.push(`${host}: ${urlList.length} URLs, HTTP ${res.status}`);
      } catch (e) {
        results.push(`${host}: ${urlList.length} URLs, failed (${(e as Error).message})`);
      }
    }
  }
  return results;
}

async function main(): Promise<void> {
  const urls: string[] = [];
  for (const sm of SITEMAPS) {
    const xml = await (await fetch(sm)).text();
    urls.push(...[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
  }
  console.log(`indexnow: ${urls.length} URLs from ${SITEMAPS.length} sitemaps`);
  for (const line of await submitUrls(urls)) console.log(`  ${line}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error("indexnow failed:", (err as Error).message);
    process.exit(1);
  });
}
