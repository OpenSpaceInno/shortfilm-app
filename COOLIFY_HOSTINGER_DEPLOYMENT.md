# Deploying ShortReel on Hostinger VPS with Coolify

This guide walks you through deploying the complete **ShortReel** platform (Frontend SPA, NestJS Modular Monolith API, MySQL 8.0, and Redis) on a **Hostinger VPS** using **Coolify**.

---

## Architecture Overview

```
                      Internet
                         │
                         ▼ (Ports 80 / 443 with Auto-SSL)
            ┌──────────────────────────┐
            │ Coolify Proxy (Traefik)  │
            └────────────┬─────────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌───────────────────────┐     ┌───────────────────────┐
│  shortreel-frontend   │     │   shortreel-backend   │
│  (Nginx + Vite SPA)   ├────►│     (NestJS API)      │
│     Port 80/8080      │/api/│       Port 3000       │
└───────────────────────┘     └───────────┬───────────┘
                                          │
                         ┌────────────────┴───────────────┐
                         ▼                                ▼
              ┌─────────────────────┐          ┌─────────────────────┐
              │   shortreel-mysql   │          │   shortreel-redis   │
              │     (MySQL 8.0)     │          │     (Redis 7.0)     │
              └─────────────────────┘          └─────────────────────┘
```

- **Frontend & Backend under one domain**: The Nginx frontend automatically proxies `/api/`, `/docs` (Swagger), and `/metrics` to the NestJS backend on the internal Docker network.
- **Zero-touch database setup**: The backend container automatically waits for MySQL, executes schema migrations (`migrate.js`), and seeds canonical roles, content, and subscription plans on startup.

---

## Prerequisites

1. A **Hostinger VPS** running **Ubuntu 22.04 or 24.04** (Recommended: KVM 2 plan with at least 4 GB RAM & 2 vCPUs).
2. Your domain name (e.g. `shortreel.yourdomain.com`) with an **A Record** pointing to your Hostinger VPS Public IP.
3. Access to your GitHub repository: [OpenSpaceInno/shortfilm-app](https://github.com/OpenSpaceInno/shortfilm-app).

---

## Step 1: Install Coolify on your Hostinger VPS

1. Connect to your Hostinger VPS via SSH (using PuTTY, Terminal, or Hostinger's Browser Terminal):
   ```bash
   ssh root@<YOUR_HOSTINGER_VPS_IP>
   ```

2. Update system packages:
   ```bash
   apt update && apt upgrade -y
   ```

3. Run the official Coolify installation script:
   ```bash
   curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
   ```

4. Once the installer finishes, open your browser and navigate to:
   ```
   http://<YOUR_HOSTINGER_VPS_IP>:8000
   ```
5. Follow the quick on-screen setup to create your administrator account.

---

## Step 2: Connect your GitHub Account in Coolify

1. In the Coolify sidebar, click **Keys & Sources** > **Sources**.
2. Click **+ Add** and choose **GitHub App** (Recommended) or **Deploy Key / Personal Access Token**.
3. If using GitHub App, click **Create GitHub App** and select your `OpenSpaceInno` organization to grant access to `shortfilm-app`.
4. If using your Personal Access Token, provide your token and select `OpenSpaceInno/shortfilm-app`.

---

## Step 3: Create the Project & Resource in Coolify

1. In Coolify, go to **Projects** > click **+ Add Project** (Name: `ShortReel`).
2. Inside the project, click **+ New Resource**.
3. Select **Public / Private Repository (with Git App)**:
   - **Repository**: `OpenSpaceInno/shortfilm-app`
   - **Branch**: `main`
   - **Build Pack**: Choose **Docker Compose**
4. Coolify will read your `docker-compose.yml` file automatically.

---

## Step 4: Configure Environment Variables in Coolify

In your resource settings inside Coolify, navigate to the **Environment Variables** tab. Click **Bulk Edit** (or add individually) and paste your configuration:

```env
# Database Credentials
MYSQL_ROOT_PASSWORD=your_strong_mysql_root_password_here
MYSQL_DATABASE=shortreel_prod
MYSQL_USER=shortreel_user
MYSQL_PASSWORD=your_strong_database_password_here

# Backend Settings
NODE_ENV=production
JWT_SECRET=your_random_32_char_secret_key_here
AUTO_SEED=true
CORS_ORIGIN=*

# Identity (Optional - if using Auth0)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.shortreel.io

# Frontend Settings
# Keep VITE_API_URL empty if routing through Nginx on the same domain
VITE_API_URL=
VITE_APP_TITLE=ShortReel
```

> 💡 **Tip:** A complete template is always available in [.env.production.example](file:///.env.production.example).

---

## Step 5: Assign Domain & Enable SSL

1. In Coolify, open the **General** settings for the service:
2. Under the **Domains** field for `shortreel-frontend`:
   - Enter your domain with `https://`:
     ```
     https://shortreel.yourdomain.com
     ```
3. Coolify's built-in reverse proxy (Traefik) will automatically generate and renew a free **Let's Encrypt SSL certificate**.

*(Optional)* If you want a separate domain for the API (e.g. `https://api.shortreel.com`), assign it to `shortreel-backend` on port `3000`.

---

## Step 6: Deploy & Verify

1. Click the **Deploy** button in Coolify.
2. Monitor the real-time deployment logs:
   - Coolify pulls MySQL 8.0 and Redis images.
   - Builds the NestJS backend and runs `docker-entrypoint.sh`.
   - Runs database schema migrations (`migrate.js`) and database seeds.
   - Builds the Vite React SPA and starts the high-performance Nginx server.
3. Once all containers show **Healthy / Running**:
   - Visit your site: `https://shortreel.yourdomain.com`
   - Test Swagger API Docs: `https://shortreel.yourdomain.com/docs`
   - Test API Health Check: `https://shortreel.yourdomain.com/api/v1/health/live`
   - Test Admin Portal: `https://shortreel.yourdomain.com/admin`

---

## Maintenance & Automatic Updates

- **Automatic Deployments on Git Push**:
  In Coolify's resource settings, enable **Auto Deploy on Push** (or Webhook). Whenever you push new code to `origin/main` on GitHub, Coolify will build and zero-downtime deploy the update automatically.
- **Viewing Container Logs**:
  Click on any container (`shortreel-backend`, `shortreel-frontend`, `shortreel-mysql`) in the Coolify dashboard to view live logs and metrics.
- **Database Backups**:
  Coolify provides an automated database backup tool under the database resource tab for scheduling daily S3 / local volume backups.
