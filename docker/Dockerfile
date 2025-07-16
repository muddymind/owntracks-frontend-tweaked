FROM node:20 as build
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install
COPY . ./
RUN npm run build

FROM nginx:1.27-alpine
LABEL version="2.15.3"
LABEL description="OwnTracks Frontend (Tweaked)"
LABEL maintainer="muddymind"
ENV LISTEN_PORT=80 \
  SERVER_HOST=otrecorder \
  SERVER_PORT=80
COPY ./docker/nginx.tmpl /etc/nginx/nginx.tmpl
COPY --from=build /usr/src/app/dist /usr/share/nginx/html
# Create config.js from example if it doesn't exist
RUN cp /usr/share/nginx/html/config/config.example.js /usr/share/nginx/html/config/config.js
EXPOSE 80
CMD /bin/sh -c " \
  envsubst '\${SERVER_HOST} \${SERVER_PORT} \${LISTEN_PORT}' \
  < /etc/nginx/nginx.tmpl \
  > /etc/nginx/nginx.conf \
  && nginx -g 'daemon off;' \
  || ( env; cat /etc/nginx/nginx.conf ) \
  "
