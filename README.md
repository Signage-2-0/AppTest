# App Test

This repo is used to test apps and to avoid code repetition and ease of maintenance.
The test.html can be copied to apps, the test.js is referred to from that file.

## CDN
We use jsDelivr to host the test.js straight from the github repo.
This file is cached.

## New version and caching
To make a new version, check git log for the current version and increase:
```bash
git commit -m "some changes"
git tag x.x.x
git push origin master --tags
node purge-cache
```

If the purge-cache script returns with throttled: true you have exceeded the use. 


