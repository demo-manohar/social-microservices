const logger=require('../utils/logger');
const Search=require('../models/Search');

const searchPosts=async(req,res)=>{
    try{
        const {query}=req.query;
        logger.info(`Searching for posts with query: ${query}`);    
        const posts=await Search.find(
           {
            $text:{
                $search:query
            }
            
           },
            {
                score:{$meta:'textScore'}// $meta is used to access the text score of the search query
           }
        ).sort({score:{$meta:'textScore'}}).limit(10);
         res.json({success:true,posts});
         logger.info(`Found ${posts.length} posts`);
       

        
    } catch (error) {
        logger.error(`Error searching posts: ${error.message}`);
        throw error;
    }
}
module.exports={searchPosts};