const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentLikeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    commentId: {
        type: Schema.Types.ObjectId,
        ref: 'Comment',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('CommentLike', commentLikeSchema);
