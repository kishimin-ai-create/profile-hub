<div id="top"></div>

##

<!--  -->
<!-- -->
<p style="display: inline">
  <!--  -->
  <img src="https://img.shields.io/badge/-Node.js-000000.svg?logo=node.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-Next.js-000000.svg?logo=next.js&style=for-the-badge">
  <img src="https://img.shields.io/badge/-TailwindCSS-000000.svg?logo=tailwindcss&style=for-the-badge">
  <img src="https://img.shields.io/badge/-React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB">
  <!--  -->
  <img src="https://img.shields.io/badge/-Django-092E20.svg?logo=django&style=for-the-badge">
  <!--  -->
  <img src="https://img.shields.io/badge/-Python-F2C63C.svg?logo=python&style=for-the-badge">
  <!--  -->
  <img src="https://img.shields.io/badge/-Nginx-269539.svg?logo=nginx&style=for-the-badge">
  <img src="https://img.shields.io/badge/-MySQL-4479A1.svg?logo=mysql&style=for-the-badge&logoColor=white">
  <img src="https://img.shields.io/badge/-Gunicorn-199848.svg?logo=gunicorn&style=for-the-badge&logoColor=white">
  <!--  -->
  <img src="https://img.shields.io/badge/-Docker-1488C6.svg?logo=docker&style=for-the-badge">
  <img src="https://img.shields.io/badge/-githubactions-FFFFFF.svg?logo=github-actions&style=for-the-badge">
  <img src="https://img.shields.io/badge/-Amazon%20aws-232F3E.svg?logo=amazon-aws&style=for-the-badge">
  <img src="https://img.shields.io/badge/-terraform-20232A?style=for-the-badge&logo=terraform&logoColor=844EBA">
</p>

##

