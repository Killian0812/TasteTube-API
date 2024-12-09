const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    cost: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        enum: ['USD', 'VND'],
        default: 'VND'
    },
    description: {
        type: String,
        trim: true
    },
    quantity: {
        type: Number,
        min: 0,
        required: true,
        get: v => Math.round(v),
        set: v => Math.round(v),
        alias: 'qty'
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category'
    },
    ship: {
        type: Boolean,
        default: true,
    },
    images: [
        {
            url: {
                type: String,
                required: true,
                trim: true
            },
            filename: {
                type: String,
                required: true,
                trim: true
            }
        }
    ],
}, {
    timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
