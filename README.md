# HappyRobot — Inbound Carrier Sales Backend

A Spring Boot service that powers an **inbound carrier-sales** workflow for a freight brokerage. When a carrier calls in, a voice agent uses this backend to (1) verify the carrier against FMCSA, (2) search the load board for matching freight, (3) record the call and the rate negotiation, and (4) surface the whole thing on an operations dashboard.

The repository also bundles a React frontend (`frontend/`) that is compiled and served from the same jar (`classpath:/static/`), so a single artifact serves both the API and the UI.

> ⚠️ **This is a demo server.** It is built to be self-contained and reproducible for an interview/evaluation, not to run in production. The most important consequence of that is the search layer: load data is indexed into an **in-memory Apache Lucene index that is built once at startup and never mutated**. See [Search](#load-search-apache-lucene) for what that means and what you would swap it for in production.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Running it](#running-it)
- [Platform libraries (Passport & Commons)](#platform-libraries-passport--commons)
  - [Passport — authentication & authorization](#passport--authentication--authorization)
  - [Local mode (how this app authenticates)](#local-mode-how-this-app-authenticates)
  - [Logging — audit, request & service logs](#logging--audit-request--service-logs)
  - [Safe vs unsafe log parameters](#safe-vs-unsafe-log-parameters)
- [Data model](#data-model)
- [Seed / demo data](#seed--demo-data)
- [Load search (Apache Lucene)](#load-search-apache-lucene)
  - [Why Lucene, and why it must be swapped in production](#why-lucene-and-why-it-must-be-swapped-in-production)
  - [Building the index](#building-the-index)
  - [The query model](#the-query-model)
  - [Translating the query to Lucene](#translating-the-query-to-lucene)
  - [Executing a search](#executing-a-search)
- [FMCSA carrier verification](#fmcsa-carrier-verification)
- [Calls & negotiations](#calls--negotiations)
- [Metrics](#metrics)
- [API reference](#api-reference)
- [Build, run & deploy](#build-run--deploy)

---

## Tech stack

| Concern | Choice |
|---|---|
| Language / runtime | Java 17 |
| Framework | Spring Boot 3.5.x (web, data-jpa, data-jdbc, data-rest, session) |
| Search | Apache Lucene 8.9.0 (core, analyzers-common, queryparser) — **embedded, in-memory** |
| Persistence | Spring Data JPA over an **in-memory H2** database |
| Auth | Blue Orange `passport-mono-sdk` (Bearer token) |
| Build | Gradle (also builds the React frontend and bundles it into the jar) |
| Container | `Dockerfile` + `./gradlew dockerBuildImage` |

The application listens on **port 9876** by default (`server.port` in `application.yml`).

Two Blue Orange artifacts (`commons`, `passport-mono-sdk`) are vendored into `blue_orange_dependencies/` as a local Maven repo so the project builds in CI without private-registry credentials.

---

## Running it

```bash
# API + bundled frontend
./gradlew bootRun
# → http://localhost:9876

# Build a runnable jar (compiles the React frontend into static/ too)
./gradlew bootJar

# Build a Docker image
./gradlew dockerBuildImage   # happyrobot:<version> and happyrobot:latest
```

Health is exposed at `GET /actuator/health`. The health aggregate stays out of `UP` (returning **503**) while the Lucene index is still warming up — see [Building the index](#building-the-index).

### Notable configuration (`application.yml`)

| Property / env var | Default | Purpose |
|---|---|---|
| `server.port` | `9876` | HTTP port |
| `application.fde-interview.load-data` | `classpath:data/dummy_load_data.json` | Source of the 1,000 demo loads |
| `FMCSA_STATE` | `live` | `live` calls the real FMCSA API; `mock` serves bundled carriers, no network |
| `FMCSA_BASE_URL` | `https://mobile.fmcsa.dot.gov/qc/services` | FMCSA QCMobile base URL |
| `FMCSA_WEB_KEY` | *(demo key)* | FMCSA API key, appended as `webKey` |
| `FMCSA_MOCK_DATA` | `classpath:data/mock_carriers.json` | Carriers served in `mock` state |

---

## Platform libraries (Passport & Commons)

This service builds on two first-party Blue Orange libraries that ship as the only non-Spring, non-Lucene dependencies. They are vendored into `blue_orange_dependencies/` (a local Maven repo) so the project builds in CI without GitHub Packages credentials:

| Artifact | Role |
|---|---|
| `com.blueorange:passport-mono-sdk:0.0.5` | Authentication & authorization — the `@Authentication` guard and the `PassportUtility` client |
| `com.blueorange:commons:0.0.67` | Cross-cutting platform plumbing — structured logging (`OrangeLogger`), audit & request log streams, CORS, global exception handling |

### Passport — authentication & authorization

[Passport](https://maven.pkg.github.com/Blue-Orange-Ai/passport-mono) is Blue Orange's centralized identity service: JWT-based token management, users, groups with fine-grained permissions (`READ` / `READ_WRITE` / `ADMIN`), and service accounts for service-to-service traffic. The Spring Boot service normally runs standalone (backed by PostgreSQL) and microservices talk to it over HTTP.

This backend doesn't talk to a Passport server directly — it embeds the **`passport-mono-sdk`** client library. The SDK exposes Spring-friendly beans behind `PassportUtility.passport()` and a declarative guard:

- **`@Authentication`** annotates a controller (or method). A Spring AOP aspect (`AuthenticationAspect`) intercepts the call, reads the `Authorization` header, validates the token against the active Passport implementation, and rejects unauthenticated callers with `401`. The annotation optionally takes `groups = {...}` to require group membership; our endpoints use the bare `@Authentication()`, so any valid token is accepted. Tokens work **with or without** the `Bearer ` prefix.
- The SDK has three interchangeable implementations selected by **`passport.state`**:

  | State | Behaviour |
  |---|---|
  | `prod` (default) | HTTP client against a running Passport server |
  | `mock` | Canned responses, no server — for unit tests |
  | `local` | In-memory users/groups loaded from `application.yml` — no server |

### Local mode (how this app authenticates)

This demo runs in **`local`** state, so **no Passport server is required** — every `validate` call is served from an in-memory store built from `application.yml` at boot. The relevant config:

```yaml
passport:
  state: local
  local:
    groups:
      - name: admin
      - name: users
    users:
      - id: user-1
        username: happyrobot
        password: 8e23d94d-856e-4f21-8141-9ffc6d8e7e9f
        name: Happy Robot
        email: tom@blueorange.ai
        domain: Internal
        groups: [admin, users]
        tokens:
          - 9ccd158d-9f50-4ea7-8ede-95ffe1746833   # pre-shared token
```

The `tokens` list holds **pre-shared tokens that behave like service tokens** — they are accepted by every `validate` call without a login round-trip. So every request to this API just carries that static token:

```
Authorization: Bearer 9ccd158d-9f50-4ea7-8ede-95ffe1746833
# the "Bearer " prefix is optional — the raw token also works
```

Groups referenced by a user but not declared are auto-created; `password` is only needed if you call `login()`. Two helpers on `PassportUtility` are **legal only in local mode** (they throw `LocalModeOnlyException` under `prod`/`mock`): `login(UserLoginRequest)` for username/password auth against the in-memory store, and `createBearerToken(...)` to mint a fresh in-memory token for a local user.

All controllers also carry `@CrossOrigin` so the browser frontend can call them.

### Logging — audit, request & service logs

The `commons` library replaces ad-hoc `slf4j` calls with `OrangeLogger` and ships **three independent, structured-JSON log streams**, each with its own logback appender, rolling daily and gzip-compressed, size- and history-bounded. All three render through a custom Logstash encoder (`SimpleJsonLoggingEventCompositeEncoder`) and stamp every record with an ISO timestamp (`yyyy-MM-dd'T'HH:mm:ss.SSSSSSXXX`):

| Stream | Logger name | File | Written by | Carries |
|---|---|---|---|---|
| **Service log** | `ROOT` (+ console) | `service.log` → `service.%d{yyyy-MM-dd}.%i.log.gz` | `OrangeLogger` | The application's own trace/debug/info/warn/error lines |
| **Request log** | `requests` | `requests.log` → `requests.%d{…}.log.gz` | `RequestLoggingFilter` + `LoggingInterceptor` | One record per HTTP request: `timestamp, userId, traceId, endpoint, method, statusCode, headers, payload, duration` (ms) |
| **Audit log** | `audit` | `audit.log` → `audit.%d{…}.log.gz` | `AuditLogger` | Business-event records: `timestamp, userId, type, data` |

- **Service log** is what the application code writes. Every class in this codebase declares `private static final OrangeLogger logger = new OrangeLogger(MyClass.class)` and logs through it (`logger.info(...)`, `logger.error(throwable, ...)`, etc.). `OrangeLogger` supports the five levels, each with an optional leading `Throwable`, and uses `{}` placeholders filled by `LogParameter` varargs (see below). It also goes to the console appender for local dev.
- **Request log** is populated automatically — a servlet `Filter` (`RequestLoggingFilter`) wraps each request/response and a `HandlerInterceptor` (`LoggingInterceptor`) times it, then `RequestLogger` emits a single JSON line under the `requests` logger. Nothing in the application code has to call it.
- **Audit log** records security/business-significant mutations via `AuditLogger.log(userId, AuditLogType, data)`. `AuditLogType` enumerates the audited actions:

  ```
  OBJECT_LOAD, OBJECT_EDIT, OBJECT_DELETE, OBJECT_CREATE, OBJECT_PERMISSION_CHANGE,
  USER_CREATE, USER_MODIFIED, USER_DELETE
  ```

### Safe vs unsafe log parameters

`OrangeLogger` never takes bare values — every interpolated argument is wrapped as a `LogParameter`, of which there are two kinds (both expose `getValue()` and `isSafe()`):

| Wrapper | `isSafe()` | Intended for |
|---|---|---|
| `SafeLogParam.of(x)` | `true` | Non-sensitive values fine to appear verbatim in logs — ids, counts, durations, locations |
| `UnSafeLogParam.of(x)` | `false` | Sensitive values that must not leak into the readable message — PII, secrets, raw payloads |

For each log call `OrangeLogger` produces **three views of the same line**, so a downstream pipeline can decide how much to expose:

1. **The formatted message** (what `slf4j` logs): `{}` placeholders filled with the real serialized value of *every* parameter.
2. **`safeMessage`** (put on the SLF4J **MDC**): the same message, but every `UnSafeLogParam` is masked as `{}` — `SafeLogParam` values are still shown in place.
3. **`unsafeParams`** (also on the MDC): a serialized JSON array of just the unsafe values, isolated as a separate field.

This separation lets a log aggregator forward the sanitized `safeMessage` and treat the `unsafeParams` field as separately governed (redact it, encrypt it, restrict access, or route it to a secure sink) without losing the readable structure of the line. Throughout this codebase **every** parameter is wrapped with `SafeLogParam.of(...)` — load ids, document counts, search durations, carrier MC numbers, etc. — because none of the logged values are sensitive; `UnSafeLogParam` is available for when they would be.

---

## Data model

There are two persisted JPA entities and one search-only POJO.

### `InboundCall` (JPA, `@Entity`, `@UuidGenerator` id)
One row per carrier phone call.

| Field | Type | Meaning |
|---|---|---|
| `id` | String | Server-generated UUID |
| `started` / `ended` | Date | Call start/end timestamps |
| `sentiment` | Boolean | Carrier sentiment (positive = `true`) |
| `carrierId` | String | Carrier identifier |
| `carrierLocation` | String | e.g. `"Salt Lake City, UT"` |
| `carrierEquipment` | String | Flatbed / Dry Van / Reefer / Step Deck / Power Only |
| `booked` | Boolean | Did the call result in a booked load? |
| `amount` | Double | Agreed rate (null when not booked) |
| `loadId` | String | The load that was discussed/booked |
| `backAndForths` | Integer | Number of negotiation exchanges (0–3) |

### `Negotiation` (JPA, `@Entity`, `@UuidGenerator` id)
One row per negotiation **round**; a call can have several. Linked to its call by `inBoundCallId` (a plain foreign-key string — the relationship is unidirectional one-call-to-many-rounds, not a JPA association).

| Field | Type | Meaning |
|---|---|---|
| `id` | String | Server-generated UUID |
| `inBoundCallId` | String | FK → `InboundCall.id` |
| `proposedOffer` | Double | What the broker proposed |
| `counter` | Double | The carrier's counter |
| `accepted` | Boolean | Was this round accepted? |
| `acceptedAmount` | Double | Final agreed amount (null if the round was rejected) |

### `Load` (plain POJO — **not** persisted in the DB; lives only in the Lucene index)

| Field | Type |
|---|---|
| `loadId` | String |
| `startingLocation` / `deliveryLocation` | String |
| `pickupDateTime` / `deliveryDateTime` | Date |
| `equipmentType` | String |
| `loadboardRate` | Double |
| `weight` | Double |
| `miles` | Double |
| `numOfPieces` | Integer |
| `commodityType` | List\<String> |
| `notes` | String |
| `dimensions` | `Dimension { height, width, length }` (Integers) |

---

## Seed / demo data

So the dashboard and search look realistic on a fresh boot, the app seeds itself from JSON bundled on the classpath (`src/main/resources/data/`).

### Loads — `dummy_load_data.json`
**1,000 loads.** These are never written to the database; they are read once and indexed into Lucene (see below).

### Calls & negotiations — `seed_calls.json` + `seed_negotiations.json`
`DataSeeder` is a `@Component` that runs on `ApplicationReadyEvent` (after the context is up). It is **idempotent**: if any call already exists it logs *"Call data already present; skipping demo seed"* and returns — so a persistent datastore wouldn't be re-seeded, while the default in-memory H2 gets a fresh seed every run. Seeding is **best-effort**: any exception is caught and logged so a bad seed file can never stop the app from serving.

- **351 inbound calls** (`seed_calls.json`).
- **344 negotiation rounds** (`seed_negotiations.json`), some calls carrying multiple rounds.

Timestamps are stored **relative to "now"**, not as absolute dates, so the data always looks recent:
- Each seed carries `daysAgo` (clamped 1–60), `hour` (0–23), `minute` (0–59) and `durationSeconds`.
- `started = today − daysAgo at hour:minute` (defensively pushed into the past if it lands in the future); `ended = started + durationSeconds` (capped at now).
- `MAX_DAYS_AGO = 60`, so the dashboard always has ~2 months of history.

Calls and negotiations are linked by a **seed-only `callRef`** key, not by the persisted UUID. At load time every call's `ref` (e.g. `"C0015"`) is mapped to its freshly generated UUID; each negotiation's `callRef` is resolved against that map. Negotiations whose `callRef` matches no call are skipped and counted as "unlinked."

The seeded distribution is deliberately lifelike (≈69% positive sentiment, ≈57% booked, booked amounts roughly \$685–\$3,100, equipment and locations spread across major US freight hubs).

---

## Load search (Apache Lucene)

Load search is the heart of the backend, implemented in `LoadSearchService` plus a small query DSL under `entities/search/`.

### Why Lucene, and why it must be swapped in production

The 1,000 demo loads are indexed into an **embedded, in-memory Lucene index** (`ByteBuffersDirectory`) that is built **once at application startup and then treated as immutable** — there is no add/update/delete path, no `IndexWriter` kept open, and the directory lives only in the JVM heap.

That is a great fit for a demo (zero infrastructure, fast, reproducible, no external service to stand up) but it is **the wrong choice for production**, because:

- **It's immutable.** New or changed loads can't be added without rebuilding the entire index from scratch and restarting. A real load board changes constantly.
- **It's in-memory and single-node.** The index is lost on restart and can't be shared, replicated, or scaled horizontally. It's bounded by one JVM's heap.
- **No durability, sharding, or HA.** There's no persistence, failover, or distribution story.

**In production you would replace this layer with a system like Elasticsearch / OpenSearch** (or another managed search engine). Those are built on the same Lucene primitives but add a mutable, durable, clustered, horizontally-scalable index with near-real-time updates, replication, and an operational API. The query DSL in this project (`Query`, `QueryCondition`, …) was deliberately modeled to resemble such an engine's structured query API, so the controller/service contract could stay largely the same while the index implementation is swapped out underneath.

### Building the index

`LoadSearchService` builds the index asynchronously so it never blocks startup:

1. On `ApplicationReadyEvent`, a daemon thread (`load-index-builder`) is started.
2. It reads `dummy_load_data.json` into `List<Load>`, opens an `IndexWriter` (`OpenMode.CREATE`) over the in-memory `ByteBuffersDirectory` with a `StandardAnalyzer`, writes one document per load, and `commit()`s.
3. `ready` flips to `true` and `documentsIndexed` records the count.

Until that commit lands, `isReady()` returns `false`, searches return an `ERROR` `QueryResponse` ("Search index is not ready yet"), and the actuator health aggregate reports `STARTING → 503`. On shutdown (`@PreDestroy`) the directory and analyzer are closed.

**How each field is indexed** (`toDocument`) — the index is designed so a hit can both be *matched* and *fully reconstructed*:

| Load field(s) | Lucene representation | Why |
|---|---|---|
| `loadId` | `StringField` (keyword, stored) | Exact-match lookup, stored for reconstruction |
| `startingLocation`, `deliveryLocation`, `equipmentType`, `notes`, `commodityType` | `TextField` (analysed, stored) | Free-text matching; `commodityType` is multi-valued |
| `loadboardRate`, `weight`, `miles` | `DoublePoint` + `StoredField` | Range queries + reconstruction |
| `numOfPieces`, `dimHeight/Width/Length` | `IntPoint` + `StoredField` | Range queries + reconstruction |
| `pickupDateTime`, `deliveryDateTime` | `LongPoint` (epoch millis) + `StoredField` | Date-range queries |

Fields flagged **sortable** in the `LoadField` schema additionally get **doc-values** (`SortedDocValuesField` / `NumericDocValuesField` / `DoubleDocValuesField`) so Lucene can sort on them. Multi-valued `commodityType` and `notes` are not sortable and so get no doc-values.

The `LoadField` enum is the single source of truth for the schema — each entry records the Lucene field name, its `FieldType` (`KEYWORD`, `TEXT`, `DOUBLE`, `INT`, `DATE`) and whether it is `sortable`. The translator validates every queried/sorted field against it.

### The query model

There are two ways to search; both end up as a `Query` object.

**1. `LoadSearchCriteria` — the flat, query-string-friendly form** (used by `GET /loads/find`, e.g. from a voice agent that can't build a tree). Plain query params — `origin`, `destination`, `equipmentType`, `commodity`, `referenceNumber`, `minRate/maxRate`, `minWeight/maxWeight`, `maxMiles`, `page`, `size`, `sortBy`, `sortDir` — are combined with **AND** into a `Query`. `referenceNumber` becomes a case-insensitive wildcard on `loadId` (digits extracted, e.g. `LD-100003` → `*100003*`). Defaults: `size=3`, `sortBy=loadboardRate`, `sortDir=DESC`.

**2. `Query` — the structured, composable form** (used by `POST /loads/search`). It is a tree:

- **`Query`** = `rootCondition` (a `QueryComponent`) + `sortConditions` + `page` (default 0) + `size` (default 10) + `minimumShouldMatch` (default 1). A null root matches everything.
- **`QueryCompositeCondition`** (an internal node) = a `QueryOperand` (`AND` / `OR` / `NOT`) over a list of child `QueryComponent`s — so you can express `(A AND B) OR (C AND NOT D)`.
- **`QueryCondition`** (a leaf) wraps exactly one of four concrete conditions:

| Leaf condition | Fields | Matches |
|---|---|---|
| `QueryFullTextCondition` | `query`, `fields[]`, `fuzziness` | Lucene query-parser text over one or more fields (defaults to `startingLocation, deliveryLocation, equipmentType, commodityType, notes`) |
| `QueryTermCondition` | `field`, `query`, `type`, `caseInsensitive`, `boost`, `maxEdits` | A single-field term match; `type` ∈ `PHRASE`, `PHRASE_PREFIX`, `FUZZY`, `REGEX`, `WILDCARD` |
| `QueryNumericCondition` | `field`, `gte`, `gt`, `lte`, `lt` | Numeric range (inclusive/exclusive bounds) |
| `QueryDateCondition` | `field`, `gte`, `gt`, `lte`, `lt` (ISO-8601 / `yyyy-MM-dd`) | Date range over epoch-millis |

Sorting is a list of `SortCondition { field, direction }` where `direction` ∈ `ASC`/`DESC`. `field` may be a sortable `LoadField` or the special `_score` (relevance).

### Translating the query to Lucene

`LuceneQueryTranslator` walks the `Query` tree and produces a Lucene `Query` + `Sort`:

- **Composites** become a `BooleanQuery`: `AND`→`MUST`, `OR`→`SHOULD` (with `minimumShouldMatch` clamped to `[1, #children]`), `NOT`→a match-all `MUST` plus each child as `MUST_NOT`. An empty composite → `MatchAllDocsQuery`.
- **Full text** is escaped, optionally fuzzed (each token gets `~`/`~N`), then parsed by a `MultiFieldQueryParser` over the requested fields.
- **Term** conditions normalise case (lowercased for TEXT fields or when `caseInsensitive`) and map by `type`: `PHRASE`→`PhraseQuery`, `PHRASE_PREFIX`→`SpanNearQuery` (prefix on the final token), `FUZZY`→`FuzzyQuery` (optional `maxEdits`), `REGEX`→`RegexpQuery`, `WILDCARD`→`WildcardQuery`. An optional `boost` wraps the result in a `BoostQuery`.
- **Numeric** ranges become `DoublePoint`/`IntPoint` `newRangeQuery`, with exclusive bounds nudged via `Math.nextUp`/`nextDown` (doubles) or `±1` (ints); an inverted range → `MatchNoDocsQuery`.
- **Date** ranges parse each bound to epoch-millis and become a `LongPoint.newRangeQuery`.
- **Sort** maps each `SortCondition` to a typed `SortField` (validated as sortable), with `_score` handled specially, and always appends relevance (`FIELD_SCORE`) as the final tie-breaker. No sort conditions → null → Lucene's default relevance order.

### Executing a search

`LoadSearchService.search(Query)`:

1. If the index isn't ready → `QueryResponse.error(...)`.
2. Open a `DirectoryReader` / `IndexSearcher`, translate the query, `count()` total matches.
3. Fetch enough top hits to cover the requested page (`(page+1)*size`), then slice out the page, reconstructing each `Load` from the stored fields.
4. Return a **`QueryResponse`**: `state` (`SUCCESS`/`ERROR`), `error`, `count` (total matches), echoed `page`/`size`, `searchDuration` (ms), and `results` (the page of loads).

A malformed query (unknown field, bad date, …) is treated as a *client* error and returned as an `ERROR` response rather than thrown. `findById(loadId)` does a single-doc `TermQuery` lookup — used by the metrics layer to resolve a booked load's weight.

---

## FMCSA carrier verification

`FmcsaService` is a client for the **FMCSA QCMobile API** (the public US DOT registry of motor carriers). It gates the inbound flow: before pitching loads, the agent confirms the caller is a real, authorized carrier.

- **Live vs mock.** `FMCSA_STATE=live` (default) calls the real API, appending the `webKey` to every request. `FMCSA_STATE=mock` serves a bundled set of carriers from `mock_carriers.json` and never touches the network — useful offline or when `mobile.fmcsa.dot.gov` WAF-blocks the host's IP. The active mode is logged at startup.
- **The eligibility gate** is `validateCarrier(mcNumber)`, backing `GET /carriers/validate`. It normalises the input to digits (`MC-44110` → `44110`), looks the carrier up, and returns a `CarrierValidationResponse { mcNumber, eligible, reason, carrier }`. A carrier is **eligible only if it is found and `allowedToOperate == "Y"`**. `reason` is a human-readable line the agent can read back, e.g. *"ACME TRUCKING LLC (USDOT 3537472) is authorized to operate"* or *"No carrier was found for MC number MC-44110."*
- Supporting lookups exist for USDOT number, docket number (which can map to multiple carriers), and name search. All lookups are **best-effort** — a missing carrier or a failed request yields an empty result rather than an exception, so callers treat "not found" and "unavailable" uniformly.

---

## Calls & negotiations

`CallService` is a thin, id-checked CRUD layer over the two JPA repositories (`InboundCallRepository`, `NegotiationRepository` — both plain `CrudRepository<T, String>`):

- **Create** always nulls any client-supplied id; ids are generated server-side (`@UuidGenerator`).
- **Update** returns `Optional.empty()` when the id doesn't exist (so the controller answers `404` instead of silently inserting).
- **Delete** returns `false` when the id doesn't exist.

The voice agent writes `InboundCall`s and `Negotiation`s through `CallController` (`/api/v1/calls`, `/api/v1/negotiations`) as a call progresses; the metrics layer reads them back.

---

## Metrics

`MetricsService` builds the dashboard from the persisted call history. Every endpoint is scoped by a **`TimeRange`** (calls filtered by their `started` timestamp).

### Time scoping (`TimeRange.resolve`)
All metrics endpoints accept either:
- `range` — a preset rolling window ending now: `30m, 1h, 6h, 12h, 1d, 7d, 30d, 1y, all` (takes precedence if given), or
- `from` / `to` — a custom window; each parsed as an ISO-8601 instant, a `yyyy-MM-dd` date (a `to` date includes the whole named day), or epoch millis.

An unknown preset, an unparseable timestamp, or `from > to` → `400 BAD REQUEST`. No params → full history.

### Summary KPIs (`GET /metrics/summary` → `MetricsSummary`)
Computed in a single pass over the in-range calls. Any average is returned as **`null` (omitted from JSON via `@JsonInclude(NON_NULL)`) when there is no data — never `0`**.

| KPI | Definition |
|---|---|
| `totalCalls` | All in-range calls |
| `completedBookings` | `booked == true` |
| `failedBookings` | `booked != true` |
| `averageSentiment` | Mean sentiment in `[0,1]` (positive = 1) |
| `averageBookingWeight` | Mean weight (lbs) of the loads behind booked calls — resolved from the Lucene index by `loadId`, cached per request |
| `averageCost` | Mean agreed `amount` of booked calls |
| `totalEarnings` | Sum of agreed `amount` across booked calls (2 dp) |
| `averageCallDurationSeconds` | Mean `ended − started` |

### Time-series charts
Buckets **adapt to the window width**: `MINUTE` (≤ 2h), `HOUR` (≤ 48h), `DAY` (≤ ~3 months), `MONTH` (beyond, and for unbounded ranges). The axis is pre-built and **zero-filled** so lines never break.

- `GET /metrics/bookings/timeline` → `ChartData` with two line series: **Completed** (green) vs **Failed** (red) bookings per bucket.
- `GET /metrics/earnings/timeline` → `ChartData` with one bar series: summed agreed **earnings** per bucket (booked calls only, 2 dp).

### Location suggestions (`GET /metrics/suggestions` → `SuggestionsResponse`)
Aggregates in-range calls by `carrierLocation` (blank → "Unknown"):
- `failedCallsByLocation` — bar chart, top 10 locations by failed-call count.
- `weightByLocation` — bar chart, top 10 locations by average load weight.
- `locationClusters` — scatter of `(avg_weight, failed_count)` per location, so heavy-and-failing lanes stand out.
- `insights` — plain-language takeaways (e.g. *"Location X has the most failed bookings (N). Review pricing or load fit for that lane."*), always at least one line.

Charts serialize as `ChartData { labels[], dataset[] }`, where each `ChartDataset` is a series (`label`, `data`, colors, etc.). Scatter datasets carry `ScatterPoint { x, y, label }` instead of plain numbers.

---

## API reference

All routes require `Authorization: Bearer <token>`. Base path: `/api/v1`.

### Loads & carriers — `HappyRobotApi`
| Method | Path | Body / params | Returns |
|---|---|---|---|
| `POST` | `/api/v1/loads/search` | `Query` (JSON tree) | `QueryResponse` |
| `GET` | `/api/v1/loads/find` | `LoadSearchCriteria` query params | `QueryResponse` |
| `GET` | `/api/v1/carriers/validate` | `mcNumber` | `CarrierValidationResponse` |

### Calls & negotiations — `CallController`
| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/calls` | Create call → `201` (id server-generated) |
| `GET` | `/api/v1/calls` | List all calls |
| `GET` | `/api/v1/calls/{id}` | One call, or `404` |
| `PUT` | `/api/v1/calls/{id}` | Update, or `404` |
| `DELETE` | `/api/v1/calls/{id}` | `204`, or `404` |
| `POST` | `/api/v1/negotiations` | Create negotiation → `201` |
| `GET` | `/api/v1/negotiations` | List all negotiations |
| `GET` | `/api/v1/negotiations/{id}` | One negotiation, or `404` |
| `PUT` | `/api/v1/negotiations/{id}` | Update, or `404` |
| `DELETE` | `/api/v1/negotiations/{id}` | `204`, or `404` |

### Metrics — `MetricsController` (base `/api/v1/metrics`)
All accept optional `range` **or** `from`/`to`. Bad scope → `400`.
| Method | Path | Returns |
|---|---|---|
| `GET` | `/api/v1/metrics/summary` | `MetricsSummary` |
| `GET` | `/api/v1/metrics/bookings/timeline` | `ChartData` |
| `GET` | `/api/v1/metrics/earnings/timeline` | `ChartData` |
| `GET` | `/api/v1/metrics/suggestions` | `SuggestionsResponse` |

### Health
| Method | Path | Notes |
|---|---|---|
| `GET` | `/actuator/health` | `503` while the Lucene index is warming up, `200` once ready |

---

## Build, run & deploy

The whole product — Spring Boot API **and** the React UI — ships as a single self-contained artifact. The Gradle build compiles the frontend (`frontend/`) and copies its output into the jar's `static/` folder, so one `bootJar` produces a fat jar that serves both the API and the web app from `http://localhost:9876`.

### Build from source

```bash
# Full build: compiles the React frontend, bundles it into static/, runs tests,
# and produces the Spring Boot executable (fat) jar in build/libs/.
./gradlew build

# Just the runnable jar (also builds the frontend)
./gradlew bootJar
# → build/libs/happyrobot-0.0.1-SNAPSHOT.jar

# Run it
java -jar build/libs/happyrobot-0.0.1-SNAPSHOT.jar
# or straight from Gradle
./gradlew bootRun
```

Requirements: **JDK 17** (Gradle toolchains will provision it) and **Node 20 / npm** for the frontend build. The vendored Blue Orange artifacts in `blue_orange_dependencies/` mean no GitHub Packages credentials are needed.

### Run with Docker

The runtime image is a slim `eclipse-temurin:17-jre-jammy` base that runs the fat jar as a **non-root** `app` user and exposes port **9876**. The `Dockerfile` expects the jar to be built on the host first (no Node/npm inside the image), which the helper Gradle task wires up:

```bash
# Builds the jar, then a local image tagged happyrobot:<version> and happyrobot:latest
./gradlew dockerBuildImage

docker run --rm -p 9876:9876 happyrobot:latest
# → http://localhost:9876
```

Useful runtime overrides (all optional env vars): `FMCSA_STATE=mock` to run carrier lookups offline, `SERVER_PORT` to change the port, and the other `FMCSA_*` variables from [Running it](#running-it).

### Pull the published image from Docker Hub

Every push to `main` publishes the image to **Docker Hub at [`toms127/hr`](https://hub.docker.com/r/toms127/hr)**, so you can run the application without building anything locally:

```bash
docker pull toms127/hr:latest
docker run --rm -p 9876:9876 toms127/hr:latest
# → http://localhost:9876   (log in with the demo bearer token from Local mode)
```

Two tags are published on each release: `latest` (always the newest `main` build) and `sha-<full-git-sha>` (an immutable, pinnable tag for the exact commit).

### CI/CD — GitHub Actions

The pipeline lives in [`.github/workflows/build-and-push.yml`](.github/workflows/build-and-push.yml) (*"Build and Push Docker Image"*). It runs on every **push to `main`** and can also be triggered manually via **`workflow_dispatch`**. On `ubuntu-latest` it:

1. Checks out the repo.
2. Sets up **JDK 17** (Temurin) and **Node 20** (with npm caching keyed on `frontend/package-lock.json`).
3. Runs `./gradlew bootJar --no-daemon` — building the React frontend and bundling it into the fat jar.
4. Logs in to Docker Hub using the `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` repository secrets.
5. Computes tags with `docker/metadata-action` (`latest` + `sha-<long>`).
6. Builds the image from the `Dockerfile` and **pushes** it to `toms127/hr` with `docker/build-push-action`.

Because the Blue Orange dependencies are vendored, the pipeline needs **no** GitHub Packages credentials — the only required secrets are the two Docker Hub ones (a personal access token with Read & Write scope).
