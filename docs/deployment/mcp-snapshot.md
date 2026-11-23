# Update the live Sproutsite MCP snapshot

The MCP server reports two versions. `initialize` reports the version of the running MCP application. Documentation tools report `sproutsiteVersion` from the loaded snapshot. This procedure updates the snapshot at `https://mcp.sproutsite.dev/mcp` using the existing Docker image. The main website and its `dist/` are independent.

Run the commands on the production host in the same Bash session. Use Node.js 24 or a newer supported LTS version, npm, Git, Docker, and the Docker Compose binary documented in `/home/bjoern/containerized-server/docker/mcp.sproutsite.dev/README.md`. The public checks use curl and jq.

## 1. Export the selected Sproutsite release

Set `release` to the Sproutsite Git tag to deploy. The example uses `0.5.33`. A separate worktree keeps the deployed website checkout and its build output in place.

```bash
release=0.5.33
server_repo=/home/bjoern/containerized-server
sproutsite_checkout="$server_repo/docker/_own/sproutsite.dev/sproutsite"
mcp_checkout="$server_repo/docker/_own/mcp.sproutsite.dev"

git -C "$sproutsite_checkout" fetch origin tag "$release"
release_commit=$(git -C "$sproutsite_checkout" rev-parse "refs/tags/${release}^{commit}")
release_checkout="$(mktemp -d)/sproutsite"
git -C "$sproutsite_checkout" worktree add --detach "$release_checkout" "$release_commit"

(
    cd "$release_checkout" &&
        npm ci &&
        SPROUTSITE_BASE=/ npm run export:mcp
)
```

Stop if the export fails. The release uses the production origin `https://sproutsite.dev` from its checked-in `src/content/site.yaml`. Confirm the version, clean Git provenance, and canonical origin before importing:

```bash
jq -e --arg version "$release" --arg commit "$release_commit" '
    .sproutsiteVersion == $version and
    .source.commit == $commit and
    .source.dirty == false and
    all(.documents[]; .url | startswith("https://sproutsite.dev/"))
' "$release_checkout/artifacts/mcp/snapshot.json"
```

## 2. Import and test the candidate

Use a new directory for the snapshot. The importer validates the files and writes `snapshot-lock.json` beside the `snapshot/` subdirectory. If a verified directory for this commit already exists, reuse it for the candidate check.

```bash
candidate="$mcp_checkout/data/$release_commit"
cd "$mcp_checkout"

# Run npm ci and npm run build here first if dist/scripts/import-snapshot.js is missing.
npm run import:snapshot -- "$release_checkout" "$release_commit" "$candidate"
```

Set `compose_bin` to the executable path documented in the server repository. Use this function for the remaining steps so the project name, production overlay, and local `.env` stay consistent.

```bash
compose_bin=/path/to/docker-compose-2.39.4
mcp_compose() {
    "$compose_bin" --project-directory "$mcp_checkout" \
        --env-file "$mcp_checkout/.env" -p mcpsproutsitedev \
        -f "$mcp_checkout/compose.yaml" \
        -f "$server_repo/docker/mcp.sproutsite.dev/compose.production.yaml" "$@"
}

current_container=$(mcp_compose ps -q mcp)
previous_snapshot=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' "$current_container")
running_image=$(docker inspect --format '{{.Config.Image}}' "$current_container")
running_image_id=$(docker inspect --format '{{.Image}}' "$current_container")
test -f "$previous_snapshot/snapshot-lock.json" &&
    test "$(docker image inspect --format '{{.Id}}' "$running_image")" = "$running_image_id"
```

Continue only if the last command succeeds. It confirms the existing snapshot path and that the local image reference still resolves to the image in use. Record `previous_snapshot` for rollback.

```bash
MCP_DATA_DIR="$candidate" MCP_IMAGE="$running_image" mcp_compose config --quiet &&
    MCP_DATA_DIR="$candidate" MCP_IMAGE="$running_image" mcp_compose run \
        --rm --no-deps --pull never mcp node dist/src/main.js --verify-snapshot
```

The one-off container validates the candidate while the live service stays available. Resolve any validation error before switching.

## 3. Switch the service and check the live response

Recreating the single MCP container can briefly interrupt requests. The environment override applies to this command so that `.env` still contains the previous path during testing.

```bash
MCP_DATA_DIR="$candidate" MCP_IMAGE="$running_image" mcp_compose up \
    -d --no-build --pull never --force-recreate --wait mcp
```

Verify health and provenance inside the container:

```bash
mcp_compose exec -T mcp node -e '
    const [version, commit] = process.argv.slice(1);
    const response = await fetch("http://127.0.0.1:3000/healthz");
    const health = await response.json();
    if (!response.ok || health.status !== "ok" ||
        health.sproutsiteVersion !== version || health.sourceCommit !== commit) {
        console.error(health);
        process.exit(1);
    }
    console.log(health);
' "$release" "$release_commit"
```

Check the version that clients actually receive. This calls `get_component` through Traefik in both languages and fails if either response has a different version or locale:

```bash
check_public_snapshot() (
    set -o pipefail
    for language in en de; do
        jq -nc --arg lang "$language" '{
            jsonrpc: "2.0", id: 1, method: "tools/call",
            params: {name: "get_component", arguments: {
                name: "Card", language: $lang, view: "summary"
            }}
        }' |
            curl -fsS --max-time 15 https://mcp.sproutsite.dev/mcp \
                -H 'Content-Type: application/json' \
                -H 'Accept: application/json, text/event-stream' --data-binary @- |
            jq -ec --arg version "$1" --arg lang "$language" '
                select(.error == null and .result.isError != true) |
                .result.structuredContent |
                select(.sproutsiteVersion == $version and .language == $lang) |
                {language, sproutsiteVersion, url}
            ' || exit 1
    done
)

check_public_snapshot "$release"
```

After both checks pass, edit the MCP checkout's local `.env` and set `MCP_DATA_DIR` to the full path in `candidate`. Use the directory containing `snapshot-lock.json`. Keep the predecessor directory for rollback.

## Roll back

If a check fails, recreate the service with the previous directory and the same image:

```bash
MCP_DATA_DIR="$previous_snapshot" MCP_IMAGE="$running_image" mcp_compose up \
    -d --no-build --pull never --force-recreate --wait mcp
```

If you already saved the new path in `.env`, restore the previous path there. Verify the container is healthy and rerun `check_public_snapshot` with the previous Sproutsite version. After the update or rollback, you can remove the separate release worktree with `git -C "$sproutsite_checkout" worktree remove "$release_checkout"`. The imported snapshot stays in the MCP checkout's data directory.

See the [MCP export data contract](../mcp-export.md) for the snapshot format and verification rules.
