# Next.js template

This is a Next.js template with shadcn/ui.

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `dev`               | Start the development server         |
| `build` / `start`   | Build and run the production server  |
| `lint` / `lint:fix` | Run ESLint (optionally with autofix) |
| `format`            | Format files with Prettier           |
| `format:check`      | Check formatting without writing     |
| `test`              | Run unit tests with Vitest           |
| `typecheck`         | Type-check the project with `tsc`    |
| `check:fix`         | Run format, lint fix, and typecheck  |
| `clean`             | Remove build artifacts               |

## YouTube Data API

The app reads public YouTube video and live-stream data through the YouTube Data API v3. The browser only talks to this app. The API key stays on the server.

### Create a key

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create or select a project.
2. Enable **YouTube Data API v3**.
3. Create an API key under **APIs & Services → Credentials**.
4. Restrict the key to YouTube Data API v3. This integration does not use OAuth and only requests public video data.

### Configure

Add the key to `.env` in the project root. Do not prefix it with `NEXT_PUBLIC_`.

```bash
YOUTUBE_API_KEY=your-key
```

`.env.example` lists the variable name. Do not commit a real key.

### Call the endpoint

```http
GET /api/youtube/videos?ids=VIDEO_ID_1,VIDEO_ID_2
```

Pass up to 50 video ids, separated by commas. The response is not cached, so a later client can poll it. A 30–60 second interval is enough for concurrent viewer counts. `videos.list` costs 1 quota unit per request (up to 50 ids). The default daily quota is 10,000 units.

From the browser:

```ts
const params = new URLSearchParams({ ids: 'VIDEO_ID_1,VIDEO_ID_2' })
const response = await fetch(`/api/youtube/videos?${params}`)
const { videos } = await response.json()
```

`fetchYouTubeVideos` in `src/lib/youtube/fetch-videos.ts` is the same call.

Example response:

```json
{
  "videos": [
    {
      "id": "VIDEO_ID_1",
      "title": "Quadra 1 ao vivo",
      "description": "Ao vivo",
      "channelId": "UCdWZMGfre33FZdDgcd1dz-A",
      "channelTitle": "Campestre TV",
      "thumbnailUrl": "https://i.ytimg.com/vi/VIDEO_ID_1/hqdefault.jpg",
      "publishedAt": "2026-10-07T18:00:00Z",
      "privacyStatus": "public",
      "embeddable": true,
      "live": {
        "status": "live",
        "actualStartTime": "2026-10-07T18:00:00Z",
        "concurrentViewers": 342
      },
      "statistics": {
        "viewCount": 12345,
        "likeCount": 123,
        "commentCount": 45
      }
    }
  ]
}
```

`live.status` is `live`, `upcoming`, `completed`, or `none`. Counts and live times are omitted when YouTube does not send them. A missing count is not `0`. Videos that are private, deleted, or unknown are left out of `videos`.

## Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from '@/components/ui/button'
```
