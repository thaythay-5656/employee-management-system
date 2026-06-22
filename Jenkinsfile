def runCommand(String linuxCommand, String windowsCommand = null) {
  if (isUnix()) {
    sh linuxCommand
  } else {
    bat windowsCommand ?: linuxCommand
  }
}

pipeline {
  agent any

  environment {
    REGISTRY = 'ghcr.io'
    IMAGE_BACKEND = 'ghcr.io/soysanny/ems-backend'
    IMAGE_FRONTEND = 'ghcr.io/soysanny/ems-frontend'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Set Image Tag') {
      steps {
        script {
          env.IMAGE_TAG = env.BRANCH_NAME == 'main' ? 'latest' : 'develop'
        }
      }
    }

    stage('Backend Tests') {
      steps {
        dir('backend/employee_management') {
          withEnv([
            'SECRET_KEY=jenkins-test-secret-key',
            'DEBUG=True',
            'DB_ENGINE=django.db.backends.sqlite3'
          ]) {
            script {
              runCommand('python3 -m pip install -r requirements.txt', 'python -m pip install -r requirements.txt')
              runCommand('python3 manage.py migrate --noinput', 'python manage.py migrate --noinput')
              runCommand('python3 manage.py test ems --verbosity=2', 'python manage.py test ems --verbosity=2')
            }
          }
        }
      }
    }

    stage('Frontend Build') {
      steps {
        dir('frontend/employee-hub') {
          script {
            runCommand('npm install --legacy-peer-deps')
            runCommand('npm run build')
          }
        }
      }
    }

    stage('Build Docker Images') {
      steps {
        script {
          runCommand(
            "docker build -t ${IMAGE_BACKEND}:${IMAGE_TAG} backend/employee_management",
            "docker build -t %IMAGE_BACKEND%:%IMAGE_TAG% backend/employee_management"
          )
          runCommand(
            "docker build -t ${IMAGE_FRONTEND}:${IMAGE_TAG} frontend/employee-hub",
            "docker build -t %IMAGE_FRONTEND%:%IMAGE_TAG% frontend/employee-hub"
          )
        }
      }
    }

    stage('Push Docker Images') {
      when {
        anyOf {
          branch 'main'
          branch 'develop'
        }
      }
      steps {
        withCredentials([usernamePassword(
          credentialsId: 'ghcr-credentials',
          usernameVariable: 'GHCR_USER',
          passwordVariable: 'GHCR_TOKEN'
        )]) {
          script {
            runCommand(
              'echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin',
              'echo %GHCR_TOKEN% | docker login ghcr.io -u %GHCR_USER% --password-stdin'
            )
            runCommand(
              "docker push ${IMAGE_BACKEND}:${IMAGE_TAG}",
              "docker push %IMAGE_BACKEND%:%IMAGE_TAG%"
            )
            runCommand(
              "docker push ${IMAGE_FRONTEND}:${IMAGE_TAG}",
              "docker push %IMAGE_FRONTEND%:%IMAGE_TAG%"
            )
          }
        }
      }
    }

    stage('Deploy With Docker Compose') {
      when {
        branch 'develop'
      }
      steps {
        script {
          runCommand('docker compose up -d --build', 'docker-compose up -d --build')
        }
      }
    }
  }

  post {
    always {
      script {
        runCommand('docker images | grep ems || true', 'docker images | findstr ems || exit /b 0')
      }
    }
  }
}
