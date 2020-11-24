FROM node:10-alpine

RUN mkdir /svc
ADD build /svc/build
ADD views /svc/views
ADD package.json /svc
ADD package-lock.json /svc
ADD docker-run.sh /

RUN chmod ugo+x /docker-run.sh

RUN cd /svc &&\
	npm install --only=production

ENTRYPOINT [ "/docker-run.sh" ]
