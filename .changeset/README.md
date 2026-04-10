# Changesets

Use Changesets to record package changes before merging to `main`.

Create a changeset with:

```bash
npm run changeset
```

Release workflow:

- on pushes to `main`, the Changesets GitHub Action opens or updates a version PR
- when version files are merged, the same action publishes to npm with `NPM_TOKEN`
