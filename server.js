import express from "express";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.static("."));

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID || "";

app.post("/deploy", async (req, res) => {
  try {
    const { html, name = "nexa-studio" } = req.body;

    if (!VERCEL_TOKEN || !VERCEL_PROJECT_ID) {
      return res.status(400).json({
        error: "Set environment variable VERCEL_TOKEN dan VERCEL_PROJECT_ID dulu."
      });
    }

    if (!html) {
      return res.status(400).json({ error: "Field html wajib diisi." });
    }

    const encodedHtml = Buffer.from(html).toString("base64");

    const url = new URL("https://api.vercel.com/v13/deployments");
    url.searchParams.set("projectId", VERCEL_PROJECT_ID);
    if (VERCEL_TEAM_ID) url.searchParams.set("teamId", VERCEL_TEAM_ID);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name,
        project: VERCEL_PROJECT_ID,
        target: "production",
        public: true,
        files: [
          {
            file: "index.html",
            data: encodedHtml
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || "Gagal membuat deployment."
      });
    }

    return res.json({
      success: true,
      deploymentUrl: `https://${data.url}`
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("Server berjalan di http://localhost:3000");
});