1. [](#)
2. [](#)
3. [](#)
4. [](#)
5. [](#)

<!-- README -->
<br />
<div align="right">
    <a href="README"><strong>README »</strong></a>
</div>
<br />
<!-- Dockerfile -->
<div align="right">
    <a href="Dockerfile"><strong>Dockerfile »</strong></a>
</div>
<br />
<!--  -->

##

ReactDRFTerraform

<!--  -->

##

ReactDRFTerraform

<!--  -->

  <p align="left">
    <br />
    <!-- BacklogWiki -->
    <a href="Backlogwiki"><strong> »</strong></a>
    <br />
    <br />

<p align="right">(<a href="#top"></a>)</p>

##

<!--  -->

|   |  |
| --------------------- | ---------- |
| Python                | 3.11.4     |
| Django                | 4.2.1      |
| Django Rest Framework | 3.14.0     |
| MySQL                 | 8.0        |
| Node.js               | 16.17.0    |
| React                 | 18.2.0     |
| Next.js               | 13.4.6     |
| Terraform             | 1.3.6      |

 pyproject.toml  package.json

<p align="right">(<a href="#top"></a>)</p>

##

<!-- Tree -->

❯ tree -a -I "node_modules|.next|.git|.pytest_cache|static" -L 2
.
├── .devcontainer
│ └── devcontainer.json
├── .env
├── .github
│ ├── action
│ ├── release-drafter.yml
│ └── workflows
├── .gitignore
├── Makefile
├── README.md
├── backend
│ ├── .vscode
│ ├── application
│ ├── docs
│ ├── manage.py
│ ├── output
│ ├── poetry.lock
│ ├── project
│ └── pyproject.toml
├── containers
│ ├── django
│ ├── front
│ ├── mysql
│ └── nginx
├── docker-compose.yml
├── frontend
│ ├── .gitignore
│ ├── README.md
│ ├── **test**
│ ├── components
│ ├── features
│ ├── next-env.d.ts
│ ├── package-lock.json
│ ├── package.json
│ ├── pages
│ ├── postcss.config.js
│ ├── public
│ ├── styles
│ ├── tailwind.config.js
│ └── tsconfig.json
└── infra
├── .gitignore
├── docker-compose.yml
├── main.tf
├── network.tf
└── variables.tf

<p align="right">(<a href="#top"></a>)</p>

##

<!--  -->

###

.env [](#)

.env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=django-db
MYSQL_USER=django
MYSQL_PASSWORD=django
MYSQL_HOST=db
MYSQL_PORT=3306
SECRET_KEY=django
DJANGO_SETTINGS_MODULE=project.settings.local

.env

make prepare

###

http://127.0.0.1:8000


###



make down

###

|                  |                                       |                        | DEV                            |
| ---------------------- | ----------------------------------------- | ---------------------------------- | ---------------------------------------- |
| MYSQL_ROOT_PASSWORD    | MySQL Docker  | root                               |                                          |
| MYSQL_DATABASE         | MySQL Docker    | django-db                          |                                          |
| MYSQL_USER             | MySQL Docker          | django                             |                                          |
| MYSQL_PASSWORD         | MySQL Docker        | django                             |                                          |
| MYSQL_HOST             | MySQL Docker          | db                                 |                                          |
| MYSQL_PORT             | MySQL Docker        | 3306                               |                                          |
| SECRET_KEY             | Django                  | secretkey                          |  |
| ALLOWED_HOSTS          |               | localhost 127.0.0.1 [::1] back web |                        |
| DEBUG                  |                   | True                               | False                                    |
| TRUSTED_ORIGINS        | CORS                    | http://localhost                   |                                          |
| DJANGO_SETTINGS_MODULE | Django    | project.settings.local             | project.settings.dev                     |

###

| Make                |                                                             |                                                                                |
| ------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| make prepare        | node_modules  | docker-compose run --rm front npm install<br>docker-compose up -d --build                  |
| make up             |                                                           | docker-compose up -d                                                                       |
| make build          |                                                         | docker-compose build                                                                       |
| make down           |                                                           | docker-compose down                                                                        |
| make loaddata       |                                                       | docker-compose exec app poetry run python manage.py loaddata crm.json                      |
| make makemigrations |                                           | docker-compose exec app poetry run python manage.py makemigrations                         |
| make migrate        |                                                   | docker-compose exec app poetry run python manage.py migrate                                |
| make show_urls      |                                   | docker-compose exec app poetry run python manage.py show_urls                              |
| make shell          |                                                       | docker-compose exec app poetry run python manage.py debugsqlshell                          |
| make superuser      |                                                     | docker-compose exec app poetry run python manage.py createsuperuser                        |
| make test           |                                                             | docker-compose exec app poetry run pytest                                                  |
| make test-cov       |                                   | docker-compose exec app poetry run pytest --cov                                            |
| make format         | black  isort                                      | docker-compose exec app poetry run black . <br> docker-compose exec app poetry run isort . |
| make update         | Poetry                                              | docker-compose exec app poetry update                                                      |
| make app            |                                         | docker exec -it app bash                                                                   |
| make db             |                                             | docker exec -it db bash                                                                    |
| make pdoc           | pdoc                                                  | docker-compose exec app env CI_MAKING_DOCS=1 poetry run pdoc -o docs application           |
| make init           | Terraform                                                       | docker-compose -f infra/docker-compose.yml run --rm terraform init                         |
| make fmt            | Terraform                                   | docker-compose -f infra/docker-compose.yml run --rm terraform fmt                          |
| make validate       | Terraform                           | docker-compose -f infra/docker-compose.yml run --rm terraform validate                     |
| make show           |                                               | docker-compose -f infra/docker-compose.yml run --rm terraform show                         |
| make apply          | Terraform                                                   | docker-compose -f infra/docker-compose.yml run --rm terraform apply                        |
| make destroy        | Terraform                                     | docker-compose -f infra/docker-compose.yml run --rm terraform destroy                      |

###

  url <br>
[Django ](https://qiita.com/shun198/items/9e4fcb4479385217c323)

##

### .env: no such file or directory

.env

### docker daemon is not running

Docker Desktop

### Ports are not available: address already in use


<br>

<br>
[ Ports are not available: address already in use ](https://qiita.com/shun198/items/ab6eca4bbe4d065abb8f)

### Module not found

make build

 Docker image

<p align="right">(<a href="#top"></a>)</p>
