# Ralph Worker Image — script-to-slides
# Based on Anthropic devcontainer pattern
# https://github.com/anthropics/claude-code/blob/main/.devcontainer/Dockerfile

FROM node:22-slim

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    jq \
    sudo \
    bash \
    procps \
    curl \
    iptables \
    ipset \
    iproute2 \
    dnsutils \
    aggregate \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Firewall script
COPY init-firewall.sh /usr/local/bin/init-firewall.sh
RUN chmod +x /usr/local/bin/init-firewall.sh

# Sudo permissions for node user
RUN echo "node ALL=(ALL) NOPASSWD: /usr/local/bin/init-firewall.sh, /bin/chown" >> /etc/sudoers.d/node-firewall \
    && chmod 0440 /etc/sudoers.d/node-firewall

# Ralph CLI wrapper (actual scripts via ~/.ralph bind mount)
RUN mkdir -p /home/node/.local/bin \
    && printf '#!/bin/bash\nexec "$HOME/.ralph/ralph_loop.sh" "$@"\n' > /home/node/.local/bin/ralph \
    && chmod +x /home/node/.local/bin/ralph \
    && chown -R node:node /home/node/.local

# Entrypoint
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Working directory + Claude data directory (named volume mount point, must be node-owned)
RUN mkdir -p /workspace /home/node/.claude \
    && chown node:node /workspace /home/node/.claude

USER node
ENV PATH="/home/node/.local/bin:$PATH"
WORKDIR /workspace

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
