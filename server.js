import express from "express";
import fetch from "node-fetch";

const app = express();

app.use(express.json({limit:"10mb"}));

const API_KEY="AIzaSyBbSVGZDJYvc_aYULXuE-iSrFda72LnGXU";

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
text:"Phân loại rác và trả JSON gồm object và category"
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
