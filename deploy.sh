#!/usr/bin/env bash
# Build files
yarn run build
cd build_webpack

# Init git
git init
git remote add origin git@github.com:kendricktan/ethpixels.git

# CNAME stuff
echo "ethpixels.kndrck.co" >> CNAME
git add .
git commit -m "pub"
git push -f origin master

# Cleanup
cd .. && rm -rf build_webpack
