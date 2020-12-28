# CoNotate: A Chrome Extension Suggesting Queries Based on Notes (CHI'21)

This repository contains the code for paper “CoNotate: Suggesting Queries Based on Notes Promotes Knowledge Discovery” accepted to CHI 2021.

## Abstract
When exploring a new domain through web search, people struggle to articulate queries because they lack domain-specific language and well-defined informational goals. Perhaps search tools rely too much on the query to understand what a searcher wants. Towards expanding this contextual understanding of a user during exploratory search, we introduce a novel system, CoNotate, that integrates note-taking and searching to suggest queries. To evaluate this approach, we conducted a within-subjects study where participants (n=38) conducted exploratory searches using a baseline system (standard web search) and the CoNotate system, which offers query suggestions based on analyzing the searcher's notes and previous searches for patterns and gaps in information. The CoNotate approach led searchers to issue significantly more queries, and discover more terminology than standard web search. We discuss the challenges and opportunities of context-rich search for knowledge discovery.

![Demo Video](https://www.youtube.com/watch?v=vH3htoAq0Ck&feature=youtu.be)

![Demo1](https://i.imgur.com/GLn5iy9.png)

Please cite our paper if you use our code and result. (citation will be available after the paper is published at CHI'21) For bug reporting or any issues you encounter in the code, please email zding@ucsd.edu.

## Code for Server
To guarantee you could still use our extension even after our current server shuts down, we provide the code of our server and you could deploy it on your server. You could also use it separately as a way to get the overview of a corpus and what it lacks compared with the meta-data. After you deploy this code on your own server, please also change the SERVER_API_URL in ![settings.js](https://github.com/creativecolab/CHI2021-CoNotate/blob/master/ChromeExtension/src/settings.js) to the link to your own server.

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
