███████╗     ██████╗██╗      ██████╗ ███╗   ██╗███████╗██████╗
╚══███╔╝    ██╔════╝██║     ██╔═══██╗████╗  ██║██╔════╝██╔══██╗
  ███╔╝     ██║     ██║     ██║   ██║██╔██╗ ██║█████╗  ██████╔╝
 ███╔╝      ██║     ██║     ██║   ██║██║╚██╗██║██╔══╝  ██╔══██╗
███████╗    ╚██████╗███████╗╚██████╔╝██║ ╚████║███████╗██║  ██║
╚══════╝     ╚═════╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝



⚡ Z Cloner
A powerful, fully-featured Discord Server Cloner built with Node.js. Z Cloner allows you to seamlessly replicate a server's structure—including channels, roles, permissions, and emojis—using a combination of a Discord Bot account and a User account (selfbot) to read the source server.

Designed with an interactive Discord UI and dynamic configuration, making it easy to deploy and use directly on Railway.

✨ Features
Interactive UI: Toggle exactly what you want to clone or delete using Discord Buttons.
Dynamic Setup: Don't want to put your tokens in the ENV variables? Use !setid and !settoken to configure the bot dynamically in-chat.
Comprehensive Cloning:
🗑️ Delete existing Channels, Roles, and Emojis.
📋 Clone Categories, Text Channels, and Voice Channels with exact permissions.
🎭 Clone Roles with exact colors, hoist, and permission bitfields.
😄 Clone Emojis (respects rate limits and server boost tiers).
Permission Aware: Automatically maps source server role permissions to the target server roles.
Cloud Ready: Pre-configured for Railway deployment using nixpacks.toml.

| Command | Description |
| :--- | :--- |
| `!help` | Displays the help menu with all available commands. |
| `!setid` | **(Admin Only)** Claims the bot if `ALLOWED_ID` is not set in environment variables. |
| `!settoken <token>` | Provides the selfbot user token to the bot if `DC_TOKEN` is not set. Auto-deletes your message for security. |
| `!clone <source_id> <target_id>` | Starts the cloning process from the source server to the target server. |

| Variable | Required | Description |
| :--- | :--- | :--- |
| `BOT_TOKEN` | ✅ Yes | The token for your Discord Bot account. |
| `DC_TOKEN` | ❌ Optional* | The token for your Discord User account (selfbot). If left empty, the bot will ask you to use `!settoken`. |
| `ALLOWED_ID` | ❌ Optional* | Your Discord User ID. If left empty, an Administrator can claim the bot using `!setid`. |

*Note: While optional in the environment variables, both are required for the bot to function. If not provided in ENV, they must be provided via chat commands. Setting them in ENV is recommended so you don't have to re-enter them if the bot restarts.

☁️ Deployment on Railway
Upload to GitHub: Create a new repository and push the index.js, package.json, nixpacks.toml, and .gitignore files.
Create Railway Project: Go to Railway.app, create a New Project, and select Deploy from GitHub repo.
Connect Repo: Select the repository you just created.
Set Variables: Go to the Variables tab in your Railway project and add your BOT_TOKEN, DC_TOKEN, and ALLOWED_ID.
Deploy: Railway will automatically detect the Node.js environment via Nixpacks, run npm install, and start the bot using node index.js.
🛠️ Local Development
If you want to run the bot on your own machine:

Ensure you have Node.js (v20.18.0 or higher) installed.
Clone the repository:
bash

git clone https://github.com/your-username/z-cloner.git
cd z-cloner
Install dependencies:

npm install
Create a .env file in the root directory and add your tokens:
env

BOT_TOKEN=your_bot_token_here
DC_TOKEN=your_user_token_here
ALLOWED_ID=your_discord_id_here

Start the bot:

npm start
⚠️ Disclaimer
This bot utilizes discord.js-selfbot-v13 to read source server data. Using selfbots violates Discord's Terms of Service. By using this software, you acknowledge that you are doing so at your own risk. The developer is not responsible for any action taken against your Discord account. Use it wisely and avoid running it on accounts you cannot afford to lose.

📄 License
This project is licensed under the ISC License.

