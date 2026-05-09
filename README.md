# CourtIQ

A website for exploring men's professional ATP tennis data including player stats, tournament history, ranking trends, and match results.

## Project Description
Professional tennis data is widely accessible but difficult for fans to explore in a structured and meaningful way. Raw datasets contain rich information about players, matches, rankings, and tournaments. However, extracting useful insights typically requires complex querying and data manipulation beyond the reach of the average fan. CourtIQ addresses this problem by providing an interactive platform that makes professional men's tennis data explorable for anyone. CourtIQ allows users to search for specific players, browse tournament histories, and explore how match results and player performance have evolved across different seasons and surfaces. The platform combines interactive database queries with visualizations to help users explore trends and comparisons in professional tennis, in a clean and user-friendly interface.

### Dependencies
### Frontend
- react ^18.2.0
- react-dom ^18.2.0
- react-scripts 5.0.1
- recharts ^3.8.1

### Backend
- express ^4.18.2
- cors ^2.8.5
- pg ^8.11.3

### Runtime
- Node.js (v18 or higher recommended)
- npm

## How to Run Locally

### 1. Download the project folder and unzip

### 2. Start the backend
cd server
npm install
npm start

### 3. Start the frontend
cd client
npm install
npm start

### 4. Open the app
Go to http://localhost:3000 in your browser.

### Files and Folders
The Cleaning+Preprocessing file contains all cleaning and preprocessing steps for the data we used.
The client folder contains all files for the frotend, including the webpages and the UI.
The server folder contains all files for the backend, including routes, dependencies, and the configuration to connect to the database.
