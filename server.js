import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";

const app = express();
const __dirname = path.resolve();

// API Proxy 要放在最前面
app.use("/api", createProxyMiddleware({
  target: "http://localhost:5000",
  changeOrigin: true,
  pathRewrite: {
    "^/api": "" // 移除 /api 前綴，直接轉發到 Flask
  }
}));

// 提供 React 靜態檔案
app.use(express.static(path.join(__dirname, "build")));

// React router fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(4000, () => {
  console.log("Server running on port 4000");
});
