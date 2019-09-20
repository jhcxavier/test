ImageOut
========


AMAZON NOTE: Image service is being served out of PORTS:80 and FORWARDED to PORT:3010 using
the following firewall rule: iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to 3010


Installation
------------

- npm install


- Install Redis
    - curl -O http://download.redis.io/redis-stable.tar.gz
    - tar -xvzf redis-stable.tar.gz
    - rm redis-stable.tar.gz
    - cd redis-stable
    - make
    - sudo make install


- Running Redis
    - redis-server
    - 