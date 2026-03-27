const logger=require('../utils/logger');
const Post=require('../models/Post');
const { publishMessage } = require('../utils/rabbitmq');

const invalidateCache=async (req,input)=>{
    const postByIdKey=`post:${input}`;
    await req.redisClient.del(postByIdKey);

    const cachedKey=`posts:${input}`;
    await req.redisClient.del(cachedKey);

    //invalidate the cache for the given cache key
    //what does invalidate cache do?
    // it is used to invalidate the cache for the given cache key
    // so that we can fetch the posts from the database instead of the cache
    // this helps to reduce the load on the database and improve the performance of the application
    // how it works?
    // when a request comes to create a post, we invalidate the cache for the given cache key
    // so that the next time someone fetches the posts, they will fetch them from the database instead of the cache
    // this way we can reduce the load on the database and improve the performance of the application
    const keys=await req.redisClient.keys('posts:*');//get all the keys that contain the posts cache * means all the keys that contain the posts cache
    if(keys.length>0){
        await req.redisClient.del(keys);
    }
    
}

const createPost=async (req,res)=>{
    try{
        const {content, mediaIds}=req.body;
        const userId=req.user.id;
        const newPost=new Post({
            user:userId,
            content,
            mediaIds
        });
        await newPost.save();
        await publishMessage('post.created',{//publish a message to the rabbitmq routing key is the key that is used to route the message to the rabbitmq
            postId:newPost._id.toString(),//post id is the id of the post
            userId:userId,//user id is the id of the user
            content:content,//content is the content of the post
           createdAt:newPost.createdAt,//created at is the date and time when the post was created
        });//publish a message to the rabbitmq
        await invalidateCache(req,newPost._id.toString());//invalidate the cache for the given cache key means invalidate the cache for the given post id
        //and next time when someone fetches the posts, they will fetch them from the database instead of the cache
        //this way we can reduce the load on the database and improve the performance of the application
        //how it works?
        // when a request comes to get posts, we first check if the posts are in the cache (redis)
        // if they are in the cache, we return them from the cache
        // if they are not in the cache, we fetch them from the database and store them in the cache for future requests
        // this way we can reduce the load on the database and improve the performance of the application
        //how it works?
        // when a request comes to get posts, we first check if the posts are in the cache (redis)
        res.status(201).json({message:'Post created successfully', post:newPost});
    } catch (error) {
        logger.error('Error creating post', error);
        res.status(500).json({message:'Error creating post', error});
    }
}

const getPosts=async (req,res)=>{
    // logger.info(`Fetching posts for user ${req.user.id}`);
  try{
    const page=parseInt(req.query.page) || 1;
    const limit=parseInt(req.query.limit) || 10;
    const startIndex=(page-1)*limit;
    const endIndex=page*limit;
    const cacheKey=`posts:${page}:${limit}`; //cache key for the posts here key is posts:1:10 means first page with 10 posts
    //what does cache key do?
    // it is used to cache the posts in the redis database
    // so that we can retrieve the posts from the cache instead of the database
    // this helps to reduce the load on the database and improve the performance of the application
    // how it works?
    // when a request comes to get posts, we first check i v f the posts are in the cache (redis)
    // if they are in the cache, we return them from the cache
    // if they are not in the cache, we fetch them from the database and store them in the cache for future requests
    // this way we can reduce the load on the database and improve the performance of the application
   const cachedPosts=await req.redisClient.get(cacheKey); //get the posts from the cache
   if(cachedPosts){ //if the posts are in the cache, return them from the cache
    return res.status(200).json({posts:JSON.parse(cachedPosts)});
   }
   const posts=await Post.find({}).sort({createdAt:-1}).skip(startIndex).limit(limit); //fetch the posts from the database
   const totalPosts=await Post.countDocuments({});
  const result={
    posts,
    totalPosts,
    totalPages:Math.ceil(totalPosts/limit),
    currentPage:page,
    limit:limit
  }
  //save your result in the cache
await req.redisClient.setex(cacheKey,300,JSON.stringify(result)); //300 seconds is 5 minutes
//300 seconds is 5 minutes because we want to cache the posts for 5 minutes so that we can retrieve the posts from the cache instead of the database for 5 minutes
//so that we can reduce the load on the database and improve the performance of the application

res.status(200).json(result);
  } catch (error) {
    logger.error('Error fetching posts', error);
    res.status(500).json({message:'Error fetching posts', error});
  }
}
const getPostById=async (req,res)=>{

    try{
        const postId=req.params.id;
        const cacheKey=`post:${postId}`; //cache key for the post here key is post:1 means post with id 1
        //what does cache key do?
        // it is used to cache the post in the redis database
        // so that we can retrieve the post from the cache instead of the database
        // this helps to reduce the load on the database and improve the performance of the application
        // how it works?
        // when a request comes to get a post, we first check if the post is in the cache (redis)
        // if it is in the cache, we return it from the cache
        // if it is not in the cache, we fetch it from the database and store it in the cache for future requests
        const cachedPost=await req.redisClient.get(cacheKey); //get the post from the cache
        if(cachedPost){ //if the post is in the cache, return it from the cache
            return res.status(200).json({post:JSON.parse(cachedPost)});
        }
        const post=await Post.findById(postId); //fetch the post from the database
        if(!post){
            return res.status(404).json({message:'Post not found'});
        }
        await req.redisClient.setex(cacheKey,3600,JSON.stringify(post)); //3600 seconds is 1 hour
        //3600 seconds is 1 hour because we want to cache the post for 1 hour so that we can retrieve the post from the cache instead of the database for 1 hour
        //so that we can reduce the load on the database and improve the performance of the application
        res.status(200).json({post});
    } catch (error) {
        logger.error('Error fetching post', error);
        res.status(500).json({message:'Error fetching post', error});
    }
}


const deletePost=async (req,res)=>{
    try{
        const post=await Post.findOneAndDelete({_id:req.params.id,
            user:req.user.id || req.headers['x-user-id'] || req.body.userId
        });
        if(!post){
            return res.status(404).json({message:'Post not found'});
        }   
        //publish a message to the rabbitmq
        await publishMessage('post.deleted',{
            postId:post._id.toString(),
            userId:req.user.id || req.headers['x-user-id'] || req.body.userId,
            mediaIds:post.mediaIds
        });//publish a message to the rabbitmq
        await invalidateCache(req,req.params.id.toString());//invalidate the cache for the given cache key means invalidate the cache for the given post id
        //so that the next time someone fetches the posts, they will fetch them from the database instead of the cache
        //this way we can reduce the load on the database and improve the performance of the application
        //how it works?
        // when a request comes to get posts, we first check if the posts are in the cache (redis)
        // if they are in the cache, we return them from the cache
        // if they are not in the cache, we fetch them from the database and store them in the cache for future requests
        // this way we can reduce the load on the database and improve the performance of the application
        logger.info(`Post ${post._id.toString()} deleted successfully`);

        res.status(200).json({message:'Post deleted successfully'});
    } catch (error) {
        logger.error('Error deleting post', error);
        res.status(500).json({message:'Error deleting post', error});
    }
}
module.exports={
    createPost,
    getPosts,
    getPostById,
    deletePost
}