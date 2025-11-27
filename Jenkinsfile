pipeline {
    agent any

    environment {
        // Define environment variables here or in Jenkins credentials
        DOCKER_IMAGE_NAME = 'campus-backend'
        CONTAINER_NAME = 'campus-backend-container'
        PORT = '3000'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    echo 'Building Docker Image...'
                    // Build the docker image
                    sh "docker build -t ${DOCKER_IMAGE_NAME} ."
                }
            }
        }

        stage('Deploy to VPS') {
            steps {
                script {
                    echo 'Deploying to VPS...'
                    
                    // Stop and remove existing container if it exists
                    // Using try-catch or allowing failure in case container doesn't exist yet
                    sh """
                        docker stop ${CONTAINER_NAME} || true
                        docker rm ${CONTAINER_NAME} || true
                    """

                    // Run the new container
                    // Mapping port 3000 on host to 3000 on container
                    // Passing environment variables if needed. 
                    // IMPORTANT: Make sure to set actual DB credentials in Jenkins Credentials and inject them here.
                    // Example: --env DATABASE_URL=${DATABASE_URL}
                    sh """
                        docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p ${PORT}:3000 \
                        --restart unless-stopped \
                        ${DOCKER_IMAGE_NAME}
                    """
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed.'
        }
    }
}
