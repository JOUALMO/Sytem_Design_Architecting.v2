import type { ArchitectureFinding, SourceEvidence } from '../domain'

type InputFile = { path: string; text: string; hash: string; elementId: string }
type Rule = {
  id: string
  title: string
  category: ArchitectureFinding['category']
  severity: ArchitectureFinding['severity']
  confidence: ArchitectureFinding['confidence']
  description: string
  recommendation: string
  match: RegExp
  excludeLine?: RegExp
  when?: (text: string) => boolean
}

const rules: Rule[] = [
  {
    id: 'mongoose.query-without-lean', title: 'Mongoose read may hydrate full documents', category: 'database', severity: 'low', confidence: 'medium',
    description: 'A Mongoose read query appears without a nearby lean() call. Hydrated documents can add CPU and memory overhead on read-heavy paths; this is a review prompt, not proof that hydration is unnecessary.',
    recommendation: 'Check whether the caller needs document methods, getters, or change tracking. Consider lean() for read-only response paths and measure before changing behavior.',
    match: /\.(?:find|findOne|findById)\s*\(/, when: (text) => /(?:from\s*['"]mongoose['"]|require\s*\(\s*['"]mongoose['"]\s*\)|\bmongoose\.(?:model|connect)|\bnew\s+Schema\b)/.test(text),
  },
  {
    id: 'mongoose.timestamps-disabled', title: 'Mongoose schema disables timestamps', category: 'database', severity: 'info', confidence: 'high',
    description: 'A schema explicitly disables automatic createdAt/updatedAt fields. This may be intentional, but it affects audit and freshness strategies that depend on update times.',
    recommendation: 'Confirm that another reliable source records update time if cache freshness, sync cursors, or audit views depend on it.',
    match: /timestamps\s*:\s*false/,
  },
  {
    id: 'redis.write-without-ttl', title: 'Redis write has no visible expiry', category: 'cache', severity: 'medium', confidence: 'low',
    description: 'A Redis SET-like call appears without an expiry option on the same statement. Persistent keys may be deliberate; unbounded cache keys can accumulate or serve stale data.',
    recommendation: 'Confirm whether this key is cache data or durable coordination state. If it is cache data, define a TTL and document the freshness policy.',
    match: /\.(?:set|setex|setEx)\s*\(/, excludeLine: /\b(?:setex|setEx)\s*\(|\b(?:EX|PX|EXAT|PXAT)\s*[:,]|['"](?:EX|PX|EXAT|PXAT)['"]\s*,/i, when: (text) => /(?:from\s*['"](?:redis|ioredis|@upstash\/redis)['"]|require\s*\(\s*['"](?:redis|ioredis|@upstash\/redis)['"]\s*\)|\bredis\.(?:get|set|del|expire)|\bcreateClient\s*\()/.test(text),
  },
  {
    id: 'redis.write-without-invalidation', title: 'Redis cache write has no visible invalidation', category: 'cache', severity: 'medium', confidence: 'low',
    description: 'This file writes Redis keys and also contains a database mutation, but no delete/expire/invalidation call was found in the file. Cross-file invalidation and versioned keys are not inferred.',
    recommendation: 'Trace the write path and its corresponding read keys. Verify invalidation, versioning, or a bounded TTL after successful database writes.',
    match: /\.(?:set|setex|setEx)\s*\(/, when: (text) => /\.(?:save|create|insertMany|updateOne|updateMany|findOneAndUpdate|deleteOne|deleteMany|findOneAndDelete)\s*\(/.test(text) && !/\.(?:del|unlink|expire|expireAt|invalidate)\s*\(/.test(text),
  },
  {
    id: 'redux-toolkit.slice-ownership', title: 'Redux Toolkit state slice detected', category: 'client-state', severity: 'info', confidence: 'high',
    description: 'A Redux Toolkit slice is declared here. Static source inspection cannot establish whether its state is shared, persisted, or reconstructed after reload.',
    recommendation: 'Review which flows own this state and whether it should survive route changes, refreshes, or offline periods. Record the intended persistence and reset behavior.',
    match: /createSlice\s*\(/,
  },
  {
    id: 'rtk-query-mutation-without-tags', title: 'RTK Query mutation has no visible tag invalidation', category: 'client-state', severity: 'medium', confidence: 'medium',
    description: 'An RTK Query API slice declares a mutation but no invalidatesTags in the file. Cached query data may remain stale after writes unless another refresh strategy is used.',
    recommendation: 'Trace the affected query endpoints and add matching invalidatesTags, updateQueryData, or an explicit refresh path where needed.',
    match: /builder\.mutation\s*</, when: (text) => /createApi\s*\(/.test(text) && !/invalidatesTags\s*:/.test(text),
  },
  {
    id: 'rtk-query-query-without-provides-tags', title: 'RTK Query endpoint has no visible cache tags', category: 'client-state', severity: 'low', confidence: 'low',
    description: 'An RTK Query API slice declares a query endpoint without providesTags in the file. Automatic cache invalidation may therefore not connect it to mutations.',
    recommendation: 'Check whether a mutation can make this query stale. Use a shared tag contract or document the deliberate manual refresh behavior.',
    match: /builder\.query\s*</, when: (text) => /createApi\s*\(/.test(text) && !/providesTags\s*:/.test(text),
  },
  {
    id: 'indexeddb.open-without-upgrade-handler', title: 'IndexedDB open has no visible schema upgrade handler', category: 'offline-storage', severity: 'medium', confidence: 'low',
    description: 'indexedDB.open() is used, but this file contains no onupgradeneeded handler. The handler may live in another module or a wrapper.',
    recommendation: 'Trace database creation and version changes. Confirm object stores and indexes are migrated in onupgradeneeded or an equivalent wrapper.',
    match: /indexedDB\.open\s*\(/i, when: (text) => !/onupgradeneeded/i.test(text),
  },
  {
    id: 'browser-storage-sensitive-key', title: 'Browser storage uses a sensitive-looking key', category: 'browser-storage', severity: 'high', confidence: 'medium',
    description: 'A localStorage/sessionStorage access uses a key containing a token, password, or secret marker. Browser storage is available to injected same-origin scripts.',
    recommendation: 'Verify the stored value and threat model. Avoid persisting credentials or long-lived secrets in Web Storage; prefer a server-managed secure session or a platform-appropriate credential design.',
    match: /(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|getItem)\s*\(\s*['"`][^'"`]*(?:token|password|secret|credential)[^'"`]*/i,
  },
  {
    id: 'browser-storage-sync-write', title: 'Synchronous Web Storage write is present', category: 'browser-storage', severity: 'info', confidence: 'high',
    description: 'localStorage or sessionStorage writes synchronously on the calling thread. Large values or frequent writes can block UI work and are not available to server-side code.',
    recommendation: 'Check payload size and write frequency. Use IndexedDB for larger or asynchronous offline data, and keep server/client boundaries explicit.',
    match: /(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|removeItem|clear)\s*\(/,
  },
  {
    id: 'offline-state-no-persistent-queue', title: 'Offline event handling has no visible persistent queue', category: 'offline-storage', severity: 'low', confidence: 'low',
    description: 'The file handles online/offline browser events but has no IndexedDB reference. In-memory retries may be lost on reload; queue logic may exist elsewhere.',
    recommendation: 'Trace offline writes and reload behavior. If user changes must survive closure, verify they enter a durable queue and are replayed idempotently.',
    match: /addEventListener\s*\(\s*['"](?:online|offline)['"]|navigator\.onLine/,
    when: (text) => !/indexedDB|idb\b|Dexie/i.test(text),
  },
]

export function analyzeStack(files: InputFile[]): ArchitectureFinding[] {
  const findings: ArchitectureFinding[] = []
  for (const file of files) {
    const lines = file.text.split(/\r?\n/)
    for (const rule of rules) {
      if (rule.when && !rule.when(file.text)) continue
      const matchingLines: number[] = []
      for (let index = 0; index < lines.length && matchingLines.length < 20; index++) {
        rule.match.lastIndex = 0
        if (rule.match.test(lines[index]) && !(rule.excludeLine?.test(lines[index]) ?? false)) matchingLines.push(index + 1)
      }
      if (!matchingLines.length) continue
      const evidence: SourceEvidence[] = matchingLines.slice(0, 8).map((line) => ({
        path: file.path, startLine: line, contentHash: file.hash, analyzer: 'stack-review-v1', rule: rule.id,
        summary: `${rule.title} pattern matched in the selected local source.`,
      }))
      findings.push({
        id: `finding:${rule.id}:${file.path}`,
        ruleId: rule.id,
        title: rule.title,
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        description: rule.description,
        recommendation: rule.recommendation,
        status: 'open',
        evidence,
        elementIds: [file.elementId],
      })
    }
  }
  return findings.slice(0, 25_000)
}
