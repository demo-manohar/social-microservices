const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/couldinary");
const logger = require("../utils/logger");

const handlePostDeleted=async (eventData)=>{
    try{
       console.log('Post deleted event received', eventData);
       const {postId,mediaIds=[]}=eventData;

      if (!Array.isArray(mediaIds) || mediaIds.length === 0) {
        logger.info(`No media IDs found for post ${postId}`);
        return true;
      }

      const mediaList = await Media.find({_id:{$in:mediaIds}});
      if(mediaList.length===0){
        logger.info(`Media not found for post ${postId}`);
        return true;
      }

      for(const mediaItem of mediaList){
        await deleteMediaFromCloudinary(mediaItem.publicId);//delete the media from cloudinary
        await Media.findByIdAndDelete(mediaItem._id);//delete the media from the database
        logger.info(`Media deleted for post ${postId}`);
      }

       return true;
    }catch(error){
        logger.error('Error handling post deleted event', error);
    }
}
module.exports={handlePostDeleted};