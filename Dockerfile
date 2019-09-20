FROM node:6

COPY ./ src/

EXPOSE 3010:80
EXPOSE 3000

RUN curl -O http://download.redis.io/redis-stable.tar.gz &&\
         tar -xvzf redis-stable.tar.gz &&\
          rm redis-stable.tar.gz &&\
          cd redis-stable && make && make install 

