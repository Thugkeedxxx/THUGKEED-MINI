# THUGKEED-LITE-MD

A lightweight WhatsApp bot powered by Baileys, built and maintained by THUGKEED TECH.

---

## Features

- Play music from YouTube using `.play <song name>`
- Check if the bot is alive with `.ping`
- Get owner contact with `.owner`
- See available commands with `.menu`
- Get a random quote with `.quote`
- Group info with `.groupinfo`

---

## Setup Instructions

1. Clone the repo:

git clone https://github.com/thugkeedxxx/THUGKEED-LITE-MD.git cd THUGKEED-LITE-MD

2. Install dependencies:

npm install

3. Create a `.env` file with your settings:

PREFIX=! PAIR_SITE=https://your-pair-site-url.com

4. Start the bot:

npm start

---

## Pair Site

The bot uses a pair site to fetch your WhatsApp session so it can connect without QR scanning every time. Deploy your pair site and set its URL in the `.env` file under `PAIR_SITE`.

---

## Commands

| Command       | Description                          |
| ------------- | ---------------------------------- |
| `.play <song>` | Download and send a YouTube song   |
| `.ping`       | Check if bot is online              |
| `.owner`      | Get owner WhatsApp contact          |
| `.menu`       | Show command list                   |
| `.quote`      | Get a random inspirational quote   |
| `.groupinfo`  | Show info about the current group  |

---

## License

MIT © THUGKEED TECH


---


---

✅ config.js

require('dotenv').config();

module.exports = {
  prefix: process.env.PREFIX || '!',
  pairSite: process.env.PAIR_SITE || 'https://thugkeed-lite-md-pair.onrender.com',
  ownerName: 'THUGKEED',
  ownerContact: 'https://whatsapp.com/channel/0029VbB7a9v6LwHqDUERef0M',
  repo: 'https://github.com/thugkeedxxx/THUGKEED-LITE-MD'
};


---


---

✅ render.yaml

services:
  - type: web
    name: thugkeed-lite-md
    env: node
    buildCommand: 'npm install'
    startCommand: 'npm start'
    plan: free


---
