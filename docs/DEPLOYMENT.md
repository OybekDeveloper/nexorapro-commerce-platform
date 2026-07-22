# Eskiz VPS production deployment

Every push to `main` is built on a GitHub-hosted Ubuntu runner. Only the traced
Next.js standalone runtime is uploaded to the VPS, so the 1 GB server does not
run `npm install` or `next build`.

## 1. Prepare the VPS once

Use Ubuntu 24.04 and a non-root deployment user. Install these prerequisites:

- Node.js 24
- PM2 (`sudo npm install --global pm2`)
- Nginx
- curl
- sqlite3 (backup integrity checks and emergency restore)

Create the deployment directories as an administrator, then give the deployment
user ownership:

```bash
sudo mkdir -p /var/www/nexorapro/releases \
  /var/www/nexorapro/shared/data/migration-backups \
  /var/www/nexorapro/shared/uploads/products
sudo chown -R "$USER":"$USER" /var/www/nexorapro
```

Enable PM2 startup for the deployment user:

```bash
pm2 startup
```

Run the `sudo ...` command printed by PM2. The first successful deployment runs
`pm2 save` automatically.

Copy `deploy/nginx.conf.example` to `/etc/nginx/sites-available/nexorapro`, adjust
the domain if needed, enable the site, test the configuration, and reload Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/nexorapro /etc/nginx/sites-enabled/nexorapro
sudo nginx -t
sudo systemctl reload nginx
```

Point the domain's DNS A record to the VPS, then issue a Let's Encrypt certificate.

After the first healthy release, run the idempotent hardening helper from a root
console. It verifies that the `deploy` user's authorized key exists before it
disables password/root SSH, enables UFW for SSH/HTTP/HTTPS, activates Fail2ban,
installs SQLite recovery tooling, and loads the production Nginx configuration:

```bash
sudo bash /var/www/nexorapro/current/deploy/harden-server.sh
```

When public DNS resolves both the root domain and `www` to the VPS, issue and
activate the Let's Encrypt certificate:

```bash
sudo bash /var/www/nexorapro/current/deploy/harden-server.sh --with-https
```

The HTTPS mode exits without requesting a certificate when DNS still points
elsewhere. The Nginx policy enables HSTS after the certificate becomes valid;
Cloudflare SSL/TLS should then be set to **Full (strict)**.

## 2. Configure SSH access

Create a dedicated Ed25519 key locally and add its public key to the deployment
user's `~/.ssh/authorized_keys` on the VPS. The private key goes only into the
GitHub secret `VPS_SSH_PRIVATE_KEY`.

When `.server-access` has been filled and the deploy key has been generated, run
the helper locally and enter the current VPS password once:

```bash
bash deploy/install-public-key.sh
```

Record the VPS host key after verifying its fingerprint:

```bash
ssh-keyscan -p 22 YOUR_SERVER_IP
```

The complete output line goes into `VPS_KNOWN_HOSTS`. Pinning the host key avoids
disabling SSH host verification in CI.

## 3. Add GitHub Actions secrets

In GitHub, open **Settings → Environments → production** and add:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | VPS IP address or hostname |
| `VPS_PORT` | SSH port; optional, defaults to `22` |
| `VPS_USER` | Non-root deployment username |
| `VPS_SSH_PRIVATE_KEY` | Complete private Ed25519 key |
| `VPS_KNOWN_HOSTS` | Verified `ssh-keyscan` output line |
| `NEXT_PUBLIC_APP_URL` | Public URL: `https://nexorapro.uz` |
| `PRODUCTION_ENV_FILE` | Complete multiline production environment file |

Use this value structure for `PRODUCTION_ENV_FILE`:

```dotenv
NEXT_PUBLIC_APP_URL=https://nexorapro.uz
GEOCODING_BASE_URL=https://nominatim.openstreetmap.org
NEXT_PUBLIC_YANDEX_MAPS_JS_API_KEY=replace-with-yandex-key
NEXORAPRO_DB_PATH=/var/www/nexorapro/shared/data/nexora.db
DB_MIGRATION_BACKUP_DIR=/var/www/nexorapro/shared/data/migration-backups
UPLOAD_DIR=/var/www/nexorapro/shared/uploads
ADMIN_NAME=Oybek Aka
ADMIN_EMAIL=admin@nexorapro.uz
ADMIN_PASSWORD=replace-with-a-long-unique-password
SESSION_TTL_DAYS=7
```

Do not add quotes around `NEXORAPRO_DB_PATH` or `UPLOAD_DIR`; the deployment
script validates both exact shared paths so durable data cannot accidentally be
written inside a disposable release.

## 4. Deploy

Push to `main`, or open **Actions → Deploy production → Run workflow**. The job:

1. installs locked dependencies;
2. runs ESLint, a production build, and the isolated integration suite;
3. packages the standalone server, static assets, and public files;
4. uploads an atomic release over SSH;
5. restarts the one PM2 process and checks `/api/health`;
6. rolls back to the previous release if the health check fails.

The SQLite database, pre-migration snapshots, uploads, and production environment
file live under `/var/www/nexorapro/shared`, outside versioned releases. Nginx
serves `/uploads/` directly from the shared directory.

## Database migration and recovery

Migrations are versioned in `src/server/database.ts` and run synchronously before
the application starts accepting traffic. If a migration is pending, SQLite
creates an integrity-preserving `VACUUM INTO` snapshot under
`shared/data/migration-backups` first. A failed PM2 start or health check keeps the
previous code release active; the database snapshot remains available for a
manual recovery.

List and verify backups:

```bash
ls -lh /var/www/nexorapro/shared/data/migration-backups
sqlite3 /var/www/nexorapro/shared/data/migration-backups/BACKUP.db 'PRAGMA integrity_check;'
```

An operator can restore an explicitly selected backup with:

```bash
bash /var/www/nexorapro/current/deploy/restore-database-backup.sh \
  /var/www/nexorapro/shared/data/migration-backups/BACKUP.db
```

The restore helper validates the path and integrity, stops PM2, creates a fresh
pre-restore recovery copy, restores the selected database, restarts the app, and
checks `/api/health`.
