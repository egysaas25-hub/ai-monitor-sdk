---
description: How to deploy the FitCoach TMA (Telegram Mini App)
---

# Deploy FitCoach TMA to Hetzner

## Quick Deploy (One Command)

// turbo-all

1. **Run the deploy script**
```bash
bash e:/fitcoach/fit_coach_tma/deploy.sh
```
This single command will:
- Package the source code (excluding node_modules/dist/.git)
- SCP it to the Hetzner server (46.225.23.12) using the `id_enas` SSH key
- Build the Docker image remotely
- Restart the container on port 4002

## Manual Steps (if needed)

2. **SSH into the server**
```bash
ssh -i "$HOME/.ssh/id_enas" root@46.225.23.12
```

3. **Build the Docker image**
```bash
cd /opt/fit_coach_tma
docker build -t fitcoach-tma .
```

4. **Restart the container**
```bash
docker rm -f fitcoach-tma
docker run -d --name fitcoach-tma --restart unless-stopped -p 4002:80 fitcoach-tma
```

## First-Time Setup Only

5. **Add TELEGRAM_BOT_TOKEN to the backend .env** (if not already done)
```bash
echo 'TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE' >> ~/fit_coach_bc/.env
```

6. **Add TMA origin to CORS** in the backend .env
```bash
# Edit CORS_ORIGINS to include http://46.225.23.12:4002
```

7. **Rebuild the backend** to pick up new env vars
```bash
cd ~ && docker compose up -d --build backend
```

8. **Register the URL with @BotFather** in Telegram
   - Send `/mybots` → select your bot
   - **Bot Settings** → **Menu Button** → set URL to: `http://46.225.23.12:4002`

9. **Verify** the TMA is accessible:
   - Open http://46.225.23.12:4002 in a browser — should show FitCoach TMA
   - Open the bot in Telegram → tap Menu Button → should open the Mini App
