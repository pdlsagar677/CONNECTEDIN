import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/user-model';
import Post from '../models/post-model';
import Comment from '../models/comment-model';

dotenv.config();

const captions = [
  'Morning light never gets old #sunrise #photography #golden',
  'Found this hidden cafe today #coffee #explore #citylife',
  'Workout done, feeling unstoppable #fitness #motivation #gym',
  'Homemade sourdough bread attempt #3 #baking #homemade',
  'The view from our Airbnb #travel #wanderlust #views',
  'New kicks just dropped #sneakers #fashion #style',
  'Sunset chasing is my cardio #sunset #nature #peaceful',
  'Late night studio vibes #music #producer #beats',
  'This farmers market find though #organic #fresh #food',
  'Trying watercolor for the first time #art #painting #creative',
  'Beach volleyball with the crew #summer #beach #friends',
  'My reading nook is finally done #cozy #books #home',
  'Fresh pasta, who wants some? #italian #cooking #foodie',
  'Trail running through autumn leaves #running #fall #nature',
  'New plant baby alert #plantparent #houseplants #green',
  'Coffee art getting better every day #barista #latte #practice',
  'Desert vibes hit different #desert #landscape #adventure',
  'Vintage camera collection growing #film #analog #photography',
  'Sunday morning pancakes #brunch #weekend #delicious',
  'City skyline after rain #urban #cityscape #moody',
  'Teaching the little one to surf #family #surfing #ocean',
  'My ceramic collection so far #pottery #handmade #crafts',
  'Golden hour in the lavender field #flowers #golden #dreamy',
  'Road trip playlist ready #roadtrip #music #adventure',
  'Home gym finally complete #homegym #fitness #goals',
  'Cherry blossom season is here #spring #sakura #beautiful',
  'Grilled fish tacos for dinner #recipe #mexican #yummy',
  'Mountain biking through the forest #mtb #outdoor #adrenaline',
  'Thrift store treasure hunting #vintage #thrift #sustainable',
  'Stargazing from the rooftop #stars #night #astrophotography',
  'My sourdough starter is alive! #bread #fermentation #patience',
  'Catching waves at dawn #surf #dawn #saltlife',
  'Bullet journal spread for March #journaling #planning #creative',
  'Freshly picked strawberries #farm #organic #strawberry',
  'Exploring abandoned buildings #urbex #architecture #history',
  'Yoga at sunrise by the lake #yoga #wellness #peace',
  'Ramen from scratch takes forever but worth it #ramen #japanese',
  'First snowboard of the season! #snowboard #winter #powder',
  'Succulent garden is thriving #succulents #garden #plantmom',
  'Drone shot of the coastline #drone #aerial #ocean',
  'Book haul from the local bookstore #bookstagram #reading',
  'Homemade pizza night #pizza #homemade #friday',
  'Hiking to the summit at 5am #hiking #mountains #summit',
  'Painting the sunset in real time #pleinair #oilpainting #art',
  'Festival outfit check #festival #fashion #summer',
  'My cats judging me as usual #cats #funny #pets',
  'Smoothie bowl art #healthy #breakfast #acai',
  'The perfect espresso shot #coffee #espresso #barista',
  'Kayaking through crystal clear water #kayak #nature #adventure',
  'DIY shelving project done #diy #woodworking #home',
  'Night market street food tour #streetfood #travel #asia',
  'Macro photography of morning dew #macro #nature #detail',
  'Gym PR today lets go! #deadlift #strength #progress',
  'Making candles at home is therapeutic #candles #diy #selfcare',
  'Paragliding over the valley #paragliding #extreme #views',
  'Charcuterie board for date night #charcuterie #datenight #wine',
  'My garden after the rain #garden #rain #fresh',
  'Sketching in the park #sketch #illustration #outdoor',
  'Sushi making class was amazing #sushi #japanese #cooking',
  'Forest bathing is real therapy #forest #shinrinyoku #peace',
  'New mural in the neighborhood #streetart #graffiti #urban',
  'Autumn leaf collection #fall #leaves #seasonal',
  'Bluetooth speaker and hammock kind of day #chill #relax #nature',
  'Fermented hot sauce batch #2 #hotsauce #fermentation #spicy',
  'Train journey through the countryside #train #countryside #travel',
  'Building a terrarium #terrarium #plants #miniature',
  'Fresh baguette from the oven #bread #baking #french',
  'Cliff diving was terrifying but amazing #cliffdiving #adrenaline',
  'Pottery wheel session today #ceramics #wheel #handcrafted',
  'Picnic in the park with friends #picnic #friends #sunshine',
  'Ice cream stop on the road trip #icecream #summer #treat',
  'Learning to play ukulele #ukulele #music #beginner',
  'Foggy morning walk #fog #moody #atmospheric',
  'Farmers market bouquet #flowers #market #fresh',
  'My sketchbook pages this month #sketching #art #progress',
  'Campfire cooking is an art #camping #cooking #outdoor',
  'Waterfall hunting in Costa Rica #waterfall #costarica #puravida',
  'New print for the studio #printmaking #art #studio',
  'Home renovation before and after #renovation #diy #transformation',
  'Cycling through tulip fields #cycling #netherlands #tulips',
  'Homemade kombucha day 7 #kombucha #fermented #health',
  'Rock climbing at the gym #climbing #bouldering #strength',
  'Jazz vinyl collection update #jazz #vinyl #records',
  'Mushroom foraging in the woods #foraging #mushrooms #nature',
  'Tie dye experiment #tiedye #diy #colorful',
  'Lighthouse at dusk #lighthouse #coastal #photography',
  'Morning meditation spot #meditation #mindfulness #calm',
  'Handmade earrings for sale #jewelry #handmade #etsy',
  'Skateboard trick finally landed #skateboarding #trick #progress',
  'Sunset paddle boarding #sup #paddleboard #sunset',
  'Greenhouse goals #greenhouse #plants #gardening',
  'Making fresh pasta shapes #pasta #handmade #italian',
  'The milky way from the mountains #milkyway #astrophotography',
  'Beeswax wrap making #ecofriendly #sustainable #diy',
  'Deep sea fishing trip #fishing #ocean #catch',
  'Flower arranging class #flowers #arrangement #beautiful',
  'Calligraphy practice #calligraphy #lettering #practice',
  'Bonfire on the beach tonight #bonfire #beach #nighttime',
  'Aerial silks class was insane #aerialsilks #circus #strength',
  'Pressed flower art #pressedflowers #art #botanical',
];

