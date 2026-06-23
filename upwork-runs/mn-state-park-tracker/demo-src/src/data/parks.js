// src/data/parks.js — All 73 MN State Parks + Recreation Areas
// Source: Wikipedia / MN DNR. ArcGIS endpoint unavailable; coordinates Wikipedia-sourced.

export const MN_PARKS = [
  { id:1, name:"Afton State Park", slug:"afton", lat:44.8625, lng:-92.7835, county:"Washington", region:"Metro", acres:1702, type:"state-park",
    description:"Afton's rugged ravines and bluffs tower above the St. Croix River just 20 miles from the Twin Cities. Twenty-four miles of trail cross oak savanna and restored native prairie, with backpack campsites for overnight getaways. Sweeping river views and diverse wildlife make this a beloved escape for Metro-area hikers.",
    amenities:["Hiking","Backpack Camping","Swimming","Fishing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:2, name:"Banning State Park", slug:"banning", lat:46.1708, lng:-92.8441, county:"Pine", region:"East Central", acres:6230, type:"state-park",
    description:"The Kettle River carves dramatic sandstone potholes and churning whitewater rapids through Banning's rugged landscape. Ruins of a historic sandstone quarry line the riverbanks, offering a glimpse into Minnesota's industrial past. Kayakers and canoeists flock to the challenging river runs while hikers explore exposed cliff trails.",
    amenities:["Hiking","Camping","Kayaking/Canoeing","Fishing","Rock Climbing","Picnicking","Cross-Country Skiing"] },

  { id:3, name:"Bear Head Lake State Park", slug:"bear-head-lake", lat:47.7963, lng:-92.0768, county:"St. Louis", region:"Northeast", acres:4375, type:"state-park",
    description:"Tucked deep in the Arrowhead region, Bear Head Lake offers pristine backcountry camping among boreal pine forest and glacial lakes. Loon calls echo across the water each evening, and the park's remote feel belies its excellent amenities. Anglers prize the excellent walleye and bass fishing on Bear Head Lake.",
    amenities:["Hiking","Camping","Backpack Camping","Fishing","Canoeing/Kayaking","Swimming","Cross-Country Skiing","Snowshoeing"] },

  { id:4, name:"Beaver Creek Valley State Park", slug:"beaver-creek-valley", lat:43.6427, lng:-91.5818, county:"Houston", region:"Southeast", acres:1214, type:"state-park",
    description:"A crystal-clear spring-fed trout stream winds through a lush wooded valley that feels more like the Ozarks than Minnesota. Beaver Creek Valley is one of Minnesota's best trout fishing parks, with a self-sustaining wild brook trout population. The cool valley microclimate supports rare ferns and wildflowers that bloom in exceptional variety each spring.",
    amenities:["Hiking","Camping","Fishing","Picnicking","Wildlife Viewing","Cross-Country Skiing"] },

  { id:5, name:"Big Bog State Recreation Area", slug:"big-bog", lat:48.1728, lng:-94.512, county:"Beltrami", region:"Northwest", acres:9148, type:"state-recreation-area",
    description:"Big Bog protects one of the largest peat bogs in the lower 48 states, a vast black spruce and tamarack wilderness north of Upper Red Lake. A unique mile-long boardwalk floats across the bog surface, offering access to an otherworldly landscape of carnivorous plants and rare orchids. This remote park is prime moose and black bear habitat far off the beaten path.",
    amenities:["Hiking","Camping","Wildlife Viewing","Fishing","Snowmobiling"] },

  { id:6, name:"Big Stone Lake State Park", slug:"big-stone-lake", lat:45.3825, lng:-96.5131, county:"Big Stone", region:"West Central", acres:986, type:"state-park",
    description:"Straddling the South Dakota border, Big Stone Lake is one of Minnesota's westernmost parks overlooking a glacially formed prairie lake. Migratory waterfowl crowd the shallow lake shores each spring and fall in spectacular numbers. The park offers sandy swimming beaches, boat launch access, and a peaceful prairie camping experience.",
    amenities:["Hiking","Camping","Swimming","Fishing","Boat Launch","Picnicking","Wildlife Viewing"] },

  { id:7, name:"Blue Mounds State Park", slug:"blue-mounds", lat:43.7069, lng:-96.187, county:"Rock", region:"Southwest", acres:1949, type:"state-park",
    description:"A dramatic 90-foot cliff of Sioux quartzite rises above the surrounding prairie, appearing blue in the late afternoon light and giving this park its name. A free-roaming bison herd grazes the restored tallgrass prairie, offering one of Minnesota's most striking wildlife encounters. Spring brings an explosion of native wildflowers across the rolling prairie landscape.",
    amenities:["Hiking","Camping","Swimming","Fishing","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:8, name:"Buffalo River State Park", slug:"buffalo-river", lat:46.8655, lng:-96.4678, county:"Clay", region:"Northwest", acres:1276, type:"state-park",
    description:"One of Minnesota's finest examples of native tallgrass prairie sweeps across Buffalo River State Park in the Red River valley. The park preserves over 1,200 acres of clay prairie hills covered in big bluestem grass, rare wildflowers, and diverse birdlife. The Buffalo River itself winds through the landscape offering gentle canoe runs and excellent fishing.",
    amenities:["Hiking","Camping","Fishing","Canoeing/Kayaking","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:9, name:"Camden State Park", slug:"camden", lat:44.3625, lng:-95.925, county:"Lyon", region:"Southwest", acres:1745, type:"state-park",
    description:"Camden's wooded Redwood River valley cuts a green oasis through the surrounding southwestern Minnesota farmland and prairie. The park offers excellent swimming, a campground, and miles of trails through hardwood forest along the river. Prairie wildflowers bloom in late summer across upland areas, attracting butterflies and birds in abundance.",
    amenities:["Hiking","Camping","Swimming","Fishing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:10, name:"Carley State Park", slug:"carley", lat:44.1166, lng:-92.176, county:"Wabasha", region:"Southeast", acres:209, type:"state-park",
    description:"Minnesota's smallest state park, Carley is a hidden gem tucked along the North Branch of the Whitewater River in bluff country. Spring wildflowers carpet the forest floor here in spectacular fashion, with trout lilies, bloodroot, and Dutchman's breeches creating a pastel tapestry. The quiet trails and trout stream make it a peaceful alternative to busier nearby parks.",
    amenities:["Hiking","Picnicking","Fishing","Wildlife Viewing"] },

  { id:11, name:"Cascade River State Park", slug:"cascade-river", lat:47.7097, lng:-90.5222, county:"Cook", region:"North Shore", acres:2865, type:"state-park",
    description:"The Cascade River tumbles through a series of five spectacular waterfalls before emptying into Lake Superior in this dramatic North Shore park. Eighteen miles of trail connect to the Superior Hiking Trail, offering some of the best backpacking on the shore. In winter, the frozen falls and lake ice create a stunning landscape for snowshoers and skiers.",
    amenities:["Hiking","Camping","Backpack Camping","Waterfalls","Cross-Country Skiing","Snowshoeing","Fishing","Wildlife Viewing"] },

  { id:12, name:"Charles A. Lindbergh State Park", slug:"charles-a-lindbergh", lat:45.9589, lng:-94.3953, county:"Morrison", region:"Central", acres:328, type:"state-park",
    description:"This small but historic park preserves the boyhood home of aviator Charles Lindbergh on the wooded banks of the Mississippi River. The Lindbergh family home is open for tours during the summer season, offering a window into early 20th-century rural Minnesota life. Quiet river access and shaded picnic grounds make this a peaceful heritage stop along the Mississippi.",
    amenities:["Hiking","Camping","Historic Site","Fishing","Picnicking","Cross-Country Skiing"] },

  { id:13, name:"Crow Wing State Park", slug:"crow-wing", lat:46.2722, lng:-94.3333, county:"Crow Wing", region:"Central", acres:2066, type:"state-park",
    description:"At the confluence of the Crow Wing and Mississippi rivers, this park marks a site of profound historical importance as a former fur trade and Dakota village location. Miles of trails wind through hardwood forest and prairie remnants along both river corridors. Canoe camping on the Mississippi offers a rare glimpse of the river's wild, undeveloped character.",
    amenities:["Hiking","Camping","Canoeing/Kayaking","Fishing","Historic Site","Picnicking","Cross-Country Skiing"] },

  { id:14, name:"Cuyuna Country State Recreation Area", slug:"cuyuna-country", lat:46.4896, lng:-93.9775, county:"Crow Wing", region:"Central", acres:4820, type:"state-recreation-area",
    description:"Flooded iron ore mines have created a chain of impossibly turquoise lakes set amid reclaimed mine land, making Cuyuna Country one of Minnesota's most unusual and visually stunning parks. World-class mountain biking trails wind through 25+ miles of singletrack developed in partnership with the local community. The clear, deep mine pits also attract scuba divers exploring submerged mining equipment.",
    amenities:["Mountain Biking","Hiking","Swimming","Fishing","Scuba Diving","Camping","Canoeing/Kayaking","Cross-Country Skiing"] },

  { id:15, name:"Father Hennepin State Park", slug:"father-hennepin", lat:46.1447, lng:-93.488, county:"Mille Lacs", region:"Central", acres:690, type:"state-park",
    description:"Perched on the southwestern shore of Mille Lacs Lake, this park commemorates the 1680 capture of Father Louis Hennepin by Dakota warriors on this very site. The park's sandy beach and excellent walleye fishing on Mille Lacs draw visitors all season long. A naturalist program and interpretive exhibits bring the area's rich Native American and European contact history to life.",
    amenities:["Hiking","Camping","Swimming","Fishing","Picnicking","Historic Site","Wildlife Viewing"] },

  { id:16, name:"Flandrau State Park", slug:"flandrau", lat:44.2883, lng:-94.4736, county:"Brown", region:"South Central", acres:805, type:"state-park",
    description:"Nestled along the Cottonwood River near New Ulm, Flandrau is known for its uniquely designed sand-bottomed swimming pond fed by a natural spring. The park's hardwood forest and river bottomland support diverse wildlife and offer pleasant hiking year-round. German-heritage New Ulm's festivals and Flandrau's peaceful campground make an ideal combination destination.",
    amenities:["Hiking","Camping","Swimming","Fishing","Picnicking","Cross-Country Skiing"] },

  { id:17, name:"Forestville/Mystery Cave State Park", slug:"forestville-mystery-cave", lat:43.6255, lng:-92.2474, county:"Fillmore", region:"Southeast", acres:3116, type:"state-park",
    description:"Mystery Cave is Minnesota's longest cave system, with 13 miles of mapped passages decorated with flowstone, stalactites, and a crystal-clear underground stream. The park also preserves the historic townsite of Forestville, a remarkably intact mid-1800s village interpreted by costumed guides. Above ground, the South Branch of the Root River offers exceptional catch-and-release trout fishing.",
    amenities:["Hiking","Camping","Cave Tours","Fishing","Historic Site","Cross-Country Skiing","Horse Trails"] },

  { id:18, name:"Fort Ridgely State Park", slug:"fort-ridgely", lat:44.4525, lng:-94.7308, county:"Nicollet", region:"South Central", acres:591, type:"state-park",
    description:"Fort Ridgely was the site of two major battles during the U.S.-Dakota War of 1862, and its ruins are preserved in the park's interpretive area. Overlooking the Minnesota River valley, the park offers dramatic bluff views and golf on a historic 9-hole course that has operated here for over a century. Hiking trails wind through the river valley and past remnants of the original frontier fort.",
    amenities:["Hiking","Camping","Historic Site","Golf","Fishing","Picnicking","Cross-Country Skiing"] },

  { id:19, name:"Fort Snelling State Park", slug:"fort-snelling", lat:44.8858, lng:-93.178, county:"Hennepin/Dakota", region:"Metro", acres:2885, type:"state-park",
    description:"At the confluence of the Minnesota and Mississippi rivers, Fort Snelling preserves a vast natural landscape in the heart of the Twin Cities metro. The park connects to Historic Fort Snelling, where the 1820s limestone fort stands as a living museum of frontier-era Minnesota. Seventeen miles of paved biking trails, lake fishing, swimming, and paddling make this an all-season urban nature refuge.",
    amenities:["Hiking","Biking","Swimming","Fishing","Canoeing/Kayaking","Historic Site","Picnicking","Cross-Country Skiing"] },

  { id:20, name:"Franz Jevne State Park", slug:"franz-jevne", lat:48.6422, lng:-94.0804, county:"Koochiching", region:"North", acres:119, type:"state-park",
    description:"One of Minnesota's smallest and most remote parks, Franz Jevne sits on the Canadian border along the Rainy River. The park offers a primitive camping experience in genuine northern wilderness, with excellent walleye fishing in the Rainy River. Black bears, bald eagles, and osprey are commonly seen here in the heart of the boreal forest.",
    amenities:["Camping","Fishing","Canoeing/Kayaking","Wildlife Viewing","Picnicking"] },

  { id:21, name:"Frontenac State Park", slug:"frontenac", lat:44.5075, lng:-92.3263, county:"Goodhue", region:"Southeast", acres:2718, type:"state-park",
    description:"Perched on the bluffs above Lake Pepin, a wide natural lake on the Mississippi River, Frontenac is one of Minnesota's premier birding destinations with over 260 documented species. The park's diverse habitats range from limestone bluffs and floodplain forest to upland prairie, supporting an extraordinary variety of migratory songbirds each spring. The historic village of Frontenac Station lies within the park, adding heritage interest to natural splendor.",
    amenities:["Hiking","Camping","Wildlife Viewing","Fishing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:22, name:"Garden Island State Recreation Area", slug:"garden-island", lat:49.1753, lng:-94.8347, county:"Lake of the Woods", region:"Northwest", acres:685, type:"state-recreation-area",
    description:"Accessible only by boat on Lake of the Woods, Garden Island offers a true wilderness camping experience on a large wooded island near the Canadian border. The island's remote beaches and undeveloped forest provide exceptional solitude and outstanding walleye fishing on one of North America's greatest fishing lakes. Northern lights frequently illuminate the sky above the island on clear summer nights.",
    amenities:["Boat-Access Only","Camping","Fishing","Wildlife Viewing","Sandy Beach"] },

  { id:23, name:"George H. Crosby Manitou State Park", slug:"george-h-crosby-manitou", lat:47.506, lng:-91.109, county:"Lake", region:"North Shore", acres:3655, type:"state-park",
    description:"The most rugged and remote of Minnesota's North Shore parks, Crosby Manitou is accessible only to backpackers willing to earn their wilderness. The park has no drive-in campsites; 21 backcountry campsites are reached via 24 miles of challenging trail along the wild Manitou River and its spectacular waterfalls. This is Minnesota's quintessential backcountry experience, with the Superior Hiking Trail passing through the park.",
    amenities:["Backpack Camping Only","Hiking","Waterfalls","Wildlife Viewing","Fishing","Cross-Country Skiing"] },

  { id:24, name:"Glacial Lakes State Park", slug:"glacial-lakes", lat:45.5375, lng:-95.522, county:"Pope", region:"West Central", acres:1880, type:"state-park",
    description:"Rolling hills and sparkling pothole lakes created by glacial activity define the peaceful landscape of Glacial Lakes State Park near Starbuck. Prairie wildflowers carpet the hillsides in summer, and the park's family-friendly trails offer gentle walks through one of Minnesota's most scenic lake country settings. The campground on Mountain Lake is a favorite for families with children.",
    amenities:["Hiking","Camping","Swimming","Fishing","Picnicking","Horse Trails","Cross-Country Skiing","Wildlife Viewing"] },

  { id:25, name:"Glendalough State Park", slug:"glendalough", lat:46.3333, lng:-95.6667, county:"Otter Tail", region:"West Central", acres:1924, type:"state-park",
    description:"Glendalough is Minnesota's quiet park, where motorized watercraft are banned on Annie Battle Lake and the atmosphere encourages genuine natural immersion. The park was a private hunting retreat for the Tribune Company for most of the 20th century before becoming a state park, leaving the landscape remarkably pristine. Non-motorized fishing, wildlife watching, and hiking through diverse forest and prairie are the park's draws.",
    amenities:["Hiking","Camping","Fishing (non-motorized)","Canoeing/Kayaking","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:26, name:"Gooseberry Falls State Park", slug:"gooseberry-falls", lat:47.1469, lng:-91.4632, county:"Lake", region:"North Shore", acres:1662, type:"state-park",
    description:"Gooseberry Falls is the North Shore's most visited park, where the Gooseberry River drops through five magnificent waterfalls before reaching Lake Superior. The park's easy trail access to the falls, combined with Lake Superior's pebble beach and dramatic rocky shoreline, create one of Minnesota's most photographed landscapes. The renovated historic visitor center and CCC-era stone bridges add architectural charm to the natural spectacle.",
    amenities:["Hiking","Camping","Waterfalls","Wildlife Viewing","Picnicking","Cross-Country Skiing","Snowshoeing","Swimming"] },

  { id:27, name:"Grand Portage State Park", slug:"grand-portage", lat:48.0102, lng:-89.612, county:"Cook", region:"North Shore", acres:574, type:"state-park",
    description:"At Minnesota's northeastern tip on the Canadian border, Grand Portage protects the High Falls of the Pigeon River, a thundering 120-foot cascade that is the tallest waterfall in Minnesota. The park sits on Grand Portage Band of Lake Superior Chippewa land, operated through a unique partnership honoring the area's deep Anishinaabe heritage. A 0.4-mile accessible trail leads to the falls overlook, making this magnificent waterfall reachable by nearly all visitors.",
    amenities:["Hiking","Waterfalls","Historic Site","Picnicking","Wildlife Viewing"] },

  { id:28, name:"Great River Bluffs State Park", slug:"great-river-bluffs", lat:43.9464, lng:-91.3993, county:"Winona", region:"Southeast", acres:3067, type:"state-park",
    description:"King's Bluff rises 500 feet above the Mississippi River at Great River Bluffs, offering panoramic views of the river valley and Wisconsin beyond. The park preserves a rare dry goat prairie ecosystem on its south-facing slopes, where cacti and other drought-tolerant plants survive amid the wildflowers. Two National Natural Landmark prairies protect some of the finest remaining bluff prairie in the upper Midwest.",
    amenities:["Hiking","Camping","Wildlife Viewing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:29, name:"Greenleaf Lake State Recreation Area", slug:"greenleaf-lake", lat:45.0159, lng:-94.4667, county:"Meeker", region:"Central", acres:376, type:"state-recreation-area",
    description:"A quiet, family-friendly recreation area surrounding Greenleaf Lake in central Minnesota's lake country. The park offers a peaceful campground, swimming beach, and boat launch for a classic Minnesota lake experience without the crowds of larger parks. It serves as a relaxing base camp for exploring the surrounding central Minnesota landscape.",
    amenities:["Camping","Swimming","Fishing","Boat Launch","Picnicking"] },

  { id:30, name:"Hayes Lake State Park", slug:"hayes-lake", lat:48.6233, lng:-95.5078, county:"Roseau", region:"Northwest", acres:2950, type:"state-park",
    description:"In the far northwest corner of Minnesota, Hayes Lake offers a true northern wilderness experience in a mature mixed boreal forest. The park is prime moose, black bear, and bald eagle territory, with the reservoir lake providing excellent fishing for northern pike and panfish. An extensive snowmobile trail network and remote feel make it a sought-after winter destination.",
    amenities:["Hiking","Camping","Swimming","Fishing","Wildlife Viewing","Cross-Country Skiing","Snowmobiling","Picnicking"] },

  { id:31, name:"Interstate State Park", slug:"interstate", lat:45.395, lng:-92.6697, county:"Chisago", region:"East Central", acres:293, type:"state-park",
    description:"Ancient glacial potholes, the world's deepest, were drilled into volcanic basalt by swirling boulders at the end of the last ice age in Interstate State Park. The park straddles the Minnesota-Wisconsin border on the St. Croix River, one of America's original National Wild and Scenic Rivers. Rock climbing on the dramatic basalt outcroppings and kayaking the rushing St. Croix attract adventurers year-round.",
    amenities:["Hiking","Camping","Rock Climbing","Kayaking/Canoeing","Fishing","Swimming","Picnicking","Cross-Country Skiing"] },

  { id:32, name:"Iron Range OHV State Recreation Area", slug:"iron-range-ohv", lat:47.4825, lng:-92.4435, county:"St. Louis", region:"Northeast", acres:3496, type:"state-recreation-area",
    description:"Built on reclaimed iron ore mining land, this park offers over 100 miles of trails designed specifically for off-highway vehicles including ATVs, dirt bikes, and four-wheel-drive vehicles. The varied terrain includes challenging hills, open meadows, and wooded singletrack on dramatically reshaped mine overburden. Camping facilities support extended OHV riding trips in the heart of the Iron Range.",
    amenities:["Off-Highway Vehicles","Camping","Hiking","Picnicking"] },

  { id:33, name:"Itasca State Park", slug:"itasca", lat:47.1975, lng:-95.202, county:"Hubbard", region:"North Central", acres:32690, type:"state-park",
    description:"Minnesota's oldest and most celebrated state park, Itasca is home to the true source of the Mississippi River, where you can step across the mighty river on stepping stones. Ancient old-growth red and white pines, some nearly 300 years old, tower over 100 miles of hiking trails through this vast wilderness park. Luxury forest cabins, a historic lodge, bike rentals, and a naturalist program make Itasca a complete destination for every generation.",
    amenities:["Hiking","Camping","Swimming","Fishing","Biking","Canoeing/Kayaking","Historic Site","Wildlife Viewing","Cross-Country Skiing","Snowshoeing"] },

  { id:34, name:"Jay Cooke State Park", slug:"jay-cooke", lat:46.6497, lng:-92.3307, county:"Carlton", region:"Northeast", acres:8813, type:"state-park",
    description:"A dramatic swinging bridge spans the boulder-choked St. Louis River gorge at the gateway to Duluth, making Jay Cooke one of Minnesota's most visually dramatic parks. The park's rugged terrain includes ancient rock formations, waterfalls, and 80 miles of trails ranging from gentle riverside walks to challenging ridge hikes. The park was devastated by a 2012 flood and has been dramatically rebuilt, with the recovered forest making the landscape even more wild and beautiful.",
    amenities:["Hiking","Camping","Canoeing/Kayaking","Fishing","Picnicking","Cross-Country Skiing","Snowshoeing","Mountain Biking"] },

  { id:35, name:"John A. Latsch State Park", slug:"john-a-latsch", lat:44.1619, lng:-91.8221, county:"Winona", region:"Southeast", acres:1567, type:"state-park",
    description:"Three soaring bluffs named Faith, Hope, and Charity rise above the Mississippi River at this small but spectacular park near Winona. Steep hiking trails climb to the bluff summits, rewarding hikers with sweeping views of the Mississippi valley, river islands, and Wisconsin beyond. The park preserves an important section of the Great River Road scenic byway.",
    amenities:["Hiking","Picnicking","Wildlife Viewing","Fishing"] },

  { id:36, name:"Judge C. R. Magney State Park", slug:"judge-c-r-magney", lat:47.8513, lng:-90.0584, county:"Cook", region:"North Shore", acres:4514, type:"state-park",
    description:"Judge Magney is home to the legendary Devil's Kettle, a waterfall on the Brule River where half the river plunges into a pothole and simply disappears into the earth, with its ultimate destination still unknown. Remote and little-visited compared to other North Shore parks, it offers a genuine wilderness experience with backcountry campsites and challenging trails. The mystery of the Devil's Kettle has captivated scientists and visitors for generations.",
    amenities:["Hiking","Camping","Backpack Camping","Waterfalls","Fishing","Wildlife Viewing"] },

  { id:37, name:"Kilen Woods State Park", slug:"kilen-woods", lat:43.7266, lng:-95.063, county:"Jackson", region:"Southwest", acres:219, type:"state-park",
    description:"The Des Moines River cuts through a wooded valley of oak and basswood forest in this small southwestern Minnesota park. Kilen Woods offers a quiet, intimate camping experience with easy hiking along the river and through upland prairie. The park serves as a green oasis in the surrounding agricultural landscape of Minnesota's far southwest.",
    amenities:["Hiking","Camping","Fishing","Picnicking","Wildlife Viewing","Cross-Country Skiing"] },

  { id:38, name:"La Salle Lake State Recreation Area", slug:"la-salle-lake", lat:47.3372, lng:-95.1706, county:"Hubbard", region:"North Central", acres:1047, type:"state-recreation-area",
    description:"La Salle Lake is a scenic, uncrowded recreation area in the pine-forested lake country of northern Hubbard County. The clear lake offers excellent fishing for walleye and panfish in a quiet setting away from the summer crowds. Snowmobilers and cross-country skiers take advantage of the remote forest setting in winter.",
    amenities:["Camping","Fishing","Boat Launch","Snowmobiling","Cross-Country Skiing"] },

  { id:39, name:"Lac qui Parle State Park", slug:"lac-qui-parle", lat:45.0205, lng:-95.8889, county:"Lac qui Parle", region:"West Central", acres:1123, type:"state-park",
    description:"At the meeting of the Minnesota River and Lac qui Parle Lake, thousands of Canada geese, snow geese, and sandhill cranes stage here during spring and fall migrations in spectacular numbers, along with bald eagles and white pelicans. The park's diverse habitat, including prairie, marsh, and river corridor, supports an extraordinary variety of bird and mammal species. It is one of Minnesota's premier wildlife viewing destinations.",
    amenities:["Hiking","Camping","Wildlife Viewing","Fishing","Canoeing/Kayaking","Picnicking","Cross-Country Skiing"] },

  { id:40, name:"Lake Bemidji State Park", slug:"lake-bemidji", lat:47.5363, lng:-94.8228, county:"Beltrami", region:"North Central", acres:1688, type:"state-park",
    description:"Birch and pine forest meets the sandy shores of Lake Bemidji in this beloved northern Minnesota park adjacent to the city of Bemidji. The park's naturalist program is one of Minnesota's best, offering guided canoe trips, evening campfire programs, and natural history interpretation for all ages. A unique bog boardwalk trail introduces visitors to the fragile peatland ecosystem hidden just steps from the campground.",
    amenities:["Hiking","Camping","Swimming","Fishing","Canoeing/Kayaking","Picnicking","Cross-Country Skiing","Snowshoeing","Wildlife Viewing"] },

  { id:41, name:"Lake Bronson State Park", slug:"lake-bronson", lat:48.7247, lng:-96.6034, county:"Kittson", region:"Northwest", acres:2984, type:"state-park",
    description:"In Minnesota's remote northwest corner, Lake Bronson centers on a dammed reservoir lake surrounded by aspen and oak forest edging into the northern Great Plains. The park's diverse habitat supports exceptional wildlife viewing, with white-tailed deer, wild turkey, and numerous waterfowl species. It offers a full camping experience with swimming beach, boat launch, and water tower observation deck in an incredibly uncrowded setting.",
    amenities:["Hiking","Camping","Swimming","Fishing","Boat Launch","Wildlife Viewing","Cross-Country Skiing","Snowmobiling"] },

  { id:42, name:"Lake Carlos State Park", slug:"lake-carlos", lat:45.9866, lng:-95.3278, county:"Douglas", region:"West Central", acres:1267, type:"state-park",
    description:"Spring-fed Lake Carlos is one of west-central Minnesota's clearest and deepest lakes, prized for its turquoise water and excellent fishing for walleye, largemouth bass, and panfish. The park's full amenities include a swimming beach, boat launch, horseback riding trails, and a naturalist program. It serves as a gateway to the lakes region around Alexandria, a premier vacation destination.",
    amenities:["Hiking","Camping","Swimming","Fishing","Boat Launch","Horse Trails","Picnicking","Cross-Country Skiing"] },

  { id:43, name:"Lake Louise State Park", slug:"lake-louise", lat:43.5336, lng:-92.5255, county:"Mower", region:"Southeast", acres:1169, type:"state-park",
    description:"Near the Iowa border, Lake Louise is a small, peaceful park where the Upper Iowa River headwaters flow through oak savanna and hardwood forest. The park's trails follow the river through a lovely wooded valley that bursts with wildflowers in spring. Excellent trout fishing, primitive camping, and quiet trails make this a favorite of those who prefer less-traveled destinations.",
    amenities:["Hiking","Camping","Fishing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:44, name:"Lake Maria State Park", slug:"lake-maria", lat:45.3139, lng:-93.9572, county:"Wright", region:"Central", acres:1686, type:"state-park",
    description:"One of Minnesota's finest backpacking parks, Lake Maria offers 35 miles of trail through glacially scoured terrain with backpack campsites, several small lakes, and documented timber wolf territory. The park is a designated primitive recreation area with no drive-in electric campsites, preserving a truly wild atmosphere just an hour from the Twin Cities. Loons nest on the park's quiet lakes each summer, and wildflower meadows brighten the forest clearings.",
    amenities:["Backpack Camping","Hiking","Fishing","Canoeing/Kayaking","Wildlife Viewing","Cross-Country Skiing","Snowshoeing"] },

  { id:45, name:"Lake Shetek State Park", slug:"lake-shetek", lat:44.1022, lng:-95.69, county:"Murray", region:"Southwest", acres:1109, type:"state-park",
    description:"Lake Shetek is the largest lake in southwestern Minnesota, and the park on its shores offers camping, swimming, and some of the best walleye and northern pike fishing in the region. The park sits near the site of the Lake Shetek Massacre of 1862, a tragic event of the U.S.-Dakota War commemorated by an interpretive monument. Pelicans, great blue herons, and other waterbirds are common sights on the shallow lake.",
    amenities:["Hiking","Camping","Swimming","Fishing","Boat Launch","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:46, name:"Lake Vermilion-Soudan Underground Mine", slug:"lake-vermilion-soudan", lat:47.8347, lng:-92.1981, county:"St. Louis", region:"Northeast", acres:4800, type:"state-park",
    description:"Minnesota's newest and one of its most unique parks combines the stunning scenery of Lake Vermilion with the underground world of the historic Soudan Iron Mine, Minnesota's deepest mine at 2,341 feet below the surface. Mine tours descend to the bottom of the earth in 1920s-era ore cages, where physicists used the deep rock to conduct neutrino physics experiments. Lake Vermilion, with its 365 islands and crystal-clear water, is considered one of Minnesota's most beautiful lakes.",
    amenities:["Hiking","Camping","Swimming","Fishing","Boat Launch","Historic Site","Mine Tours","Canoeing/Kayaking"] },

  { id:47, name:"Maplewood State Park", slug:"maplewood", lat:46.5336, lng:-95.9492, county:"Otter Tail", region:"West Central", acres:9250, type:"state-park",
    description:"Maplewood's rolling hills and dozens of small lakes create a patchwork of hardwood forest, prairie, and wetland in the heart of Otter Tail County's lake country. The park is one of western Minnesota's largest at over 9,000 acres, with over 25 miles of hiking trails and an exceptional horse trail system. Birding is superb throughout the park's diverse habitats, with loons on the lakes and a variety of warblers in the forest.",
    amenities:["Hiking","Camping","Swimming","Fishing","Horse Trails","Wildlife Viewing","Cross-Country Skiing","Snowshoeing"] },

  { id:48, name:"McCarthy Beach State Park", slug:"mccarthy-beach", lat:47.6727, lng:-93.0302, county:"St. Louis", region:"Northeast", acres:2565, type:"state-park",
    description:"A beautiful sandy beach on Side Lake leads into the sparkling waters of Sturgeon Lake at this classic Iron Range getaway near Hibbing. The park's clear lakes offer excellent fishing for walleye, northern pike, and crappie, and the sandy beach is one of the finest for swimming in northern Minnesota. Dense northern forest surrounds the campground, creating a cool, shaded retreat even on the hottest summer days.",
    amenities:["Hiking","Camping","Swimming","Fishing","Boat Launch","Canoeing/Kayaking","Sandy Beach","Picnicking"] },

  { id:49, name:"Mille Lacs Kathio State Park", slug:"mille-lacs-kathio", lat:46.1288, lng:-93.7405, county:"Mille Lacs", region:"Central", acres:10585, type:"state-park",
    description:"One of Minnesota's largest parks, Mille Lacs Kathio preserves the outlet of Mille Lacs Lake, the headwaters of the Rum River, and thousands of years of continuous Native American habitation at one of the most important archaeological sites in the upper Midwest. An 100-foot fire observation tower provides sweeping views of the lake and surrounding forest. The Rum River headwaters canoe route is exceptional, passing through pristine wilderness from the lake to Onamia.",
    amenities:["Hiking","Camping","Canoeing/Kayaking","Fishing","Swimming","Historic Site","Cross-Country Skiing","Snowshoeing","Tower Views"] },

  { id:50, name:"Minneopa State Park", slug:"minneopa", lat:44.1622, lng:-94.1022, county:"Blue Earth", region:"South Central", acres:1145, type:"state-park",
    description:"Two picturesque waterfalls cascade through a wooded gorge at Minneopa, whose name means 'water falling twice' in the Dakota language. Adjacent to the falls, a separate bison unit protects a free-roaming herd of American bison on restored native prairie near Mankato. The park combines a classic Minnesotan waterfall experience with one of the most accessible bison viewing opportunities in the state.",
    amenities:["Hiking","Camping","Waterfalls","Wildlife Viewing","Picnicking","Historic Site","Cross-Country Skiing"] },

  { id:51, name:"Minnesota Valley State Recreation Area", slug:"minnesota-valley", lat:44.662, lng:-93.7033, county:"Multiple", region:"Metro", acres:5454, type:"state-recreation-area",
    description:"Stretching over 70 miles along the Minnesota River southwest of the Twin Cities, this linear park protects a critical wildlife corridor through an otherwise developed landscape. Exceptional birding draws thousands of visitors to the river bottomlands each spring and fall, including thousands of raptors during migration. Multiple trailheads and canoe accesses allow visitors to explore different sections of this diverse river park.",
    amenities:["Hiking","Biking","Canoeing/Kayaking","Fishing","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:52, name:"Monson Lake State Park", slug:"monson-lake", lat:45.3205, lng:-95.275, county:"Swift", region:"West Central", acres:187, type:"state-park",
    description:"One of Minnesota's smallest and most remote parks, Monson Lake preserves the site of a 1862 U.S.-Dakota War massacre and commemorates this pivotal moment in Minnesota history. The small lake supports fishing and quiet contemplation in a remote prairie landscape rarely visited. This park rewards those seeking peaceful solitude and a profound connection to Minnesota's complex history.",
    amenities:["Hiking","Fishing","Picnicking","Historic Site"] },

  { id:53, name:"Moose Lake State Park", slug:"moose-lake", lat:46.4363, lng:-92.7252, county:"Carlton", region:"Northeast", acres:1178, type:"state-park",
    description:"Moose Lake is famous as one of the best agate hunting spots in Minnesota, with Lake Superior agates regularly found on the park's gravel beaches after storms. The park surrounds Echo Lake with a peaceful campground and swimming beach convenient to travelers on Interstate 35. The surrounding Carlton County forest offers good opportunities for seeing white-tailed deer year-round.",
    amenities:["Hiking","Camping","Swimming","Fishing","Agate Hunting","Picnicking","Cross-Country Skiing"] },

  { id:54, name:"Myre-Big Island State Park", slug:"myre-big-island", lat:43.6238, lng:-93.2891, county:"Freeborn", region:"Southeast", acres:1641, type:"state-park",
    description:"Big Island rises from Albert Lea Lake in this southern Minnesota park, connected to the mainland by a causeway and offering exceptional lake views and wildlife habitat. The park and surrounding lake are a designated Important Bird Area with nesting bald eagles, great blue herons, and hundreds of thousands of migrating waterfowl each fall. Easy hiking trails and a large campground make this an excellent family destination in the gentle prairie lake country.",
    amenities:["Hiking","Camping","Swimming","Fishing","Canoeing/Kayaking","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:55, name:"Nerstrand-Big Woods State Park", slug:"nerstrand-big-woods", lat:44.3452, lng:-93.1074, county:"Rice", region:"South Central", acres:1280, type:"state-park",
    description:"Nerstrand-Big Woods preserves one of the last significant remnants of the ancient Big Woods maple-basswood forest that once blanketed south-central Minnesota. In spring, the forest floor is blanketed with rare spring ephemerals including dwarf trout lily, an endangered species found almost exclusively in this park. Hidden Falls cascades over a limestone ledge in a secluded glen reached via a lovely ravine trail.",
    amenities:["Hiking","Camping","Waterfalls","Wildlife Viewing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:56, name:"Old Mill State Park", slug:"old-mill", lat:48.3614, lng:-96.5703, county:"Marshall", region:"Northwest", acres:287, type:"state-park",
    description:"Old Mill preserves a functioning 1896 grist mill on the Middle River in the remote northwestern corner of Minnesota, where costumed interpreters demonstrate 19th-century grain milling on summer weekends. The tiny wooded park sits at the edge of the Red River valley's vast flat agricultural landscape, making its river valley feel like a hidden world. A small campground and peaceful trails through the wooded riparian area provide a quiet retreat.",
    amenities:["Hiking","Camping","Historic Site","Fishing","Picnicking"] },

  { id:57, name:"Red River State Recreation Area", slug:"red-river", lat:47.9328, lng:-97.0356, county:"Polk", region:"Northwest", acres:1218, type:"state-recreation-area",
    description:"Stretching along the Red River in the city of East Grand Forks, this linear park provides a 23-mile trail corridor through the flat Red River valley. The park is a hotspot for birding and wildlife watching along the tree-lined river corridor that cuts through surrounding agricultural land. Fishing for channel catfish, northern pike, and walleye in the historic Red River is a major draw.",
    amenities:["Hiking","Biking","Fishing","Canoeing/Kayaking","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:58, name:"Rice Lake State Park", slug:"rice-lake", lat:44.0875, lng:-93.0613, county:"Steele", region:"South Central", acres:1057, type:"state-park",
    description:"A shallow, marsh-fringed lake named for the wild rice that once grew abundantly here draws migratory waterfowl in impressive numbers each spring and fall to this southern Minnesota park. The park's prairie and wetland habitats support a diverse array of wildlife, including nesting trumpeter swans. Easy trails and accessible fishing opportunities make this a family-friendly destination in the gentle rolling farmland of southeast-central Minnesota.",
    amenities:["Hiking","Camping","Fishing","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:59, name:"St. Croix Islands State Recreation Area", slug:"st-croix-islands", lat:45.0852, lng:-92.7861, county:"Washington", region:"Metro", acres:454, type:"state-recreation-area",
    description:"Multiple wooded islands in the St. Croix National Scenic Riverway are accessible by boat from this small recreation area near Stillwater. The shallow river channels between islands offer excellent smallmouth bass and walleye fishing, and the islands' beaches are popular for picnicking and swimming. The area is a quiet contrast to the busy tourist scene of nearby Stillwater.",
    amenities:["Boat-Access","Swimming","Fishing","Picnicking","Wildlife Viewing"] },

  { id:60, name:"St. Croix State Park", slug:"st-croix", lat:45.9741, lng:-92.5835, county:"Pine", region:"East Central", acres:34037, type:"state-park",
    description:"Minnesota's largest state park, St. Croix encompasses 34,000 acres of wilderness along the St. Croix and Kettle rivers, with 127 miles of trails including river canoe routes extending for days. The park's diverse landscape ranges from river bluffs and oak savanna to boreal forest and bog, supporting exceptional biodiversity and abundant white-tailed deer. A full-service campground, horse camp, and backpack sites make this a destination for every style of outdoor recreation.",
    amenities:["Hiking","Camping","Backpack Camping","Canoeing/Kayaking","Fishing","Horse Trails","Mountain Biking","Cross-Country Skiing","Snowmobiling"] },

  { id:61, name:"Sakatah Lake State Park", slug:"sakatah-lake", lat:44.2211, lng:-93.5358, county:"Le Sueur", region:"South Central", acres:842, type:"state-park",
    description:"Sakatah Lake provides a scenic, peaceful backdrop for camping and fishing in the gentle rolling countryside of south-central Minnesota. The park anchors the western end of the Sakatah Singing Hills State Trail, a 39-mile paved biking trail through the heart of lake country. Birding is excellent in the lake's marshes and surrounding forest, with bald eagles commonly sighted year-round.",
    amenities:["Hiking","Camping","Biking","Fishing","Canoeing/Kayaking","Wildlife Viewing","Picnicking","Cross-Country Skiing"] },

  { id:62, name:"Savanna Portage State Park", slug:"savanna-portage", lat:46.8374, lng:-93.1566, county:"Aitkin", region:"Northeast", acres:15818, type:"state-park",
    description:"The historic six-mile Savanna Portage connected the Mississippi watershed to Lake Superior for Native Americans and fur traders for centuries, and this remote park preserves and interprets that critical route. At over 15,000 acres, Savanna Portage is one of Minnesota's largest parks, with genuine wilderness character, abundant wildlife, and numerous interior lakes reachable only by trail. Loon calls echo across the interior lakes each evening in one of Minnesota's most peaceful backcountry settings.",
    amenities:["Hiking","Backpack Camping","Camping","Fishing","Canoeing/Kayaking","Historic Site","Wildlife Viewing","Cross-Country Skiing","Snowmobiling"] },

  { id:63, name:"Scenic State Park", slug:"scenic", lat:47.7158, lng:-93.563, county:"Itasca", region:"Northeast", acres:3355, type:"state-park",
    description:"Deep in the Northwoods near Big Fork, Scenic State Park lives up to its name with pristine Coon and Sand lakes surrounded by old-growth red and white pines. The park's two undeveloped interior lakes offer exceptional fishing for walleye, largemouth bass, and northern pike in clear, spring-fed water. Loons nest reliably here each summer, and the tall pines give the park a cathedral-like atmosphere.",
    amenities:["Hiking","Camping","Fishing","Canoeing/Kayaking","Swimming","Wildlife Viewing","Cross-Country Skiing"] },

  { id:64, name:"Schoolcraft State Park", slug:"schoolcraft", lat:47.225, lng:-93.7999, county:"Cass", region:"Northeast", acres:735, type:"state-park",
    description:"One of Minnesota's least-visited parks, Schoolcraft sits on the Mississippi River in a remote section of Cass County where the river is still young and wild. The park was named for Henry Rowe Schoolcraft, who led the 1832 expedition that identified Lake Itasca as the Mississippi's source. Quiet camping, excellent fishing, and a genuine sense of backcountry solitude make this a discovery for those willing to seek it out.",
    amenities:["Hiking","Camping","Fishing","Canoeing/Kayaking","Historic Site","Picnicking"] },

  { id:65, name:"Sibley State Park", slug:"sibley", lat:45.3197, lng:-95.0231, county:"Kandiyohi", region:"West Central", acres:2984, type:"state-park",
    description:"A fire tower atop Andrew's Hill provides panoramic views of dozens of lakes in the rolling glacial terrain of west-central Minnesota's lake country near New London. The park's diverse habitats range from prairie potholes and marshes to oak woodland and upland fields, supporting excellent birding and wildlife observation year-round. Family-oriented amenities including a swimming beach, campground, and naturalist program make Sibley a beloved regional destination.",
    amenities:["Hiking","Camping","Swimming","Fishing","Wildlife Viewing","Horse Trails","Picnicking","Cross-Country Skiing","Tower Views"] },

  { id:66, name:"Split Rock Creek State Park", slug:"split-rock-creek", lat:43.898, lng:-96.3642, county:"Pipestone", region:"Southwest", acres:400, type:"state-park",
    description:"A reservoir lake on Split Rock Creek provides water-based recreation in the heart of the Pipestone quarry region of southwestern Minnesota. The park is ideally positioned as a camping base for visiting nearby Pipestone National Monument, where Native Americans have quarried sacred red catlinite for pipe-making for centuries. Prairie wildflowers and the distinctive pink-red Sioux quartzite rock give the landscape a unique beauty.",
    amenities:["Hiking","Camping","Swimming","Fishing","Boat Launch","Picnicking"] },

  { id:67, name:"Split Rock Lighthouse State Park", slug:"split-rock-lighthouse", lat:47.1921, lng:-91.3929, county:"Lake", region:"North Shore", acres:2075, type:"state-park",
    description:"The iconic Split Rock Lighthouse perches dramatically on a 130-foot sheer anorthosite cliff above Lake Superior, creating what may be Minnesota's most photographed image. The historic 1910 lighthouse is now operated as a living history museum by the Minnesota Historical Society, with spectacular guided tours and a moving beacon lighting ceremony on November 10th each year. The park's five miles of trail connect to the Superior Hiking Trail and offer stunning lake and cliff views.",
    amenities:["Hiking","Camping","Backpack Camping","Historic Site","Wildlife Viewing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:68, name:"Temperance River State Park", slug:"temperance-river", lat:47.5543, lng:-90.8724, county:"Cook", region:"North Shore", acres:539, type:"state-park",
    description:"The Temperance River earned its name because it has no bar at its mouth, a North Shore joke about a river that comes to Lake Superior without a sandbar. The river has carved a remarkable slot canyon through ancient volcanic rock, creating a series of deep pools and dramatic waterfalls accessible via a dramatic gorge trail. The Superior Hiking Trail passes through the park, and the Lake Superior shoreline offers excellent wave-watching and agate hunting.",
    amenities:["Hiking","Camping","Waterfalls","Fishing","Wildlife Viewing","Cross-Country Skiing","Snowshoeing"] },

  { id:69, name:"Tettegouche State Park", slug:"tettegouche", lat:47.3588, lng:-91.2641, county:"Lake", region:"North Shore", acres:9346, type:"state-park",
    description:"Tettegouche is one of the North Shore's crown jewels, with a dramatic Lake Superior shoreline of towering cliffs, four inland lakes, two waterfalls, and 23 miles of trail including extensive Superior Hiking Trail access. The 60-foot High Falls on the Baptism River is accessible by a short hike, while longer routes reach remote backcountry lakes with waterfront campsites. The park's restored historic Tettegouche Camp cabins can be rented for an extraordinary North Shore retreat.",
    amenities:["Hiking","Camping","Backpack Camping","Waterfalls","Fishing","Canoeing/Kayaking","Swimming","Wildlife Viewing","Cross-Country Skiing","Cabin Rentals"] },

  { id:70, name:"Whitewater State Park", slug:"whitewater", lat:44.0583, lng:-92.0588, county:"Winona", region:"Southeast", acres:2683, type:"state-park",
    description:"Spring-fed Whitewater Creek runs crystal-clear through a dramatic valley of limestone bluffs in Minnesota's driftless bluff country, supporting exceptional wild trout fishing. Turkey vultures soar on thermals above the bluffs in spectacular numbers, and the valley wildflower display in spring is among the best in Minnesota. The campground along the creek is one of the most scenic in the state park system, with the creek running right beside campsites.",
    amenities:["Hiking","Camping","Fishing","Wildlife Viewing","Picnicking","Cross-Country Skiing","Snowshoeing"] },

  { id:71, name:"Wild River State Park", slug:"wild-river", lat:45.568, lng:-92.8758, county:"Chisago", region:"East Central", acres:6800, type:"state-park",
    description:"Thirty-five miles of trail wind through forest, prairie remnants, and river bottomland along an 18-mile stretch of the St. Croix National Scenic Riverway at Wild River. The park offers some of the best backpacking in the metro region, with remote campsites accessible only by foot or canoe along the scenic river. Diverse habitats support outstanding wildlife, and the native prairie restoration areas burst with wildflowers each summer.",
    amenities:["Hiking","Backpack Camping","Camping","Canoeing/Kayaking","Fishing","Wildlife Viewing","Horse Trails","Cross-Country Skiing","Snowshoeing"] },

  { id:72, name:"William O'Brien State Park", slug:"william-obrien", lat:45.2194, lng:-92.766, county:"Washington", region:"Metro", acres:1520, type:"state-park",
    description:"Just 35 miles from the Twin Cities on the St. Croix River, William O'Brien is the quintessential family state park, with a popular swimming beach, spacious campground, and naturalist programs that introduce children to Minnesota's natural world. The park's two sections straddle Highway 95, with the lake and river access on one side and extensive hiking trails through restored prairie and hardwood forest on the other. The St. Croix River shoreline provides excellent fishing and a launch point for canoe trips on this National Scenic Riverway.",
    amenities:["Hiking","Camping","Swimming","Fishing","Canoeing/Kayaking","Picnicking","Cross-Country Skiing","Snowshoeing","Wildlife Viewing"] },

  { id:73, name:"Zippel Bay State Park", slug:"zippel-bay", lat:48.8639, lng:-94.8594, county:"Lake of the Woods", region:"Northwest", acres:3028, type:"state-park",
    description:"On the southern shore of Lake of the Woods, Zippel Bay offers one of Minnesota's most unusual features: a white sand beach on the wild, remote shoreline of one of North America's great fishing lakes. The park sits near the northernmost point of the contiguous United States, giving it a genuine frontier atmosphere with exceptional walleye and sauger fishing. Bald eagles are abundant, the sunsets over the vast lake are extraordinary, and the park marina provides access to Lake of the Woods' legendary walleye waters.",
    amenities:["Hiking","Camping","Sandy Beach","Fishing","Boat Launch/Marina","Wildlife Viewing","Picnicking","Snowmobiling"] }
];
