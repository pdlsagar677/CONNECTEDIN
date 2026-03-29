"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
// 2. Create the typed schema
const conversationSchema = new mongoose_1.default.Schema({
    participants: {
        type: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'User' }],
        required: [true, 'At least one participant is required'],
        validate: {
            validator: function (participants) {
                return participants.length >= 2;
            },
            message: 'Conversation must have at least 2 participants'
        }
    },
    messages: [{
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Message',
            default: []
        }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// 3. Add virtual for last message (optional but useful)
conversationSchema.virtual('lastMessage').get(function () {
    if (this.messages && this.messages.length > 0) {
        return this.messages[this.messages.length - 1];
    }
    return null;
});
// 4. Add index for better query performance
conversationSchema.index({ participants: 1, updatedAt: -1 });
// 5. Create the typed model
const Conversation = mongoose_1.default.model('Conversation', conversationSchema);
// 6. Export the model
exports.default = Conversation;
