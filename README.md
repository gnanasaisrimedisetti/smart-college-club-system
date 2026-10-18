# Smart College Club Membership and Event Management System

A beginner-friendly full-stack website built with HTML, CSS, JavaScript, Node.js, and Express. It demonstrates set operations on student club memberships.

## Features
- Add and delete students and clubs.
- Add and remove student-to-club memberships.
- Create events and select the clubs required for eligibility.
- Find students eligible for an event (students must belong to every required club).
- Compare two clubs using union, intersection, and set differences.
- Save data in `data.json` so it remains after restarting the server.
- Responsive dashboard for desktop and mobile.

## Requirements
Install Node.js LTS and Visual Studio Code. Internet is only needed for the optional Google Fonts stylesheet.

## Run in VS Code
1. Extract this ZIP file.
2. Open the `smart-college-club-system` folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run `npm install`.
5. Run `npm start`.
6. Open `http://localhost:3000` in your browser.
7. Stop the server with `Ctrl+C` in the terminal.

The first run creates `data.json` with sample students, clubs, memberships, and events. To reset the demo data, stop the server, delete `data.json`, and run `npm start` again.

## Project structure
```
smart-college-club-system/
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
├── package.json
├── server.js
└── README.md
```

## API overview
- `GET /api/students`, `POST /api/students`, `DELETE /api/students/:id`
- `GET /api/clubs`, `POST /api/clubs`, `DELETE /api/clubs/:id`
- `GET /api/memberships`, `POST /api/memberships`, `DELETE /api/memberships?studentId=1&clubId=1`
- `GET /api/events`, `POST /api/events`, `DELETE /api/events/:id`
- `GET /api/analysis?clubA=1&clubB=2`
- `GET /api/events/:id/eligible`

## Set operation logic
Let A be the set of members of Club A and B the set of members of Club B.
- Union: `A ∪ B` = members in A or B or both.
- Intersection: `A ∩ B` = members in both A and B.
- Difference: `A − B` = members in A but not B.
- Event eligibility: a student must belong to every club selected as required by the event.

## Important deployment note
This is a local development version. `localhost` is available only on the computer running the server. To let other devices access it, deploy the Node.js app to a hosting service that supports persistent storage, or configure a suitable shared database before production use. The included JSON file is appropriate for a classroom demo, not multiple users editing at the same time. Add login/roles and stronger validation before using real student information.
