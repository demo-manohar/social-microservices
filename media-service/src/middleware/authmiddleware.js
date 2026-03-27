
const authenticateRequest=(req,res,next)=>{
    const userId=req.headers['x-user-id']
  if(!userId){
    return res.status(401).json({message:'Unauthorized'});
  }
    req.user={id:userId};
    next();
}
module.exports={authenticateRequest};