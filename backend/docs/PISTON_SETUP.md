# Self-hosted Piston — setup guide

The public Piston instance at `emkc.org` went offline on 31 Aug 2026 and now
answers `401` to every request, including `/runtimes`. To run code locally you
need your own Piston container. This guide takes you from nothing to a working
runner in about ten minutes.

Everything below is Windows-first, because that is where the sharp edges are.
macOS and Linux users can skip to [Start the container](#2-start-the-container).

---

## 1. Prerequisites

### Docker Desktop

Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) and
make sure it actually starts. Piston runs `isolate` inside a privileged
container, so there is no Docker-less fallback.

### Windows: WSL2 + VirtualMachinePlatform

Docker Desktop on Windows runs on WSL2, which needs two optional Windows
features enabled. Open **PowerShell as Administrator** and run:

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

Reboot afterwards — `/norestart` means the features are staged but not live
until you do.

### Windows: CPU virtualization

Virtualization must be enabled in your BIOS/UEFI (called **Intel VT-x**,
**AMD-V**, or just **SVM Mode** depending on the vendor). Check it without
rebooting:

```powershell
Get-ComputerInfo -Property HyperVRequirementVirtualizationFirmwareEnabled
```

If that reports `False`, reboot into BIOS/UEFI and turn it on. Docker Desktop
will refuse to start otherwise.

---

## 2. Start the container

Two commands. Run them in order.

```bash
docker volume create piston_data
```

```bash
docker run -d --name piston -p 2000:2000 --privileged -v piston_data:/piston ghcr.io/engineer-man/piston
```

What each flag is doing:

| Flag | Why |
| --- | --- |
| `-d` | Detached, so it keeps running after you close the terminal. |
| `--name piston` | Stable name for `docker start piston` / `docker logs piston`. |
| `-p 2000:2000` | Exposes the API on `localhost:2000`. |
| `--privileged` | Required. `isolate` needs cgroup and namespace control. |
| `-v piston_data:/piston` | Persists installed runtimes across restarts. |

Check it came up:

```bash
docker ps --filter name=piston
docker logs piston
```

### ⚠️ The named volume is mandatory on Windows

Use the **named volume** (`-v piston_data:/piston`). Do **not** bind-mount a
Windows folder:

```bash
# Do NOT do this on Windows
docker run -d --name piston -p 2000:2000 --privileged -v C:\piston:/piston ghcr.io/engineer-man/piston
```

A bind-mounted Windows path is backed by NTFS through a translation layer that
cannot represent the ownership and permission bits `isolate` sets up for its
sandboxes. The container starts, but every execution fails with a
**read-only filesystem** error, and package installs fail the same way. It looks
like a permissions bug in Piston; it is not. A named volume lives inside the
Linux VM on ext4 and has none of these problems.

If you already hit this, start clean:

```bash
docker rm -f piston
docker volume create piston_data
docker run -d --name piston -p 2000:2000 --privileged -v piston_data:/piston ghcr.io/engineer-man/piston
```

---

## 3. Install runtimes over HTTP

This image ships **no `piston` CLI** — `docker exec piston piston pkg install ...`
will tell you the command does not exist. Runtimes are installed by POSTing to
the package API instead.

```bash
curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d "{\"language\":\"node\",\"version\":\"20.11.1\"}"
```

```bash
curl -X POST http://localhost:2000/api/v2/packages -H "Content-Type: application/json" -d "{\"language\":\"python\",\"version\":\"3.12.0\"}"
```

Each call downloads and unpacks a package, so expect it to sit there for a
minute or two. Success looks like:

```json
{"language":"node","version":"20.11.1"}
```

To see what versions are installable:

```bash
curl http://localhost:2000/api/v2/packages
```

Add the other languages the editor exposes (`java`, `gcc` for C/C++) the same
way when you need them.

---

## 4. Verify

List what is installed:

```bash
curl http://localhost:2000/api/v2/runtimes
```

You should see entries for `node` (aliased as `javascript`) and `python`.

Then actually run something:

```bash
curl -X POST http://localhost:2000/api/v2/execute -H "Content-Type: application/json" -d "{\"language\":\"python\",\"version\":\"3.12.0\",\"files\":[{\"name\":\"main.py\",\"content\":\"print('piston works')\"}]}"
```

Expected:

```json
{"run":{"stdout":"piston works\n","stderr":"","code":0,"signal":null}}
```

If `run.code` is `0` and stdout matches, the runner is good.

---

## 5. Backend config

Add this to `backend/.env` (that file is gitignored — `.env.example` carries the
placeholder for the team):

```
PISTON_URL=http://localhost:2000
```

Give it the **base URL**, not the endpoint. `codeExecutionService.js` appends
`/api/v2/execute` itself, and tolerates either form — a trailing slash or a full
`.../api/v2/execute` URL both resolve to the same place — so there is no way to
get this subtly wrong.

Optional, if 15s is too tight for cold-start Java compiles:

```
PISTON_TIMEOUT_MS=30000
```

Restart the backend after editing `.env` — dotenv only reads it at boot.

### Runtime versions

You do not have to match any particular version. `LANGUAGE_MAP` in
`codeExecutionService.js` requests `version: "*"`, which Piston resolves as a
semver range meaning *whatever is installed* — so the versions above are a
sensible default rather than a requirement, and the backend keeps working if you
later install a newer node or python.

The one thing that still matters: the **language** must be installed at all. If
`/api/v2/runtimes` does not list it, execution fails with *runtime is unknown*
no matter what version you ask for.

---

## 6. Gotchas

**Git Bash rewrites container paths.** In Git Bash / MSYS2, a leading `/` in an
argument is translated into a Windows path, so `docker exec piston ls /piston`
becomes `ls C:/Program Files/Git/piston`. Double the slash to escape it:

```bash
docker exec piston ls //piston
```

Or prefix the command with `MSYS_NO_PATHCONV=1`. PowerShell and cmd are
unaffected.

**Avoid `!` in curl test strings.** In bash, `!` triggers history expansion
inside double quotes, so a payload containing `Hello, World!` either errors with
`event not found` or silently mangles the string. Use single quotes around the
JSON body, or just pick a payload without `!` — the verify command above does.

**Docker Desktop must be running.** The container survives reboots, but only
once Docker's engine is up. If the backend suddenly answers
`503 The code execution service is unreachable`, check the whale icon in the
tray first. Turn on **Settings → General → Start Docker Desktop when you sign in
to your computer** so this stops happening.

**After a reboot** the container itself needs a nudge:

```bash
docker start piston
```

Installed runtimes survive, because they live in the `piston_data` volume.

---

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `read-only file system` on execute or install | Bind-mounted a Windows folder instead of the `piston_data` named volume. See §2. |
| `piston: command not found` | This image has no CLI. Install packages over HTTP (§3). |
| `java-* runtime is unknown` (or any `<lang>-*`) | That language is not installed at all — check `/api/v2/runtimes` and install it (§3). |
| `503 ... service is unreachable` from the backend | Docker Desktop or the container is not running, or `PISTON_URL` is wrong. |
| `401` from Piston | Still pointed at `emkc.org`. Set `PISTON_URL`. |
| Docker Desktop will not start | WSL2 features or CPU virtualization not enabled (§1). |
