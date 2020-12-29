# CoNotate: A Chrome Extension Suggesting Queries Based on Notes (CHI'21)

This repository contains the code for paper “CoNotate: Suggesting Queries Based on Notes Promotes Knowledge Discovery” accepted to CHI 2021.

## Abstract
When exploring a new domain through web search, people struggle to articulate queries because they lack domain-specific language and well-defined informational goals. Perhaps search tools rely too much on the query to understand what a searcher wants. Towards expanding this contextual understanding of a user during exploratory search, we introduce a novel system, CoNotate, that integrates note-taking and searching to suggest queries. To evaluate this approach, we conducted a within-subjects study where participants (n=38) conducted exploratory searches using a baseline system (standard web search) and the CoNotate system, which offers query suggestions based on analyzing the searcher's notes and previous searches for patterns and gaps in information. The CoNotate approach led searchers to issue significantly more queries, and discover more terminology than standard web search. We discuss the challenges and opportunities of context-rich search for knowledge discovery.

![Demo Video](https://www.youtube.com/watch?v=vH3htoAq0Ck&feature=youtu.be)

![Demo1](https://i.imgur.com/GLn5iy9.png)

Please cite our paper if you use our code and result. (citation will be available after the paper is published at CHI'21) For bug reporting or any issues you encounter in the code, please email zding@ucsd.edu.

## Code for Server

The code is in the ![Server](https://github.com/creativecolab/CHI2021-CoNotate/tree/master/Server) folder. A detailed description of the server could be found in the paper.

To guarantee you could still use our extension even after our current server shuts down, we provide the code of our server and you could deploy it on your server. You could also use it separately as a way to get the overview of a corpus and what it lacks compared with the meta-data. After you deploy this code on your own server, please also change the SERVER_API_URL in ![settings.js](https://github.com/creativecolab/CHI2021-CoNotate/blob/master/ChromeExtension/src/settings.js) to the link to your own server.

## Code for Chrome Extension

The code is in the ![ChromeExtension](https://github.com/creativecolab/CHI2021-CoNotate/tree/master/ChromeExtension) folder.

### Chrome Extension Setup (User)
- Open a Google Chrome Browser
- Download the build folder and extract it
- Navigate to chrome://extensions/ and toggle on developer mode (on the top right)
- Drag and drop the extracted build folder into the tab

### Chrome Extension Setup (Developer)
- Dependencies: npm, yarn
- Clone the repo (or download and extract it)
- Navigate to the chromeExtension folder
- Execute: "npm install" and then "yarn watch" in the command line
- Navigate to the chromeExtension/public folder
- Open the manifest.json file and remove the "key" and "client_id" variable
- Open a Google Chrome Browser
- Navigate to chrome://extensions/ and toggle on developer mode (on the top right)
- Navigate to the folder chromeExtension/build and drag it into your tab
- Press pack extension and select the chromeExtension/build folder and then pack the extension (make sure you keep both the crx and pem files, they are critical)
- Navigate a new tab to https://robwu.nl/crxviewer/
- Open the build.crx file that you generated in the chromeExtension folder
- Open up the console
- Go to the manifest.json file in the folder chromeExtension/public and replace the "key"
- Get the "Calculated extension ID" beneath the key in the console
- Go to https://console.developers.google.com/apis/dashboard 
- Press credentials and create an oauth client id using the "Calculated extension ID"
![OAuth](https://user-images.githubusercontent.com/44254631/85097930-efde4000-b1ad-11ea-99b4-8742537d9ed2.png)
- Go to the manifest.json file in the folder chromeExtension/public and replace the "client_id"
- Return to https://console.developers.google.com/apis/dashboard and press on library
- Search for google docs and press on it
- Enable the API
- Navigate to the chromeExtension/src/setting.js file
- Replace data as needed
- Navigate back to chrome://extensions/ and drag the chromeExtension/build folder
- Setup complete

### Chrome Extension Development (Important Files)
- Before each session make sure to navigate to the chromeExtension folder and type "yarn watch"
- settings.js - Centralized location of important variables used throughout the plugin.
- scripts and config folder - The files in these folders deal with webpack and the build process. If you want to import different file loaders or etc., this is the location.
- public folder - This is the template for the build folder. The manifest file in here decides which scripts are loaded into which pages.
- pluginContent.js - The container of the sidebar of the plugin. Decides what to load up in the components folder.
- components folder - The react app which pluginContent.js loads in
- domWatcherContent.js - This is the script that is injected into the google docs (which is loaded in by DocumentEditor.js file in the components folder). It is used to send user input from the google doc to our background.js script.
- mainContent - The script that is injected into every loaded page. Includes the web scraper and the suggestions top bar
- background.js - The hub of the pluginContent, domWatcherContent, and mainContent. Transfers information between these three components as needed and runs data through the server and other APIs
