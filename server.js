import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

/* ===== CORS FIX (Cách thủ công cũ của bạn) ===== */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" }));

/* ===== TEST ROUTE ===== */
app.get("/", (req, res) => {
  res.json({ 
    status: "online", 
    message: "GreenSort AI Server is running 🌱" 
  });
});

/* ===== PROMPT BUILDER ===== */
const buildPrompt = (lang) => {
  const isVi = lang === 'vi';
  const categories = isVi 
    ? '"Chất thải hữu cơ", "Chất thải tái chế", "Chất thải nguy hại", "Chất thải khó phân hủy", "Không phải rác"'
    : '"Organic Waste", "Recyclable Waste", "Hazardous Waste", "General Waste", "Not Waste"';

  return `
Analyze this image and return ONLY a valid JSON object.
Do NOT use markdown code blocks (like \`\`\`json).
The response language MUST BE in ${isVi ? 'Vietnamese' : 'English'}.

Required JSON Structure:
{
 "object": "Name of the detected item",
 "material": "Main material (e.g., Plastic, Paper, Metal)",
 "category": "MUST BE EXACTLY ONE OF THESE: ${categories}",
 "instruction": "Short, clear disposal instruction",
 "tip": "Short environmental tip related to this item",
 "confidence": <integer between 70 and 99 representing your confidence>
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
      throw new Error("API_KEY is not configured on the server.");
    }

    // Gọi Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
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
          // Tính năng mạnh mẽ: Ép Gemini API chỉ trả về chuỗi JSON hợp lệ
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("Empty response from AI");
    }

    // Phân tích JSON
    const jsonResult = JSON.parse(textResponse);
    
    // Gửi kết quả về Frontend
    res.json(jsonResult);

  } catch (err) {
    console.error("❌ AI ERROR:", err.message);

    // Fallback: Nếu lỗi, trả về dữ liệu mặc định đúng theo ngôn ngữ
    const isVi = req.body.lang === 'vi';
    res.json({
      object: isVi ? "Không xác định" : "Unknown object",
      material: isVi ? "Không rõ" : "Unknown",
      category: isVi ? "Chất thải khó phân hủy" : "General Waste",
      instruction: isVi ? "Bỏ vào thùng rác thông thường." : "Dispose in general waste bin.",
      tip: isVi ? "Hệ thống AI đang quá tải hoặc gặp lỗi." : "AI system overloaded or error.",
      confidence: 50
    });
  }
});

/* ===== START SERVER ===== */
app.listen(PORT, () => {
  console.log(`🌱 GreenSort server running on port ${PORT}`);
});
