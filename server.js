/* ===== AI ROUTE - BẢN ĐÃ SỬA LỖI CHO DŨNG ===== */
app.post("/analyze", async (req, res) => {
  try {
    const { image, mime, lang = 'vi' } = req.body;

    if (!image) return res.status(400).json({ error: "No image provided" });
    if (!API_KEY) return res.status(500).json({ error: "API_KEY missing" });

    // Sử dụng endpoint v1 để tránh lỗi 404
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: buildPrompt(lang) },
            {
              inline_data: { // Phải dùng dấu gạch dưới cho REST API
                mime_type: mime || "image/jpeg",
                data: image
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1, // Giúp AI trả về kết quả chính xác, ít bị lỗi định dạng
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Gemini Error:", data.error?.message);
      throw new Error(data.error?.message || "API Error");
    }

    let textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("AI returned empty content");

    // Xử lý lọc bỏ ký tự markdown nếu AI tự động thêm vào
    textResponse = textResponse.replace(/```json|```/g, "").trim();
    
    res.json(JSON.parse(textResponse));

  } catch (err) {
    console.error("❌ SERVER ERROR:", err.message);
    const isVi = req.body.lang === 'vi';
    res.status(500).json({
      object: isVi ? "Lỗi hệ thống" : "System Error",
      category: isVi ? "Chất thải khó phân hủy" : "General Waste",
      instruction: isVi ? "Vui lòng thử lại sau." : "Please try again.",
      tip: err.message,
      confidence: 0
    });
  }
});
