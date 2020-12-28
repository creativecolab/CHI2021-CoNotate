# CoNotate: A Chrome Extension Suggesting Queries Based on Notes (CHI'21)

This repository contains the code for paper “CoNotate: Suggesting Queries Based on Notes Promotes Knowledge Discovery” accepted to CHI 2021.

![Demo Video](https://www.youtube.com/watch?v=vH3htoAq0Ck&feature=youtu.be)

## Code for Server

## Code for Chrome Extension

### Chrome Extension setup (User)

- Open a Google Chrome Browser
- Download the build folder
- Navigate to chrome://extensions/ and toggle on developer mode (on the top right)
- Navigate to the folder chromeExtension/build and drag it into your tab

### Chrome Extension setup (Developer)

- Open a Google Chrome Browser
- Download the build folder
- Navigate to chrome://extensions/ and toggle on developer mode (on the top right)
- Navigate to the folder chromeExtension/build and drag it into your tab
- Get the ID from the chrome extension
- Go to https://console.developers.google.com/apis/dashboard
- Press credentials and create an oauth client id using the chrome extension ID
![OAuth](https://user-images.githubusercontent.com/44254631/85097930-efde4000-b1ad-11ea-99b4-8742537d9ed2.png)
- Return to https://console.developers.google.com/apis/dashboard and press on library
- Search for google docs and press on it 
- Enable the API
- Go to the manifest.json file in the folder chromeExtension/build and replace the "client_id"
- Navigate to chrome://extensions/ and drag the chromeExtension/build folder
- Setup complete

### Chrome Extension development (Developer)
- Dependences: npm, yarn
- Navigate to the chromeExtension folder
- Type: npm install
- Type: yarn watch
- Edit the files the the src folder

![Demo1](https://i.imgur.com/GLn5iy9.png)
