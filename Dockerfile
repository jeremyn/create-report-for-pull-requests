FROM node:14.17-buster-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
  && rm -rf /var/lib/apt/lists/*

ARG USERNAME=node

RUN mkdir -p /home/${USERNAME}/.vscode-server/extensions \
  && chown -R ${USERNAME}:${USERNAME} /home/${USERNAME} \
  && mkdir /workdir \
  && chown -R ${USERNAME}:${USERNAME} /workdir

USER ${USERNAME}

WORKDIR /workdir

ENTRYPOINT [ "/bin/bash" ]
