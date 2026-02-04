# League of Legends Chat Spammer & Sniper

A powerful, standalone desktop application to manage and automate chat messages in League of Legends lobbies. Built with Electron, Next.js, and shadcn/ui.

## Features

-   **Role Sniper**: Automatically claims your preferred role (Top, Mid, Jungle, etc.) instantly when entering a lobby (~200ms reaction time).
-   **LCU Integration**: Direct connection to the League Client Update (LCU) API.
-   **Lobby ID Display**: Shows the internal ID of your current lobby.
-   **Message Management**: Create, save, and manage presets for Funny, Taunt, and Emoji messages.
-   **Desktop App**: Runs as a standalone window, automatically managing the backend service.

## Tech Stack

-   **Frontend**: Next.js 14, Tailwind CSS, shadcn/ui
-   **Backend**: Node.js LCU Service (Hono via `@hono/node-server`)
-   **Desktop**: Electron

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-username/lol-chat-spammer.git
    cd lol-chat-spammer
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Install LCU service dependencies:
    ```bash
    cd mini-services/lcu-service
    npm install
    cd ../..
    ```

## Usage

### Development

Run the following command to start the Electron app along with the Next.js frontend and LCU backend in development mode:

```bash
npm run electron:dev
```

### Build

To build the application for production (executable):

```bash
npm run electron:build
```

(Note: You may need to configure `electron-builder` in `package.json` for specific targets).

## Troubleshooting

-   **LCU Service not connecting**: Ensure League of Legends is running. The app tries to detect the lockfile automatically.
-   **Sniper not working**: Make sure you are in a "Champion Select", "Party", or "Premade" lobby. The sniper only fires once per new lobby ID to avoid spam.

## Disclaimer

This tool is for educational purposes. Use responsibly. Automating actions in games can technically violate ToS, though this tool only interacts with the efficient LCU API for chat.
