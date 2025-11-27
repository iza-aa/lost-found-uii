pipeline {
    agent any

    environment {
        // Define environment variables here or in Jenkins credentials
        DOCKER_IMAGE_NAME = 'campus-lost-found'
        CONTAINER_NAME = 'campus-lost-found-container'
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
                    
                    // 1. Backup: Rename existing container to -backup
                    // Remove old backup if exists
                    sh "docker rm -f ${CONTAINER_NAME}-backup || true"
                    // Rename current running container to backup (if exists)
                    sh "docker rename ${CONTAINER_NAME} ${CONTAINER_NAME}-backup || true"
                    // Stop the backup container to free up the port
                    sh "docker stop ${CONTAINER_NAME}-backup || true"

                    // 2. Deploy: Run the new container
                    try {
                        sh """
                            docker run -d \
                            --name ${CONTAINER_NAME} \
                            -p ${PORT}:3000 \
                            -v /var/www/campus-lost-found/storage:/root/storage \
                            --env-file /var/www/campus-lost-found/.env \
                            --sysctl net.ipv6.conf.all.disable_ipv6=1 \
                            --restart unless-stopped \
                            ${DOCKER_IMAGE_NAME}
                        """
                        
                        // 3. Health Check: Wait 10s and check if container is still running
                        echo 'Performing Health Check...'
                        sleep 10
                        // Check if container is running. If not, this command fails (exit code 1)
                        sh "docker ps -f name=${CONTAINER_NAME} | grep ${CONTAINER_NAME}"
                        
                    } catch (Exception e) {
                        echo "Deployment failed or Health Check failed: ${e.message}"
                        currentBuild.result = 'FAILURE'
                        error("Deployment failed")
                    }
                }
            }
        }
    }

    post {
        always {
            // Clean up dangling images
            sh "docker image prune -f || true"
        }
        success {
            echo 'Deployment successful! Removing backup container...'
            sh "docker rm -f ${CONTAINER_NAME}-backup || true"
        }
        failure {
            script {
                // Only rollback if a backup exists (meaning we failed DURING deployment)
                // If build failed, backup won't exist, and we shouldn't touch the running container.
                def backupExists = sh(script: "docker ps -a -q -f name=${CONTAINER_NAME}-backup", returnStdout: true).trim()
                
                if (backupExists) {
                    echo 'Deployment failed during container switch. Rolling back...'
                    
                    // 1. Remove the failed new container (if it exists)
                    sh "docker rm -f ${CONTAINER_NAME} || true"
                    
                    // 2. Restore the backup container
                    sh "docker rename ${CONTAINER_NAME}-backup ${CONTAINER_NAME} || true"
                    sh "docker start ${CONTAINER_NAME} || true"
                    
                    echo 'Rollback completed.'
                } else {
                    echo 'Build failed before deployment. Production container is safe and untouched.'
                }
            }
        }
    }
}
