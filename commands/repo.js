module.exports = {
  name: "repo",
  description: "Get the GitHub repository link",
  type: "command",
  command: ["repo", "github"],
  onCommand: async ({ msg }) => {
    const repo = process.env.GITHUB || "https://github.com/thugkeedxxx/THUGKEED-LITE-MD";

    await msg.reply(`
*🔗 THUGKEED-LITE-MD REPOSITORY:*

📁 GitHub: ${repo}
⭐ Star the repo and contribute if you can!

Powered by THUGKEED TECH 💀
    `);
  }
};
