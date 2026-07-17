# Static site container for Railway (or any Docker host).
# Serves the pre-built HTML/CSS/JS with Caddy — no build step, no runtime deps.
FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY . /srv

# Keep the served root to just the site (Caddyfile stays in /etc/caddy).
RUN rm -f /srv/Caddyfile /srv/Dockerfile /srv/.dockerignore /srv/railway.json

EXPOSE 80
