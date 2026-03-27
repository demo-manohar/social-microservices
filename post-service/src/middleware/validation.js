const Joi=require('joi');

const validatePostCreation=(req,res,next)=>{
    const schema=Joi.object({
        content:Joi.string().required(),
        mediaIds:Joi.array().items(Joi.string()).optional()
    });
    const {error}=schema.validate(req.body);
    if(error){
        return res.status(400).json({message:error.details[0].message});
    }
    next();
}
module.exports={validatePostCreation};