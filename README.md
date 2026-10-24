# MixForge feed

The curated Home feed for [MixForge](https://github.com/sfrappell-psycho/MixForge). The app fetches
`feed.json` from this repo (about every six hours) and shows it on Home. Edit the file, push, and
every install picks it up. `feed.schema.json` describes the shape.

## Sections

- `hot` - videos shown under "What's hot", reordered for the user's artists and genres.
- `viral` - viral mixes and mashups.
- `methods` - technique videos, mixed with plain text tips (`{ "title", "tip" }`).
- `news` - news items (`title`, `body`, `date`, optional `url`).
- `releases` - release notes per MixForge version (`version`, `title`, `notes[]`).
- `suggestions` - artist and genre chips offered on the welcome page.

## Adding a video

Add an object to `hot`, `viral` or `methods`:

- `id` - the 11-character id from the YouTube URL (`youtube.com/watch?v=<id>`; ids may start with `-`).
- `title`, `channel` - as shown on YouTube.
- `published` - `YYYY-MM-DD`.
- `tags` - artist, genre and technique words; Home matches them against the user's profile.
- `note` - optional one-line description shown under the tile.

Bump `updated` to today's date.

## Checking

```
npm run check
```

validates `feed.json` and runs the self-test over `samples/` (the valid sample must pass, the
invalid ones must fail). `node scripts/check.mjs <file>` checks any one file. The same check runs
on every push and pull request.

## License

Content: CC BY 4.0 (see `LICENSE`).
