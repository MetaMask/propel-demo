# Popup City Stunt

> A template for building apps on-chain with Solidity and Next.js

## What's inside?

This project includes the following packages/apps:

## Apps and Packages

- `@popup-city/web`: a [Next.js](https://nextjs.org/) app that contains the frontend of the project
- `@popup-city/contracts`: a [Hardhat](https://hardhat.org/) project that contains the smart contracts used in the project

## Requirements

- Bun
- Node.js v20.x
- Docker Compose

## Getting Started

The project is set up so you can run the game locally out of the box.

#### 1. Clone the repository

```bash
git clone https://github.com/MetaMask/stunt-popup-city.git
cd stunt-popup-city
```

#### 2. Install dependencies

```bash
bun install
```

#### 3. Setup environment variables

```bash
cp .env.example .env
```

> [!NOTE]
> Make sure to update the `.env` file with your `INFURA_API_KEY`, since we need it to fork the Sepolia network locally.

#### 4. Start local database

```bash
bun db:start
```

##### 4.1 Local database studio (optional)

```bash
bun db:studio
open https://local.drizzle.studio
```

#### 5. Start local chain, bundler and mock paymaster

```bash
bun chain:start
```

> [!TIP]
> Otterscan (local block explorer) is available at http://localhost:5100

#### 6. Deploy contracts and seed database

```bash
bun seed
```

#### 7. Start the web app in development mode

```bash
bun dev
```

#### 8. Open the web app in your browser

```bash
open http://localhost:3000
```

## Deploying to Production

In order to deploy the game to production, you'll need to update the `.env` file with the correct values.
Then,...

> [!NOTE]
> This section is still work in progress.

## References

- [Hardhat](https://hardhat.org/)
- [Next.js](https://nextjs.org/)
