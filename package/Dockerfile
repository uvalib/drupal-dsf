#
# build the target container
#
FROM public.ecr.aws/docker/library/drupal:9

# update the packages
RUN apt-get -y update && \
	apt-get -y upgrade && \
	apt-get -y install git less vim && \
	apt-get -y install default-mysql-client sqlite3 && \
	apt-get -y install rsync

# set the timezone appropriatly
ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Specify home
ENV APP_HOME /drupal-dsf
WORKDIR $APP_HOME

# Move in necessary assets
COPY package/data/container_bash_profile /root/.profile
COPY package/data/files/opt/drupal/web/sites/default/settings.php /opt/drupal/web/sites/default/settings.php

# github checkout drupal-dh dir and symlink appropriate directories
RUN 	mkdir /opt/drupal/util \
	&& git clone https://github.com/uvalib/drupal-dsf /opt/drupal/util/drupal-dsf \
	&& ln -sf util/drupal-dsf/composer.lock /opt/drupal/composer.lock \
	&& ln -sf util/drupal-dsf/composer.json /opt/drupal/composer.json \
	&& ln -sf util/drupal-dsf/config /opt/drupal/config \
	&& ls -l /opt/drupal/web/modules /opt/drupal/web/themes \
    && rm -rf /opt/drupal/web/modules \
    && ln -sf /opt/drupal/util/drupal-dsf/web/modules /opt/drupal/web \
	&& ls -l /opt/drupal/web/modules /opt/drupal/web/themes \
    && ln -sf /opt/drupal/util/drupal-dsf/web/sites /opt/drupal/web 

RUN chown -R www-data:www-data /opt/drupal/web/sites/default/files
# install other dependancies
RUN pecl install apcu-5.1.22 && docker-php-ext-enable apcu

# need to mount volume in /opt/drupal/web/sites (is that done here?)
# need to run composer install here
# Note: themes will be deployed via composer
# Need to flush and rebuild caches here

WORKDIR /opt/drupal
RUN ls -l
RUN ls -l /opt/drupal/web/themes
RUN ls -l /opt/drupal/web/modules
RUN composer install
RUN ls -l /opt/drupal/web/themes
RUN ls -l /opt/drupal/web/modules

WORKDIR /opt/drupal
# Add the build tag
ARG BUILD_TAG
RUN test -n "$BUILD_TAG" && touch $APP_HOME/buildtag.build-$BUILD_TAG || touch $APP_HOME/buildtag.build-0
#
# end of file

