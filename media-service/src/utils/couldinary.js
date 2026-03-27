const cloudinary=require('cloudinary').v2;
const logger=require('./logger');

const uploadMediaToCloudinary=async (file)=>{
   return new Promise((resolve,reject)=>{
    if (!file?.buffer) {
      return reject(new Error("Missing file.buffer"));
    }

    // Configure at call-time so dotenv ordering can't break us.
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    logger.debug?.('Cloudinary env present', {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET,
    });

    // Keep public_id clean and stable (remove extension + spaces).
    const publicId = (file.originalname || 'upload')
      .replace(/\.[^/.]+$/, '')
      .replace(/\s+/g, '_');

    const uploadStream=cloudinary.uploader.upload_stream({
        resource_type: 'auto',
        public_id: publicId,
        overwrite: true
    }, (error, result)=>{
        if(error){
            logger.error('Error uploading media to Cloudinary', error);
            return reject(error);
        }
        if(!result){
            return reject(new Error("Cloudinary returned empty result"));
        }
        return resolve(result);
    });

    uploadStream.on('error', (error)=>{
      return reject(error);
    });

    uploadStream.end(file.buffer);
   })
}

const deleteMediaFromCloudinary=async (publicId)=>{
  try{
    const result=await cloudinary.uploader.destroy(publicId);
    logger.info(`Media deleted from Cloudinary: ${publicId}`);
    return result;
  }catch(error){
    logger.error('Error deleting media from Cloudinary', error);
    throw new Error('Error deleting media from Cloudinary');
  }
}
module.exports={uploadMediaToCloudinary,deleteMediaFromCloudinary};