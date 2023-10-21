/** @type {import("express").RequestHandler} */
export default function authMiddleware(request, response, next){
  if(request.cookies?.sid){
    return void next();
  }
  response.status(401).json({ "reason": "Authentication failed" });
}