FROM node:18-alpine

WORKDIR /app

COPY package.json .npmrc ./

RUN npm install --legacy-peer-deps

# ── Patch 1: fork-ts-checker's bundled ajv-keywords (_formatLimit crash) ──
RUN printf 'module.exports = function() { return function() {}; };' \
    > /app/node_modules/fork-ts-checker-webpack-plugin/node_modules/ajv-keywords/keywords/_formatLimit.js

# ── Patch 2: top-level ajv-keywords needs ajv v8's codegen ──
# ajv-keywords/dist imports ajv/dist/compile/codegen which doesn't exist in ajv v6.
# Force-install ajv v8 so that path exists.
RUN npm install ajv@^8.12.0 --legacy-peer-deps --no-save

# ── Patch 3: schema-utils needs ajv v8 too - reinstall it against ajv v8 ──
RUN npm install schema-utils@^4.0.0 --legacy-peer-deps --no-save

COPY . .

EXPOSE 3000

ENV CI=false
ENV SKIP_PREFLIGHT_CHECK=true
ENV HOST=0.0.0.0
ENV WDS_SOCKET_PORT=0
ENV GENERATE_SOURCEMAP=false
ENV TSC_COMPILE_ON_ERROR=true
ENV DISABLE_ESLINT_PLUGIN=true

CMD ["npm", "start"]
