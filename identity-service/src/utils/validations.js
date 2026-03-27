const joi=require('joi');
const validateUserRegistration=(data) =>{
    const schema= joi.object({
        username: joi.string().alphanum().min(3).max(30).required(),
        email: joi.string().email().required(),
        password: joi.string().min(6).required()
    });
    return schema.validate(data);       
}

const validateUserLogin=(data) =>{
    const schema= joi.object({
        username: joi.string().alphanum().min(3).max(30).required(),
        password: joi.string().min(6).required()
    });
    return schema.validate(data);       
}
module.exports={validateUserRegistration, validateUserLogin};