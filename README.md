<div align="center">
  <a href="https://watchtrees.com">
    <img src="https://raw.githubusercontent.com/jkkrow/watchtrees-frontend/main/public/logo.svg" alt="Logo" width="100" height="100">
  </a>
  <h2 align="center">WatchTrees</h2>
  <p align="center">
    A video streaming web application which provides on-demand videos (VOD) in adaptive media formats.
    <br />
    <a href="https://watchtrees.com">
      <strong>Explore the live website »</strong>
    </a>
    <br />
    <br />
    <a href="https://github.com/jkkrow/watchtrees-frontend">Frontend App</a>
    ·
    <a href="https://github.com/jkkrow/watchtrees-backend">Backend API</a>
    ·
    <a href="https://github.com/jkkrow/watchtrees-lambda">Lambda Code</a>
  </p>
</div>

## Backend API

This repository is a REST API for [WatchTrees](https://watchtrees.com) to handle requests of frontend app.

### Built with

- ![Typescript](https://img.shields.io/badge/Typescript-3178C6.svg?&style=for-the-badge&logo=Typescript&logoColor=white)
- ![Node.js](https://img.shields.io/badge/Node.js-339933.svg?&style=for-the-badge&logo=Node.js&logoColor=white)
- ![Express](https://img.shields.io/badge/Express-000000.svg?&style=for-the-badge&logo=Express&logoColor=white)
- ![MongoDB](https://img.shields.io/badge/MongoDB-47A248.svg?&style=for-the-badge&logo=MongoDB&logoColor=white)
- ![Amazon AWS](https://img.shields.io/badge/AWS-232F3E.svg?&style=for-the-badge&logo=Amazon+AWS&logoColor=white)
- ![Docker](https://img.shields.io/badge/Docker-2496ED.svg?&style=for-the-badge&logo=Docker&logoColor=white)
- ![Serverless](https://img.shields.io/badge/Serverless-FD5750.svg?&style=for-the-badge&logo=Serverless&logoColor=white)


## Features

This application has following features:

- **Multipart Video Upload**: It allows user to upload videos to AWS S3 using presigned url, which is integrated with multipart upload.

- **User Authentication**: It allows user to sign up and upload videos to share them. You can either sign up with email and password, or using a 3rd party provider (Google account).

- **Token Based Authorization**: It authorizes user with JSON Web Tokens (JWT), by rotating access token with refresh token.

- **Continuous Integration & Continuous Deployment (CI/CD)**: It automates build and deploy process with Github Action and Serverless Framework.

## Getting Started

To start the project, clone the repository and install dependencies with following command:

```bash
npm install
```

You need to setup environment variables. Create `.env` file and configure necessary variables. Then, start the app by running:

```bash
npm run dev
```

Alternatively, you can start app with different tools. It has multiple options for deployment and development environment.

- Docker
- Serverless Framework

### Running the application with Docker

To start the application with Docker, run following command:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

It will run the application in the dev environment hosted on [http://localhost:5000](http://localhost:5000). To stop running Docker app, run:

```bash
docker-compose -f docker-compose.dev.yml down
```

### Running the application with Serverless Framework

To start the application with Serverless Framework, run following command:

```bash
serverless offline
```

It will run the serverless application hosted on [http://127.0.0.1:3000/dev](http://127.0.0.1:3000/dev).

## Tests

This application uses Jest library for testing. To execute a test job, run following command:

```bash
npm run test
```

## Related Apps

Here are related applications of WatchTrees project.

- [WatchTrees Frontend](https://github.com/jkkrow/watchtrees-frontend): A frontend app of WatchTrees created with React and Redux.
- [WatchTrees Lambda](http://github.com/jkkrow/watchtrees-lambda): An AWS Lambda function code for running serverless jobs.
