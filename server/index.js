const path = require("path");
require("dotenv").config({
  path: path.resolve(__dirname, ".env"),
});

const express = require("express");
const cors = require("cors");

const { initDatabase } = require("./database");
const draftsRouter = require("./routes/drafts");
const contentRouter = require("./routes/content");
const personasRouter = require("./routes/personas");
const articlesRouter = require("./routes/articles");
const favoritesRouter = require("./routes/favorites");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    modelEnabled: Boolean(process.env.DEEPSEEK_API_KEY),
    modelBaseUrl: process.env.DEEPSEEK_BASE_URL || "",
    modelName: process.env.DEEPSEEK_MODEL || "",
    port: PORT,
  });
});

app.use("/api/drafts", draftsRouter);
app.use("/api/content", contentRouter);
app.use("/api/personas", personasRouter);
app.use("/api/articles", articlesRouter);
app.use("/api/favorites", favoritesRouter);

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(
        `DeepSeek enabled: ${Boolean(process.env.DEEPSEEK_API_KEY)}`
      );
    });
  })
  .catch((error) => {
    console.error("数据库初始化失败：", error);
    process.exit(1);
  });