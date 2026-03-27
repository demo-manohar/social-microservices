const { uploadMediaToCloudinary } = require("../utils/couldinary");
const logger = require("../utils/logger");
const Media=require('../models/Media');
const uploadMedia=async (req,res)=>{
    try{
        const file=req.file;
        if(!file){
            return res.status(400).json({message:'No file uploaded'});
        }   
        const {originalname,mimetype,buffer}=file;
        const userId=req.user.id || req.user.userId || req.headers['x-user-id'];
        if(!userId){
            return res.status(401).json({message:'Unauthorized'});
        }
        logger.info(`Uploading media for user: ${userId}`);
        logger.info('cloudinary upload started');
        const result=await uploadMediaToCloudinary(file);
        console.log(result);
        if(!result || !result.public_id || !result.secure_url){
            throw new Error('Invalid Cloudinary result');
        }
        logger.info(`cloudinary upload completed .Public ID: ${result.public_id} and URL: ${result.secure_url}`);
     
        const media=new Media({
            publicId:result.public_id,
            originalName:originalname,
            mimeType:mimetype,
            url:result.secure_url,
            userId:userId
        });

        await media.save();
        res.status(200).json({message:'Media uploaded successfully', mediaId:media._id,url:media.url});
    }catch(error){
        logger.error('Error uploading media', error);
        res.status(500).json({message:'Error uploading media', error: error?.message || error});
    }
}
const getAllMedia=async (req,res)=>{
    console.log('getAllMedia request received');

    try{
        const media=await Media.find({});
        res.status(200).json({message:'Media fetched successfully', media});
    }catch(error){
        logger.error('Error fetching media', error);
        res.status(500).json({message:'Error fetching media', error: error?.message || error});
    }
}
module.exports={uploadMedia,getAllMedia};