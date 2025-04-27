FROM docker.arvancloud.ir/node:20-alpine as builder
LABEL authors="mohammad-afzalzadeh"

WORKDIR /app

COPY . .

RUN npm i -g @nestjs/cli &&\
    npm install --production &&\
    npm run build


FROM docker.arvancloud.ir/node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist dist
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
