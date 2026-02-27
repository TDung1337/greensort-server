import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

app.use(cors());
app.use(express.json({ limit: "15mb" })); // Tăng nhẹ limit để tránh lỗi ảnh lớn

/* ===== TEST ROUTE ===== */
app.get("/", (req, res) => {
  res.json({ 
    status: "online", 
    message: "GreenSort AI Server is running 🌱",
    author: "Đức Toàn"
  });
});

/* ===== PROMPT BUILDER ===== */
const buildPrompt = (lang) => {
  const isVi = lang === 'vi';
  const categories = isVi 
    ? '"Chất thải hữu cơ", "Chất thải tái chế", "Chất thải nguy hại", "Chất thải khó phân hủy", "Không phải rác"'
    : '"Organic Waste", "Recyclable Waste", "Hazardous Waste", "General Waste", "Not Waste"';

  return `Analyze this image and return ONLY a valid JSON object.
The response language MUST BE in ${isVi ? 'Vietnamese' : 'English'}.

Required JSON Structure:
{
 "object": "Name of the detected item",
 "material": "Main material (e.g., Plastic, Paper, Metal)",
 "category": "MUST BE EXACTLY ONE OF THESE: ${categories}",
 "instruction": "Short, clear disposal instruction",
 "tip": "Short environmental tip related to this item",
 "confidence": <integer between 70 and 99>
}`;
};

/* ===== AI ROUTE ===== */
app.post("/analyze", async (req, res) => {
  try {
    const { image, mime, lang = 'vi' } = req.body;

    if (!image) {
      return res.status(400).json({ error: "No image provided" });
    }

    if (!API_KEY) {
      console.error("❌ MISSING API_KEY: Hãy kiểm tra Environment Variables trên Render.");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // SỬA ĐỔI QUAN TRỌNG: Sử dụng API v1 và model gemini-1.5-flash để ổn định nhất
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildPrompt(lang) },
            {
              inlineData: {
                mimeType: mime || "image/jpeg",
                data: image
              }
            }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.4 // Giảm temperature để kết quả phân loại rác chính xác hơn
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini API Error Details:", JSON.stringify(data));
      throw new Error(`Gemini Error ${response.status}: ${data.error?.message || "Unknown error"}`);
    }

    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("AI returned empty content");
    }

    // Trả về trực tiếp JSON từ AI
    res.json(JSON.parse(textResponse));

  } catch (err) {
    console.error("❌ SERVER ERROR:", err.message);

    const isVi = req.body.lang === 'vi';
    res.status(500).json({
      object: isVi ? "Lỗi phân tích" : "Analysis Error",
      material: isVi ? "Không xác định" : "Unknown",
      category: isVi ? "Chất thải khó phân hủy" : "General Waste",
      instruction: isVi ? "Vui lòng thử lại sau giây lát." : "Please try again later.",
      tip: "Error: " + err.message,
      confidence: 0
    });
  }
});

/* ===== START SERVER ===== */
app.listen(PORT, () => {
  console.log(`\n🚀 GreenSort Server Live!`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🔗 Endpoint: http://localhost:${PORT}/analyze\n`);
});
