const mongoose=require('mongoose');

const mediaSchema=new mongoose.Schema({
   publicId:{ // The public ID of the media in Cloudinary
    type:String,
    required:true
   },
  originalName:{ // The original name of the media
    type:String,
    required:true
   },
  mimeType:{ // The mime type of the media mime type is the type of the media like image/jpeg, image/png, video/mp4, etc.
    type:String,
    required:true
   },
  url:{ // The url of the media
    type:String,
    required:true
   },
   userId:{ // The user id of the media
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required:true
   },
},
{
    timestamps: true
}
)
mediaSchema.index({ userId: 1 }, { unique: true }) // This index will ensure that each user has only one media
mediaSchema.index({ publicId: 1 }, { unique: true }) // This index will ensure that each public id is unique
mediaSchema.index({ originalName: 1 }, { unique: true }) // This index will ensure that each original name is unique
mediaSchema.index({ mimeType: 1 }, { unique: true }) // This index will ensure that each mime type is unique
mediaSchema.index({ url: 1 }, { unique: true }) // This index will ensure that each url is unique
const Media=mongoose.model('Media',mediaSchema);
module.exports=Media;

//what is timestamps?
//timestamps is a mongoose middleware that automatically adds createdAt and updatedAt fields to the schema
//createdAt is the date and time the media was created
//updatedAt is the date and time the media was last updated