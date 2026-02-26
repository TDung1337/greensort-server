import express from "express";
import fetch from "node-fetch";

const app = express();

app.use(express.json({limit:"10mb"}));

const API_KEY = process.env.API_KEY;

app.post("/analyze",async(req,res)=>{

const img=req.body.image;

const r=await fetch(
"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="+API_KEY,
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
contents:[{
parts:[
{
text:`
Phân tích ảnh rác và trả về JSON.

Quy tắc:

- Nhận diện vật thể chính xác.
- Giấy, khăn giấy, giấy vo → thường là rác tái chế hoặc rác thường.
- Chỉ phân loại "Chất thải nguy hại" nếu thấy rõ pin hoặc thiết bị điện tử.
- Không đoán điện thoại nếu không chắc chắn.
- Giấy vo KHÔNG phải điện thoại.

Trả về JSON duy nhất:

{
 "object":"tên vật thể",
 "material":"chất liệu",
 "category":"Chất thải hữu cơ | Chất thải tái chế | Chất thải nguy hại | Chất thải khó phân hủy | Không phải rác",
 "instruction":"cách xử lý ngắn",
 "tip":"mẹo",
 "confidence":0-100
}

Không viết thêm gì ngoài JSON.
},
{
inlineData:{
mimeType:"image/jpeg",
data:img
}
}
]
}]
})
});

const d=await r.json();

res.json(d);

});

app.listen(process.env.PORT || 3000);
