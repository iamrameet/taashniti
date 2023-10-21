/** @type {import("express").RequestHandler} */
export default function cookieParser(request, response, next){
  request.cookies = {};
  if(request.headers.cookie){
    const cookies = request.headers.cookie.split(";");
    for(const cookie of cookies){
      const [ name, value ] = cookie.split("=");
      request.cookies[name.trim()] = value.trim();
    }
  }
  next();
}