const Search = require("../models/Search");
const logger = require("../utils/logger");

const handlePostCreated=async(event)=>{
    try{
        logger.info(`Received event: ${JSON.stringify(event)}`);
        const {postId,userId,content,createdAt}=event;
        const search=new Search({postId,userId,content,createdAt});
        await search.save();
        logger.info(`Search saved: ${JSON.stringify(search)}`);
    }catch(error){
        logger.error(`Error handling event: ${JSON.stringify(error)}`);
        throw error;
    }
}

const handlePostDeleted=async(event)=>{
    console.log('handlePostDeleted');
    try{
        logger.info(`Received event: ${JSON.stringify(event)}`);
        const postId = event?.postId || event?._id || event?.id;
        if (!postId) {
            logger.error(`Missing postId in event: ${JSON.stringify(event)}`);
            return;
        }

        const deletedSearch = await Search.findOneAndDelete({ postId: postId.toString() });
        if (!deletedSearch) {
            logger.warn(`No search document found for postId: ${postId}`);
            return;
        }

        logger.info(`Search deleted: ${JSON.stringify(deletedSearch.postId)}`);
    }catch(error){
        logger.error(`Error handling event: ${JSON.stringify(error)}`);
        throw error;
    }
}
module.exports={handlePostCreated,handlePostDeleted};