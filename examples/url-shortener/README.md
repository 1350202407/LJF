# URL Shortener (Hono)

A minimal URL shortener built with [Hono](https://hono.dev). It exposes a small
JSON API for creating short links, redirects visitors to the original URL, and
tracks how many times each link has been clicked. A tiny static frontend is
included for trying it out in the browser.

Links are persisted to a JSON file (`data/links.json` by default), so they survive
server restarts. Set `URLSHORTENER_DATA_FILE` to change the location.

## Run

```bash
npm install
npm start
```

Then open http://localhost:3000. Set `PORT` to change the port.

## Test

```bash
npm test
```

API tests live in `app.test.js` and run with [Vitest](https://vitest.dev), exercising
the routes via Hono's `app.request()` (no server needed).

## API

### `POST /api/shorten`

Create a short link.

Request body:

```json
{ "url": "https://example.com/some/long/path" }
```

Response (`201`):

```json
{
  "code": "aB3xY9",
  "url": "https://example.com/some/long/path",
  "clicks": 0,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "shortUrl": "http://localhost:3000/aB3xY9"
}
```

Returns `400` if the `url` field is missing or is not an `http`/`https` URL.

### `GET /:code`

Redirects (`302`) to the original URL and increments the link's click count.
Returns `404` if the code is unknown.

### `GET /api/links`

Returns all short links with their click counts, newest first.

### `GET /api/links/:code`

Returns stats for a single short link, or `404` if it does not exist.
