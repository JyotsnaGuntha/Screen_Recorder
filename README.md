# Screen Recorder - MERN Application

A full-stack web application that allows users to record their browser tab with microphone audio, preview the recording, and manage a list of saved videos.

## Live Demo

* **Frontend (Vercel)**: https://screen-recorder-teal.vercel.app/


## Features

* **Tab & Microphone Recording**: Captures the current browser tab and system microphone simultaneously.
* **Live Preview**: Instantly preview your recording after stopping.
* **Download & Upload**: Download recordings locally or upload them to the server.
* **Video Management**: View a list of all uploaded recordings.
* **Rename & Delete**: Edit the titles of your recordings or delete them entirely.
* **Responsive UI**: A modern, visually appealing interface built with Tailwind CSS.


## Tech Stack

* **Frontend**: React, Vite, Tailwind CSS
* **Backend**: Node.js, Express.js
* **Database**: SQLite
* **File Handling**: Multer


## Local Setup

To run this project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/JyotsnaGuntha/Screen_Recorder.git
    cd Screen_Recorder
    ```
2.  **Setup Backend:**
    ```bash
    cd backend
    npm install
    npm start
    ```
3.  **Setup Frontend (in a new terminal):**
    ```bash
    cd frontend
    yarn install
    yarn dev
    ```
The application will be available at `http://localhost:5173`.


## Known Limitations

* The backend is deployed on Render's free tier, which has an ephemeral filesystem. This means uploaded video files will be deleted after a period of inactivity. For a production environment, files should be stored in a dedicated cloud storage service like AWS S3.
