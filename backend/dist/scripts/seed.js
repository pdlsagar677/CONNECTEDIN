"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user-model"));
const post_model_1 = __importDefault(require("../models/post-model"));
const comment_model_1 = __importDefault(require("../models/comment-model"));
dotenv_1.default.config();
// ─── Data ───
const PASSWORD = 'Test@123';
const userProfiles = [
    { username: 'emma_travels', bio: 'Wanderlust & coffee addict. Exploring one city at a time.', gender: 'female' },
    { username: 'jake_photos', bio: 'Photographer | NYC based | DM for collabs', gender: 'male' },
    { username: 'sophia_art', bio: 'Digital artist & dreamer. Creating beauty from pixels.', gender: 'female' },
    { username: 'liam_fitness', bio: 'Personal trainer | Transform your body, transform your life', gender: 'male' },
    { username: 'olivia_cooks', bio: 'Home chef | Sharing recipes that make your soul happy', gender: 'female' },
    { username: 'noah_codes', bio: 'Full-stack dev | Open source enthusiast | Coffee > Sleep', gender: 'male' },
    { username: 'ava_music', bio: 'Singer-songwriter | New single out now!', gender: 'female' },
    { username: 'mason_rides', bio: 'Mountain biker | Chasing trails and sunsets', gender: 'male' },
    { username: 'isabella_reads', bio: 'Bookworm | 100 books a year challenge | Currently reading...', gender: 'female' },
    { username: 'ethan_films', bio: 'Indie filmmaker | Telling stories that matter', gender: 'male' },
    { username: 'mia_yoga', bio: 'Yoga instructor | Breathe. Flow. Be present.', gender: 'female' },
    { username: 'lucas_gaming', bio: 'Pro gamer | Twitch streamer | GG only', gender: 'male' },
    { username: 'charlotte_style', bio: 'Fashion blogger | Outfit inspo daily', gender: 'female' },
    { username: 'alexander_tech', bio: 'Startup founder | Building the future, one line at a time', gender: 'male' },
    { username: 'amelia_nature', bio: 'Wildlife photographer | National Geographic contributor', gender: 'female' },
    { username: 'benjamin_eats', bio: 'Food critic | Honest reviews | Tag me for a visit', gender: 'male' },
    { username: 'harper_dance', bio: 'Professional dancer | Contemporary & hip-hop', gender: 'female' },
    { username: 'william_surf', bio: 'Surfer dude | Catching waves in Bali', gender: 'male' },
    { username: 'evelyn_writes', bio: 'Poet & novelist | Words are my superpower', gender: 'female' },
    { username: 'james_cars', bio: 'Car enthusiast | JDM > everything | Garage tours weekly', gender: 'male' },
    { username: 'luna_plants', bio: 'Plant mom to 47 babies | Green thumb tips', gender: 'female' },
    { username: 'henry_climb', bio: 'Rock climber | Conquered 3 of the 7 summits', gender: 'male' },
    { username: 'scarlett_glam', bio: 'Makeup artist | Tutorials every Tuesday', gender: 'female' },
    { username: 'daniel_astro', bio: 'Amateur astronomer | Astrophotography | Look up!', gender: 'male' },
    { username: 'aria_pets', bio: 'Dog mom | Rescue advocate | Adopt dont shop', gender: 'female' },
    { username: 'michael_beats', bio: 'Music producer | Beats for sale | DM for pricing', gender: 'male' },
    { username: 'chloe_bakes', bio: 'Pastry chef | Cake artist | Sugar is my love language', gender: 'female' },
    { username: 'sebastian_run', bio: 'Marathon runner | 42 marathons in 42 countries', gender: 'male' },
    { username: 'zoey_vintage', bio: 'Thrift queen | Vintage fashion | Sustainable style', gender: 'female' },
    { username: 'jack_adventure', bio: 'Adventure seeker | Skydiving | Bungee | Base jumping', gender: 'male' },
    { username: 'lily_sketch', bio: 'Illustrator | Commissions open | Pen & ink lover', gender: 'female' },
    { username: 'owen_coffee', bio: 'Barista & coffee roaster | Latte art champion 2024', gender: 'male' },
    { username: 'penelope_travel', bio: 'Travel blogger | 60+ countries | Budget tips', gender: 'female' },
    { username: 'leo_skate', bio: 'Pro skateboarder | Trick tutorials | Vans team rider', gender: 'male' },
    { username: 'layla_wellness', bio: 'Holistic health coach | Mindfulness | Nutrition', gender: 'female' },
    { username: 'aiden_drone', bio: 'Drone pilot | Aerial photography | Licensed FAA', gender: 'male' },
    { username: 'riley_diy', bio: 'DIY queen | Home renovation | Before & After', gender: 'female' },
    { username: 'carter_fish', bio: 'Deep sea fisherman | Catch & release | Ocean lover', gender: 'male' },
    { username: 'nora_ceramics', bio: 'Ceramic artist | Handmade pottery | Shop link in bio', gender: 'female' },
    { username: 'jackson_gym', bio: 'Bodybuilder | Meal prep king | No shortcuts', gender: 'male' },
    { username: 'stella_astrology', bio: 'Astrologer | Daily horoscopes | Whats your sign?', gender: 'female' },
    { username: 'grayson_hike', bio: 'Hiking every national park | 32/63 done', gender: 'male' },
    { username: 'aurora_paint', bio: 'Oil painter | Gallery exhibitions | Art is freedom', gender: 'female' },
    { username: 'levi_sail', bio: 'Sailor | Circumnavigating the globe | Day 247', gender: 'male' },
    { username: 'hazel_garden', bio: 'Urban gardener | Growing food on my balcony', gender: 'female' },
    { username: 'mateo_street', bio: 'Street photographer | Capturing raw human moments', gender: 'male' },
    { username: 'violet_crystals', bio: 'Crystal healer | Chakra balancing | Good vibes only', gender: 'female' },
    { username: 'elijah_woodwork', bio: 'Woodworker | Custom furniture | Built with love', gender: 'male' },
    { username: 'ivy_minimalist', bio: 'Minimalist living | Less stuff, more life', gender: 'female' },
    { username: 'caleb_snow', bio: 'Snowboarder | Powder chaser | Winter is coming', gender: 'male' },
];
const captions = [
    'Golden hour hits different here #sunset #vibes #photography',
    'New day, new adventure. Where should I go next? #travel #wanderlust',
    'This view was worth every step of the hike #mountains #nature #hiking',
    'Sunday brunch done right #foodie #brunch #weekendvibes',
    'Caught this moment perfectly #streetphotography #urban #life',
    'When the light is just right #portrait #naturallight',
    'Exploring hidden gems in the city #explore #citylife #architecture',
    'Coffee and a good book - perfect morning #coffeelover #bookstagram',
    'Throwback to this incredible sunset #tbt #sunset #ocean',
    'Art is everywhere if you look closely #art #creativity #inspiration',
    'Workout complete! No excuses #fitness #gym #motivation',
    'Homemade pasta from scratch #cooking #homemade #italian',
    'The colors of autumn never disappoint #fall #autumn #colors',
    'Beach days are the best days #beach #summer #paradise',
    'Just launched my new project! Link in bio #tech #startup #innovation',
    'Morning meditation by the lake #mindfulness #peace #wellness',
    'This little one stole my heart #pets #puppy #dogsofinstagram',
    'New recipe alert! Save this for later #recipe #foodphotography',
    'City lights and late nights #nightphotography #cityscape',
    'Fresh flowers always brighten my day #flowers #garden #spring',
    'Behind the scenes of todays shoot #bts #photography #work',
    'Grateful for moments like these #blessed #grateful #life',
    'That post-workout glow #selfcare #healthy #lifestyle',
    'Architecture that inspires #design #building #modern',
    'Road trip essentials packed and ready #roadtrip #adventure',
    'Sundays are for slow mornings #lazy #cozy #home',
    'Captured the milky way last night #astrophotography #stars #night',
    'Plant babies are thriving #plantmom #houseplants #green',
    'New art piece finished! What do you think? #artwork #creative',
    'The ocean heals everything #sea #waves #peaceful',
    'Market finds from this morning #farmersmarket #organic #fresh',
    'Rainy day aesthetics #rain #moody #atmosphere',
    'Trying something new today #challenge #growth #learning',
    'Festival vibes all weekend #music #festival #fun',
    'Handmade with love #crafts #handmade #diy',
    'Chasing waterfalls literally #waterfall #nature #explore',
    'Street food is the best food #streetfood #foodtour #delicious',
    'Minimalist living at its finest #minimal #clean #simple',
    'Catching waves before sunrise #surfing #dawn #ocean',
    'Vintage finds from todays thrift haul #vintage #thrift #fashion',
    'The mountains are calling and I must go #mountainlife #outdoor',
    'Cooked dinner for friends tonight #dinner #friends #gathering',
    'Golden retriever energy #happy #dog #sunshine',
    'Studio session was fire today #music #studio #recording',
    'First snow of the season! #winter #snow #cold',
    'Pottery wheel therapy #ceramics #pottery #handcrafted',
    'Sunrise from 14000 feet #altitude #climbing #summit',
    'Book recommendation: this one changed my perspective #reading',
    'Late night coding sessions #developer #code #building',
    'Perfect latte art if I do say so myself #barista #coffee #latteart',
];
const commentTexts = [
    'This is amazing!', 'Love this so much!', 'Beautiful shot!', 'Goals!',
    'Wow, incredible!', 'Need to visit this place!', 'So inspiring!',
    'Great work!', 'This made my day!', 'Absolutely stunning!',
    'Can I get the recipe?', 'Where is this?', 'Living the dream!',
    'Fire content!', 'Keep it up!', 'This is everything!',
    'Obsessed with this!', 'Tutorial please!', 'You never disappoint!',
    'Adding this to my bucket list!',
];
// ─── Helpers ───
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
const getProfilePic = (gender, index) => {
    const folder = gender === 'female' ? 'women' : 'men';
    return `https://randomuser.me/api/portraits/${folder}/${index % 100}.jpg`;
};
const getPostImage = (index) => {
    // Different sizes for variety, using seed for consistent images
    const sizes = ['1080/1080', '1080/720', '1080/1350', '800/800', '1080/608'];
    return `https://picsum.photos/seed/snapgram${index}/${sizes[index % sizes.length]}`;
};
// ─── Main Seed Function ───
const seed = () => __awaiter(void 0, void 0, void 0, function* () {
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error('MONGO_URI not set in .env');
        process.exit(1);
    }
    yield mongoose_1.default.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    const hashedPassword = yield bcryptjs_1.default.hash(PASSWORD, 10);
    // Check if seed users already exist
    const existingCount = yield user_model_1.default.countDocuments({ username: { $in: userProfiles.map(u => u.username) } });
    if (existingCount > 0) {
        console.log(`Found ${existingCount} seed users already. Skipping to avoid duplicates.`);
        console.log('To re-seed, run: npx ts-node src/scripts/seed.ts --clean');
        if (process.argv.includes('--clean')) {
            console.log('Cleaning existing seed data...');
            const seedUsers = yield user_model_1.default.find({ username: { $in: userProfiles.map(u => u.username) } }).select('_id');
            const seedUserIds = seedUsers.map(u => u._id);
            yield post_model_1.default.deleteMany({ author: { $in: seedUserIds } });
            yield comment_model_1.default.deleteMany({ author: { $in: seedUserIds } });
            yield user_model_1.default.deleteMany({ _id: { $in: seedUserIds } });
            // Remove seed users from other users' followers/following
            yield user_model_1.default.updateMany({}, { $pull: { followers: { $in: seedUserIds }, following: { $in: seedUserIds } } });
            console.log('Cleaned! Proceeding with fresh seed...');
        }
        else {
            yield mongoose_1.default.disconnect();
            process.exit(0);
        }
    }
    // 1. Create 50 users
    console.log('Creating 50 users...');
    const users = yield user_model_1.default.insertMany(userProfiles.map((profile, i) => ({
        username: profile.username,
        email: `${profile.username}@snapgram.test`,
        password: hashedPassword,
        profilePicture: getProfilePic(profile.gender, i),
        bio: profile.bio,
        gender: profile.gender,
        isVerified: true,
        followers: [],
        following: [],
        posts: [],
        bookmarks: [],
    })));
    console.log(`Created ${users.length} users`);
    // 2. Create follow relationships (each user follows 5-15 random others)
    console.log('Creating follow relationships...');
    for (const user of users) {
        const othersToFollow = shuffle(users.filter((u) => u._id.toString() !== user._id.toString()))
            .slice(0, rand(5, 15));
        const followIds = othersToFollow.map(u => u._id);
        yield user_model_1.default.findByIdAndUpdate(user._id, { $set: { following: followIds } });
        // Add this user to each followed user's followers
        for (const followedUser of othersToFollow) {
            yield user_model_1.default.findByIdAndUpdate(followedUser._id, { $addToSet: { followers: user._id } });
        }
    }
    console.log('Follow relationships created');
    // 3. Create 50 posts
    console.log('Creating 50 posts...');
    const posts = [];
    for (let i = 0; i < 50; i++) {
        const author = users[i % users.length];
        const caption = captions[i];
        const hashtags = (caption.match(/#(\w+)/g) || []).map(h => h.slice(1));
        const post = yield post_model_1.default.create({
            caption,
            image: getPostImage(i),
            author: author._id,
            likes: [],
            comments: [],
            hashtags,
        });
        // Add post to author's posts array
        yield user_model_1.default.findByIdAndUpdate(author._id, { $push: { posts: post._id } });
        posts.push(post);
    }
    console.log(`Created ${posts.length} posts`);
    // 4. Add random likes (10-30 per post)
    console.log('Adding likes...');
    for (const post of posts) {
        const likers = shuffle(users).slice(0, rand(10, 30));
        yield post_model_1.default.findByIdAndUpdate(post._id, { $set: { likes: likers.map(u => u._id) } });
    }
    console.log('Likes added');
    // 5. Add random comments (2-6 per post)
    console.log('Adding comments...');
    let totalComments = 0;
    for (const post of posts) {
        const numComments = rand(2, 6);
        for (let i = 0; i < numComments; i++) {
            const commenter = pick(users);
            const comment = yield comment_model_1.default.create({
                text: pick(commentTexts),
                author: commenter._id,
                post: post._id,
            });
            yield post_model_1.default.findByIdAndUpdate(post._id, { $push: { comments: comment._id } });
            totalComments++;
        }
    }
    console.log(`Added ${totalComments} comments`);
    // 6. Add some bookmarks (each user bookmarks 2-8 random posts)
    console.log('Adding bookmarks...');
    for (const user of users) {
        const bookmarked = shuffle(posts).slice(0, rand(2, 8));
        yield user_model_1.default.findByIdAndUpdate(user._id, { $set: { bookmarks: bookmarked.map(p => p._id) } });
    }
    console.log('Bookmarks added');
    // Done
    console.log('\n--- Seed Complete ---');
    console.log(`Users: ${users.length}`);
    console.log(`Posts: ${posts.length}`);
    console.log(`Comments: ${totalComments}`);
    console.log(`\nAll users share password: ${PASSWORD}`);
    console.log('Email format: <username>@snapgram.test');
    console.log('Example: emma_travels@snapgram.test / Test@123');
    yield mongoose_1.default.disconnect();
    process.exit(0);
});
seed().catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
});
