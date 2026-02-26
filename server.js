import express from "express";
import fetch from "node-fetch";

const app = express();

app.use(express.json({limit:"10mb"}));

const API_KEY = process.env.API_KEY;


/* ===== CORS FIX ===== */

app.use((req,res,next)=>{
 res.header("Access-Control-Allow-Origin","*");
 res.header("Access-Control-Allow-Headers","Content-Type");
 res.header("Access-Control-Allow-Methods","POST, OPTIONS");

 if(req.method==="OPTIONS"){
  return res.sendStatus(200);
 }

 next();
});


/* ===== TEST ROUTE ===== */

app.get("/",(req,res)=>{
 res.send("GreenSort AI Server Running");
});


/* ===== AI ROUTE ===== */

app.post("/analyze", async(req,res)=>{

 try{

  const {image,mime,lang}=req.body;

  if(!image){
   return res.status(400).json({error:"No image"});
  }


  const prompt =
`Analyze this image and return ONLY JSON.

{
 "object":"name",
 "material":"main material",
 "category":"Organic Waste/Recyclable Waste/Hazardous Waste/General Waste/Not Waste",
 "instruction":"short disposal instruction",
 "tip":"short tip",
 "confidence":90
}`;


  const response = await fetch(
   "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="+API_KEY,
   {
    method:"POST",
    headers:{
     "Content-Type":"application/json"
    },
    body:JSON.stringify({
     contents:[
      {
       parts:[
        {text:prompt},
        {
         inlineData:{
          mimeType:mime||"image/jpeg",
          data:image
         }
        }
       ]
      }
     ]
    })
   }
  );


  const data = await response.json();


  let text =
   data?.candidates?.[0]?.content?.parts?.[0]?.text || "";


  /* ===== JSON PARSER ===== */

  let json=null;

  try{
   json=JSON.parse(text);
  }
  catch(e){

   const match=text.match(/\{[\s\S]*\}/);

   if(match){
    try{
     json=JSON.parse(match[0]);
    }catch{}
   }

  }


  /* ===== FALLBACK ===== */

  if(!json){

   json={
    object:"Unknown object",
    material:"Unknown",
    category:"General Waste",
    instruction:"Dispose in general waste bin",
    tip:"AI parsing failed",
    confidence:70
   };

  }


  res.json(json);


 }catch(err){

  console.log("AI ERROR:",err);

  res.status(500).json({
   error:"AI failed"
  });

 }

});


/* ===== START SERVER ===== */

app.listen(process.env.PORT || 3000,()=>{
 console.log("GreenSort server running");
});
