// /api/chat.js
export default async function handler(req, res) {
    const apiKey = process.env.OPENROUTER_API_KEY;
  
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
  
    const data = await response.json();
    res.status(response.status).json(data);
  }
  