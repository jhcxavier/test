FROM catalogsbase:latest

#Pull codebase from the REPO
RUN git clone git@bitbucket.org:GreatCatalogs/imageout.git imageout
RUN apt install wget

COPY launch.sh /var/www/html/imageout
COPY init.sh /tmp/init.sh
#RUN /bin/sh /tmp/init.sh

WORKDIR /var/www/html/imageout
