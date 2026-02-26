import express from "express";
import fetch from "node-fetch";

const app = express();

app.use((req,res,next)=>{
 res.setHeader("Access-Control-Allow-Origin","*");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");
 res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS");
 next();
});

app.use(express.json({limit:"10mb"}));

const API_KEY = process.env.API_KEY;

app.post("/analyze", async(req,res)=>{

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
     {text:"Analyze waste and return JSON"},
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

app.listen(process.env.PORT||3000);
