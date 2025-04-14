# Studyfront backend 

## Getting started 

The backend server can be run localy br running the command: 
```bash
node Express.js
```

## Docker 

To build the frontend in an Docker container run the following command;
```bash
docker build -t studyfront-backend .
```

To run the frontend in an Docker container run the following command; (this will force a rebuild of the Docker image before starting the container)
```bash
docker-compose up --build -d
```

The container can be started without rebuilding using this command;
```bash
docker-compose up -d
```