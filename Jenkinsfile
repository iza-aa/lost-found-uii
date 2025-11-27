pipeline {
    agent any

    environment {
        // Define environment variables here or in Jenkins credentials
        DOCKER_IMAGE_NAME = 'campus-backend'
        CONTAINER_NAME = 'campus-backend-container'
        PORT = '3000'
        // Default values (override in Jenkins Credentials/Config)
        JWT_EXPIRY = '24h'
        ALLOWED_ORIGINS = '*'
        MAX_UPLOAD_SIZE = '10485760'
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
                    
                    // Force remove existing container to prevent duplicates/conflicts
                    sh "docker rm -f ${CONTAINER_NAME} || true"

                    // Run the new container
                    sh """
                        docker run -d \
                        --name ${CONTAINER_NAME} \
                        -p ${PORT}:3000 \
                        -v /var/www/campus-backend/storage:/root/storage \
                        --env-file /var/www/campus-backend/.env \
                        --restart unless-stopped \
                        ${DOCKER_IMAGE_NAME}
                    """
                }
            }
        }
    }

    post {
        always {
            // Clean up dangling images to save space and prevent duplicates
            sh "docker image prune -f || true"
        }
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed.'
            // Optional: Try to remove the container if it failed to start properly
            sh "docker rm -f ${CONTAINER_NAME} || true"
        }
    }
}
