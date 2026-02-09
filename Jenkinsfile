pipeline {
    agent any

    environment {
        CI                = 'true'
        REGISTRY          = 'ghcr.io'
        IMAGE_NAME        = 'egysaas25-hub/ai-monitor-sdk'
        GITHUB_TOKEN      = credentials('github-token')
        SERVER_SSH_KEY    = credentials('server-ssh-key')
        SERVER_HOST       = credentials('server-host')
        SERVER_USER       = 'root'
        DEPLOY_PATH       = '/opt/fitcoach'
    }

    stages {
        stage('Install') {
            steps {
                sh 'corepack enable && corepack prepare pnpm@9 --activate'
                sh 'pnpm install --frozen-lockfile'
            }
        }

        stage('Lint & Test') {
            parallel {
                stage('Lint')  { steps { sh 'pnpm lint' } }
                stage('Test')  { steps { sh 'pnpm test' } }
            }
        }

        stage('Build') {
            steps { sh 'pnpm build' }
        }

        stage('Docker Build & Push') {
            when { branch 'main' }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'github-registry',
                        usernameVariable: 'GH_USER',
                        passwordVariable: 'GH_TOKEN'
                    )]) {
                        sh 'echo $GH_TOKEN | docker login ghcr.io -u $GH_USER --password-stdin'
                        sh """
                            docker build \
                              -t ${REGISTRY}/${IMAGE_NAME}:latest \
                              -t ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} .
                        """
                        sh "docker push ${REGISTRY}/${IMAGE_NAME}:latest"
                        sh "docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    }
                }
            }
        }

        stage('Deploy') {
            when { branch 'main' }
            steps {
                sshagent(['server-ssh-key']) {
                    sh """
                        ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} '
                            cd ${DEPLOY_PATH} &&
                            docker compose pull ai-monitor &&
                            docker compose up -d ai-monitor prometheus grafana &&
                            docker system prune -f
                        '
                    """
                }
            }
        }
    }

    post {
        always { cleanWs() }
    }
}
