# Local Development Environment Setup

- Run `git clone` to clone this repository.
- Install Node.js from https://nodejs.org.
- Navigate to the `database/docker/postgres` in the repo using the command line:
  - Run `docker-compose up`.
- Create a `.env.local` file inside the `etl` and `app/server` folders, and populate it using the `.env.example` files as a reference (get the values for the GLOSSARY_AUTH and MV_API_KEY environment variables from the technical lead or project manager):
  - The `DB_USERNAME` and `DB_PASSWORD` values need to be a for a user with admin priveleges.
  - The `EQ_USERNAME` and `EQ_PASSWORD` values can be whatever you want.
- Navigate to the `etl` folder in the repo using the command line:	
  - Run `npm run start`.
  - When the etl completes, type `ctrl + C` to stop the etl.
- Navigate to the `app/` folder in the repo using the command line:	
  - Run `npm run setup`.
  - Run `npm start` to start a local web server to support development.
