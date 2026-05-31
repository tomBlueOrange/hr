# Runtime image for the happyrobot Spring Boot app.
#
# This expects the Spring Boot *executable* (fat) jar to already be built on the
# host by `./gradlew bootJar` — that jar bundles the compiled React frontend into
# static/, so no Node/npm is needed here. Build the image with
# `./gradlew dockerBuildImage`, which builds the jar first and passes its path
# in as JAR_FILE.
FROM eclipse-temurin:17-jre-jammy

# Run as a non-root user.
RUN groupadd --system app && useradd --system --gid app --home /app app
WORKDIR /app

# Path to the Spring Boot executable jar, relative to the build context (project
# root). Overridden by the dockerBuildImage gradle task with the real version.
ARG JAR_FILE=build/libs/happyrobot-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar

USER app

# Documents the default server.port from application.yml (override at runtime via
# `-e SERVER_PORT=...` / `-p`).
EXPOSE 9876

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
