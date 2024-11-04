# Propel Demo

> This project is a demo of the [Propel](https://propelevents.io/) platform. This project is built with [MetaMask Delegation Toolkit](https://docs.gator.metamask.io/).

## What's inside?

This project includes the following packages/apps:

## Apps and Packages

- `@propel-demo/web`: a [Next.js](https://nextjs.org/) app that contains the frontend of the project
- `@propel-demo/contracts`: a [Hardhat](https://hardhat.org/) project that contains the smart contracts used in the project

## Requirements

- Bun
- Node.js v20.x
- Docker Compose

## Getting Started

The project is set up so you can run the game locally out of the box.

#### 1. Clone the repository

```bash
git clone https://github.com/MetaMask/propel-demo.git
cd propel-demo
```

#### 1.1 Initialize git submodules

```bash
git submodule update --init --recursive
```

#### 2. Installing dependencies

#### 2.1 Setup npm token

- Create a file called `.npmrc` in the root of the project and add the following:

```
@codefi:registry=https://nexus.eu-west-3.codefi.network/repository/npm-hosted/
//nexus.eu-west-3.codefi.network/repository/npm-hosted/:_authToken=<YOUR-NPM-TOKEN>
```

#### 2.2 Install dependencies

```bash
bun install
```

#### 3. Setup environment variables

```bash
cp .env.example .env
```

> [!NOTE]
> Make sure to update the `.env` file with your `INFURA_API_KEY`, since we need it to fork the Sepolia network locally.

#### 3.1 Update UploadThing credentials (It handles file uploads in the project)

Create an account and a project on [UploadThing](https://uploadthing.com/) and get your `APP_ID` and `TOKEN`. Update the `.env` file with your credentials.

#### 3.2 Update Clerk credentials (It handles authentication in the project)

- Create an account and a project on [Clerk](https://clerk.com/) and get your `PUBLISHABLE_KEY` and `SECRET_KEY`. Update the `.env` file with your credentials.
- Go to `Configure/Sessions`and on `Customize session token`, select `Edit`and add the following:

```
{
	"email": "{{user.primary_email_address}}",
	"imageUrl": "{{user.image_url}}",
	"username": "{{user.full_name}}"
}
```

- Also, grab your clerk domain at `Configure/Domains`, we're going to need it later.

#### 3.3 Update Web3Auth credentials (It handles web3 wallet provider in the project)

Create an account and a project on [Web3Auth](https://web3auth.io/) and get your `CLIENT_ID`. Update the `.env` file with your credentials.
Also, on the Web3Auth dashboard, go to `Custom Authentication` and create a new verifier with the following:

- **Name**: `<Choose a name>`
- **Login Provider**: `Custom Provider`
- **JWKS Endpoint**: `https://<your-clerk-domain>/.well-known/jwks.json`
- **JWT Verifier ID**: `Email`
- **JWT Validation**: `"iss": https://<your-clerk-domain>`

Finally, update the `NEXT_PUBLIC_WEB3AUTH_VERIFIER` variable with the name of the verifier you just created.

#### 4. Start local database

```bash
bun db:start
```

#### 4.1 Migrate database

```bash
bun db:migrate
```

#### 5. Start local chain, bundler and mock paymaster. (It takes a while to start on docker)

```bash
bun chain:start
```

> [!TIP]
> Otterscan (local block explorer) is available at http://localhost:5100

#### 6. Deploy contracts and seed database (If you have any issues with the local chain, make sure that it's up and running)

```bash
bun seed
```

##### 7. Local database studio (optional)

```bash
bun db:studio
open https://local.drizzle.studio
```

#### 8. Start the web app in development mode

```bash
bun dev
```

#### 9. Open the web app in your browser

```bash
open http://localhost:3000
```

## References

- [Hardhat](https://hardhat.org/)
- [Next.js](https://nextjs.org/)
- [MetaMask Delegation Toolkit](https://docs.gator.metamask.io/)
- [Infura](https://infura.io/)
- [Hardhat Foundry](https://hardhat.org/hardhat-foundry/)
- [UploadThing](https://uploadthing.com/)
- [Drizzle](https://orm.drizzle.team/docs/get-started-postgresql/)
- [Clerk](https://clerk.com/)
- [Web3Auth](https://web3auth.io/)
- [Propel](https://propelevents.io/)
