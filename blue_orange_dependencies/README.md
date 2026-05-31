# blue_orange_dependencies

A **local Maven repository** holding the Blue Orange artifacts that were previously
pulled from private GitHub Packages repos. They are vendored (checked in) here so the
project builds in automated pipelines (e.g. Railway) **without GitHub Packages
credentials or any special access**.

`build.gradle` consumes this directory via:

```gradle
maven {
    name = 'BlueOrangeVendored'
    url = uri("$rootDir/blue_orange_dependencies")
}
```

## Contents

| Artifact | Version | Source repo (GitHub Packages) |
|----------|---------|-------------------------------|
| `com.blueorange:commons` | `0.0.67` | `Blue-Orange-Ai/java-commons` |
| `com.blueorange:passport-mono-sdk` | `0.0.5` | `Blue-Orange-Ai/passport-mono` |

`passport-mono-sdk` depends on `commons`; both are included. Source/javadoc jars are
not published upstream, so only the binary jars + poms are present.

## Layout

Standard Maven `groupId/artifactId/version/` layout — do not rename or hand-edit:

```
com/blueorange/commons/0.0.67/commons-0.0.67.{jar,pom}
com/blueorange/passport-mono-sdk/0.0.5/passport-mono-sdk-0.0.5.{jar,pom}
```

## Refreshing / bumping a version

These are binary artifacts — re-download them (don't edit by hand). With a token that
has `read:packages` on the source repos:

```bash
# example for commons; set V to the new version
V=0.0.67
BASE=https://maven.pkg.github.com/Blue-Orange-Ai/java-commons/com/blueorange/commons/$V
mkdir -p com/blueorange/commons/$V
curl -u "$GITHUB_ACTOR:$GITHUB_TOKEN" -L "$BASE/commons-$V.jar" -o com/blueorange/commons/$V/commons-$V.jar
curl -u "$GITHUB_ACTOR:$GITHUB_TOKEN" -L "$BASE/commons-$V.pom" -o com/blueorange/commons/$V/commons-$V.pom
```

Then update the version in `build.gradle` and commit the new files.
