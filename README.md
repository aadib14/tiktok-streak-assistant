# TikTok Streak Assistant

A small project I made to help keep TikTok streaks with friends without having to send messages manually every time.

Built with Node.js and Playwright. It lets me manage my friend list, customize messages, and automate sending messages on a schedule using Windows Task Scheduler.

## Getting Started

Clone the repository and install the dependencies.

```bash
git clone https://github.com/aadib14/tiktok-streak-assistant.git
cd tiktok-streak-assistant
npm install
```

Make sure `config/config.json` is set up before running the bot.

## Usage

Run the interactive menu:

```bash
npm start
```

Run scheduled mode:

```bash
npm run start:scheduled
```

Scheduled mode starts processing as soon as the program runs, so Windows Task Scheduler is used to control when it starts.

## Project Structure

- `bot.js` - Main program
- `src/` - Helper modules
- `config/` - Local configuration
- `data/` - Activity logs
- `tests/` - Testing scripts

Just a personal project to learn automation and make keeping streaks a little easier.