const commentTexts = [
  'This is amazing!', 'Love this!', 'Beautiful!', 'Goals!', 'Wow!',
  'Incredible!', 'Need to try this!', 'So inspiring!', 'Great work!',
  'This made my day!', 'Stunning!', 'Where is this?', 'Living the dream!',
  'Fire!', 'Keep it up!', 'Obsessed!', 'Tutorial please!',
  'Adding to my bucket list!', 'So cool!', 'Want!',
];

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const getPostImage = (index: number) => {
  const sizes = ['1080/1080', '1080/720', '1080/1350', '800/800', '1080/608'];
  return `https://picsum.photos/seed/extra${index}/${sizes[index % sizes.length]}`;
};

const seed = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) { console.error('MONGO_URI not set'); process.exit(1); }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Get existing seed users
  const users = await User.find({
    email: { $regex: /@snapgram\.test$/ }
  });

  if (users.length === 0) {
    console.error('No seed users found. Run seed.ts first.');
    process.exit(1);
  }

  console.log(`Found ${users.length} seed users. Adding 100 posts...`);

  let totalComments = 0;

  for (let i = 0; i < 100; i++) {
    const author = pick(users);
    const caption = captions[i % captions.length];
    const hashtags = (caption.match(/#(\w+)/g) || []).map(h => h.slice(1));

    // Random likes from 5-40 users
    const likers = shuffle(users).slice(0, rand(5, 40));

    const post = await Post.create({
      caption,
      image: getPostImage(i + 100), // offset to avoid duplicate seeds
      author: author._id,
      likes: likers.map(u => u._id),
      comments: [],
      hashtags,
    });

    // Add 1-5 comments
    const numComments = rand(1, 5);
    for (let j = 0; j < numComments; j++) {
      const commenter = pick(users);
      const comment = await Comment.create({
        text: pick(commentTexts),
        author: commenter._id,
        post: post._id,
      });
      await Post.findByIdAndUpdate(post._id, { $push: { comments: comment._id } });
      totalComments++;
    }

    // Add post to author's posts array
    await User.findByIdAndUpdate(author._id, { $push: { posts: post._id } });

    if ((i + 1) % 20 === 0) console.log(`  ${i + 1}/100 posts created...`);
  }

  console.log('\n--- Seed Complete ---');
  console.log(`Posts: 100`);
  console.log(`Comments: ${totalComments}`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
