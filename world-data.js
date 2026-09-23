/* ============================================================
   WORLD DATA — WORLDWEDDINGSTARS
   Couche éditoriale des points lumineux du globe
   (World Wedding Magazine — La Carte, 17 lieux).
   Architecture : POINT → ENTITÉ → SUJET MARIAGE → CONTENU
                  ÉDITORIAL → IMAGE PEXELS → DÉCOUVRIR
   Liaison : chaque entité porte l'`id` exact du lieu (PLACES)
   et ses coordonnées lat/lon identiques.
   Les champs `relations` sont prêts pour un branchement futur
   vers le World Wedding Magazine (édition, page, destination,
   histoire, mariage). Aucune connexion n'est inventée : tant
   qu'une destination éditoriale n'existe pas, sa valeur est
   null et le lien « Découvrir » mène à la photo source Pexels.
   Médias : Pexels — licence Pexels (pexels.com/license).
   Les photos sont des vues des lieux ou des ambiances :
   elles ne présentent jamais un mariage réel.
============================================================ */
const WORLD_DATA={
  version:"2.0.0",
  updated:"2026-09-23",
  provider:"World Wedding Magazine — World Data",
  mediaProvider:{
    name:"Pexels",
    license:"https://www.pexels.com/license/",
    note:"Images d'ambiance et vues de lieux — aucune photographie de mariage réel n'est présentée."
  },
  notes:{
    discover:"Tant que l'édition du World Wedding Magazine consacrée à un point n'existe pas, le lien « Découvrir » mène à la photo source sur Pexels. Le branchement futur se fera via l'objet `relations` (worldData, edition, page, destination, story, wedding)."
  },
  categories:["DESTINATION","PATRIMOINE","CULTURE","TRADITION","ROMANCE","GASTRONOMIE","HONEYMOON","INSOLITE"],
  entities:[
  {
    id:"fes", type:"ville",
    name:"Fès", city:"Fès", country:"Maroc", territory:"Fès-Meknès",
    lat:34.06, lon:-4.98,
    category:"PATRIMOINE",
    sujet:"Destination mariage — médina millénaire classée à l'UNESCO",
    accroche:"Se dire oui dans un labyrinthe vieux de mille ans.",
    contenu:"Fès el-Bali, inscrite au patrimoine mondial de l'UNESCO, est l'une des plus vastes médinas piétonnes au monde. Derrière ses portes de cèdre, des riads à cour de zellige et fontaines murmurent une hospitalité séculaire. Un couple y découvre des toits-terrasses face au coucher du soleil, des artisanats vivants et le rythme lent d'une capitale spirituelle. La négafa, maîtresse de cérémonie, y habille la mariée comme on raconte une histoire de famille.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/36782884/pexels-photo-36782884.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/bustling-street-in-fez-medina-morocco-36782884/",
      author:"Miguel Cuenca",
      retrievedAt:"2026-09-23",
      query:"fez morocco medina",
      subject:"Médina de Fès, Maroc — architecture et ruelles",
      caption:"Ruelle animée de la médina de Fès",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/bustling-street-in-fez-medina-morocco-36782884/"}
  },
  {
    id:"kano", type:"ville",
    name:"Kano", city:"Kano", country:"Nigeria", territory:"Kano",
    lat:12.00, lon:8.52,
    category:"PATRIMOINE",
    sujet:"Cité millénaire haoussa — patrimoine et grandes célébrations",
    accroche:"Quand toute une cité célèbre un mariage.",
    contenu:"Kano, fondée il y a plus d'un millénaire, dresse encore ses murailles de terre et le palais de son émir au cœur de la vieille ville. Les grandes célébrations haoussa y empruntent la tradition du durbar : cavaliers en habits d'apparat, tambours et cortèges qui traversent la cité. Le marché de Kurmi, actif depuis le XVe siècle, fournit parures, épices et présents des noces. Se marier à Kano, c'est entrer dans une histoire qui dépasse les familles.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/30799112/pexels-photo-30799112.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/colorful-nigerian-horse-riders-near-a-minaret-30799112/",
      author:"Alee Abdullahi (DC Shot)",
      retrievedAt:"2026-09-23",
      query:"kano nigeria",
      subject:"Kano, Nigeria — cavaliers du durbar en habits traditionnels près d'un minaret",
      caption:"Cavaliers en habits traditionnels près d'un minaret, Nigeria",
      note:"Vue d'une tradition locale — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/colorful-nigerian-horse-riders-near-a-minaret-30799112/"}
  },
  {
    id:"caire", type:"ville",
    name:"Le Caire", city:"Le Caire", country:"Égypte", territory:"Grand Caire",
    lat:30.04, lon:31.24,
    category:"PATRIMOINE",
    sujet:"Pyramides et Nil — patrimoine monumental du mariage",
    accroche:"Dire oui face à l'éternité.",
    contenu:"Face aux pyramides de Gizeh, dernière des sept merveilles du monde antique encore debout, un mariage prend immédiatement une autre dimension. Le Caire offre des réceptions sur le Nil en felouque ou dans des palais historiques, des cortèges en musique — la zaffa, ses tambours et ses youyous — et des rites portés par des milliers d'années de célébrations. Peu de décors au monde racontent autant l'éternité d'un engagement.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/15127135/pexels-photo-15127135.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/a-silhouette-of-the-pyramids-during-the-golden-hour-15127135/",
      author:"Diego F Parra",
      retrievedAt:"2026-09-23",
      query:"giza pyramids cairo",
      subject:"Gizeh, Égypte — pyramides à l'heure dorée",
      caption:"Les pyramides de Gizeh à l'heure dorée",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/a-silhouette-of-the-pyramids-during-the-golden-hour-15127135/"}
  },
  {
    id:"venise", type:"ville",
    name:"Venise", city:"Venise", country:"Italie", territory:"Vénétie",
    lat:45.44, lon:12.34,
    category:"ROMANCE",
    sujet:"Noces sur la lagune — la ville des amoureux",
    accroche:"Se dire oui au rythme de l'eau.",
    contenu:"Venise célèbre les mariages dans des palais du Grand Canal aux plafonds peints, des églises signées Palladio et des cours secrètes loin de la foule. Les couples arrivent en gondole ou en bateau, les verres de Murano trinquent à la Sérénissime, et la lumière de la lagune fait office de décorateur. Peu de villes au monde transforment à ce point une cérémonie en tableau vivant.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/22848736/pexels-photo-22848736.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/view-of-gondolas-on-the-grand-canal-in-venice-italy-22848736/",
      author:"Michelle Toma",
      retrievedAt:"2026-09-23",
      query:"grand canal venice",
      subject:"Venise, Italie — gondoles sur le Grand Canal",
      caption:"Gondoles sur le Grand Canal, Venise",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/view-of-gondolas-on-the-grand-canal-in-venice-italy-22848736/"}
  },
  {
    id:"bruges", type:"ville",
    name:"Bruges", city:"Bruges", country:"Belgique", territory:"Flandre-Occidentale",
    lat:51.21, lon:3.22,
    category:"HONEYMOON",
    sujet:"Lune de miel en Flandre — canaux et béguinage",
    accroche:"Le romantisme au ralenti.",
    contenu:"Bruges, cœur médiéval classé à l'UNESCO, est l'une des lunes de miel les plus dépaysantes d'Europe : barques sur les canaux au petit matin, cygnes du Minnewater, carillon du beffroi et chocolateries à chaque coin de rue. Le béguinage, fondé au XIIIe siècle, borde un clos de silence à deux pas de l'animation. On s'y marie dans des salles historiques, on y revient pour l'anniversaire.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/5612504/pexels-photo-5612504.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/canal-and-townhouses-in-old-town-5612504/",
      author:"Icarus",
      retrievedAt:"2026-09-23",
      query:"bruges belgium",
      subject:"Bruges, Belgique — canal et maisons de la vieille ville",
      caption:"Canal et maisons de la vieille ville de Bruges",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/canal-and-townhouses-in-old-town-5612504/"}
  },
  {
    id:"paris", type:"ville",
    name:"Paris", city:"Paris", country:"France", territory:"Île-de-France",
    lat:48.86, lon:2.35,
    category:"ROMANCE",
    sujet:"Ville romantique — destination mariage emblématique",
    accroche:"La ville lumière n'a jamais si bien porté son nom.",
    contenu:"Paris reste la capitale mondiale des mariages romantiques : cérémonie à l'hôtel de ville ou dans une église historique, photos de couple à l'aube sur les ponts de la Seine, réception sur une péniche ou dans un salon haussmannien. La tour Eiffel, les jardins à la française et les grands palais offrent un décor immédiatement reconnaissable, du plus intime au plus spectaculaire.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/4456347/pexels-photo-4456347.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/eiffel-tower-in-paris-skyline-4456347/",
      author:"Vlada Karpovich",
      retrievedAt:"2026-09-23",
      query:"paris france eiffel tower",
      subject:"Paris, France — tour Eiffel et skyline",
      caption:"La tour Eiffel dans le ciel de Paris",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/eiffel-tower-in-paris-skyline-4456347/"}
  },
  {
    id:"edimbourg", type:"ville",
    name:"Édimbourg", city:"Édimbourg", country:"Royaume-Uni", territory:"Écosse",
    lat:55.95, lon:-3.19,
    category:"DESTINATION",
    sujet:"Mariages d'Écosse — vieille ville et cornemuses",
    accroche:"Un décor volcanique pour des noces légendaires.",
    contenu:"Édimbourg marie deux villes en une : la Old Town médiévale et la New Town géorgienne, toutes deux classées à l'UNESCO. Les cérémonies se tiennent dans des salles voûtées, des églises de la Royal Mile ou face au château perché sur son rocher volcanique. Le joueur de cornemuse accompagne les cortèges, le chardon pique les boutonnières et le whisky clôt les toasts. L'Écosse est aussi la patrie du handfasting, ce rite ancien qui lie les mains des époux.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/11276637/pexels-photo-11276637.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/old-historic-brick-buildings-against-blue-sky-11276637/",
      author:"Anna Kozlova",
      retrievedAt:"2026-09-23",
      query:"edinburgh scotland",
      subject:"Édimbourg, Écosse — le château et l'architecture historique",
      caption:"Le château d'Édimbourg sous un ciel bleu",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/old-historic-brick-buildings-against-blue-sky-11276637/"}
  },
  {
    id:"lucknow", type:"ville",
    name:"Lucknow", city:"Lucknow", country:"Inde", territory:"Uttar Pradesh",
    lat:26.85, lon:80.95,
    category:"GASTRONOMIE",
    sujet:"Festins de noces awadhi — la ville des nawabs",
    accroche:"Le mariage commence à table.",
    contenu:"Lucknow, capitale des nawabs d'Awadh, a élevé la cuisine au rang d'art de cour : kebab tunday fondants, biryani parfumé et douceurs au safran composent les festins de noces servis jusqu'au bout de la nuit. Entre les célébrations, la ville se visite pour le Bara Imambara et sa salle voûtée sans piliers, la tour de l'Horloge de Husainabad et les bazars de Chowk. Recevoir à Lucknow, c'est offrir une table dont on parle pendant des années.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/36493429/pexels-photo-36493429.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/iconic-clock-tower-of-lucknow-india-36493429/",
      author:"Manan Maheshwari",
      retrievedAt:"2026-09-23",
      query:"lucknow india",
      subject:"Lucknow, Inde — tour de l'Horloge de Husainabad",
      caption:"La tour de l'Horloge de Husainabad, Lucknow",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/iconic-clock-tower-of-lucknow-india-36493429/"}
  },
  {
    id:"kutch", type:"ville",
    name:"Kutch", city:"Kutch", country:"Inde", territory:"Gujarat",
    lat:23.73, lon:69.86,
    category:"INSOLITE",
    sujet:"Noces sur le désert blanc — le Grand Rann de sel",
    accroche:"Se marier là où la terre devient sel.",
    contenu:"Le Grand Rann de Kutch, désert de sel qui s'étend jusqu'à l'horizon au Gujarat, offre l'un des décors de mariage les plus insolites au monde : une étendue blanche à perte de vue, des couchers de soleil incandescents et, chaque hiver, le Rann Utsav, festival de tentes où se croisent musiques, danses et savoir-faire de la région. Les villages rabari et ahir environnants perpétuent des célébrations hautes en couleur, entre parures d'argent et danses au crépuscule.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/39012210/pexels-photo-39012210.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/camel-walking-in-the-great-rann-of-kutch-sunset-39012210/",
      author:"Sneha Ravindranath",
      retrievedAt:"2026-09-23",
      query:"rann of kutch",
      subject:"Grand Rann de Kutch, Gujarat — désert de sel au coucher du soleil",
      caption:"Chameau au coucher du soleil sur le Grand Rann de Kutch",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/camel-walking-in-the-great-rann-of-kutch-sunset-39012210/"}
  },
  {
    id:"kyoto", type:"ville",
    name:"Kyoto", city:"Kyoto", country:"Japon", territory:"Kansai",
    lat:35.01, lon:135.77,
    category:"TRADITION",
    sujet:"Mariage shinto et kimono — l'ancienne capitale impériale",
    accroche:"Mille ans de cérémonie en une heure.",
    contenu:"À Kyoto, ancienne capitale impériale, le mariage shintoïste se déroule dans des sanctuaires millénaires : la mariée porte le shiromuku blanc ou l'uchikake coloré, le couple échange trois fois trois coupes de saké lors du san-san-kudo, et les rues de Gion ou d'Higashiyama servent d'écrin aux cortèges en kimono. La pagode Yasaka veille sur le quartier historique, tandis que les maisons de thé prolongent la fête. Kyoto offre la forme la plus aboutie du mariage japonais traditionnel.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/37943558/pexels-photo-37943558.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/yasaka-pagoda-in-kyoto-at-sunset-37943558/",
      author:"Santesson89",
      retrievedAt:"2026-09-23",
      query:"kyoto japan",
      subject:"Kyoto, Japon — pagode Yasaka au coucher du soleil",
      caption:"La pagode Yasaka au coucher du soleil, Kyoto",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/yasaka-pagoda-in-kyoto-at-sunset-37943558/"}
  },
  {
    id:"samarkand", type:"ville",
    name:"Samarkand", city:"Samarkand", country:"Ouzbékistan", territory:"Samarcande",
    lat:39.65, lon:66.96,
    category:"PATRIMOINE",
    sujet:"Le Registan et les noces d'Ouzbékistan",
    accroche:"Une place bleue pour un jour doré.",
    contenu:"Samarkand, carrefour des routes caravanières depuis l'Antiquité, dresse les trois madrasas du Registan, couvertes de mosaïques turquoise et dorées. Les mariages ouzbeks y sont des affaires de quartier : des centaines d'invités, du plov servi en immenses marmites, des musiciens et des danses jusqu'à l'aube. Non loin, Shah-i-Zinda aligne ses mausolées de céramique bleue, tandis que le village de Konigil perpétue le papier de mûrier artisanal. Peu de décors portent à ce point la promesse d'éternité.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/16534574/pexels-photo-16534574.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/ornamented-wall-of-building-at-registan-square-in-samarkand-16534574/",
      author:"AXP Photography",
      retrievedAt:"2026-09-23",
      query:"samarkand registan",
      subject:"Samarkand, Ouzbékistan — façade ornée du Registan",
      caption:"Façade ornée du Registan, Samarkand",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/ornamented-wall-of-building-at-registan-square-in-samarkand-16534574/"}
  },
  {
    id:"isfahan", type:"ville",
    name:"Isfahan", city:"Isfahan", country:"Iran", territory:"Ispahan",
    lat:32.65, lon:51.67,
    category:"CULTURE",
    sujet:"Le sofreh aghd et les jardins d'Ispahan",
    accroche:"« La moitié du monde » comme salle des fêtes.",
    contenu:"Isfahan, surnommée « la moitié du monde », déroule la place Naqsh-e Jahan, l'une des plus vastes places monumentales du globe, bordée de mosquées aux coupoles turquoise et du bazar historique. Le mariage persan s'organise autour du sofreh aghd : une nappe cérémonielle chargée de miroirs, de cierges, d'herbes, de fruits secs et de douceurs, devant laquelle les époux échangent leurs vœux. Les coupoles de la mosquée du Sheikh Lotfollah et les ponts historiques sur le Zayandeh offrent aux noces un décor de miniature persane.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/20081362/pexels-photo-20081362.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/sheikh-lotfollah-mosque-in-isfahan-in-iran-20081362/",
      author:"Faruk Tokluoglu",
      retrievedAt:"2026-09-23",
      query:"isfahan",
      subject:"Isfahan, Iran — mosquée du Sheikh Lotfollah et son reflet",
      caption:"La mosquée du Sheikh Lotfollah reflétée, Isfahan",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/sheikh-lotfollah-mosque-in-isfahan-in-iran-20081362/"}
  },
  {
    id:"hanoi", type:"ville",
    name:"Hanoï", city:"Hanoï", country:"Vietnam", territory:"Delta du Fleuve Rouge",
    lat:21.03, lon:105.85,
    category:"TRADITION",
    sujet:"Cérémonies vietnamiennes — thé, laque et áo dài",
    accroche:"Deux familles, des plateaux laqués, une promesse.",
    contenu:"À Hanoï, le mariage vietnamien commence par la cérémonie des présents : la famille du marié apporte les mâm quả, plateaux laqués de betel, de thé, de fruits et de gâteaux, voilés de rouge. Les époux s'inclinent devant l'autel des ancêtres, servent le thé à leurs parents et reçoivent leurs conseils — un rite transmis depuis des générations. Dans le vieux quartier aux maisons-tubes, les cortèges klaxonnent entre les lacs et les pagodes, et la fête se prolonge autour de grands banquets.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/36776809/pexels-photo-36776809.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/busy-street-scene-in-hanoi-with-pedestrians-and-traffic-36776809/",
      author:"Hùng Quang",
      retrievedAt:"2026-09-23",
      query:"hanoi",
      subject:"Hanoï, Vietnam — rue animée du centre et passants",
      caption:"Rue animée du vieux Hanoï",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/busy-street-scene-in-hanoi-with-pedestrians-and-traffic-36776809/"}
  },
  {
    id:"oaxaca", type:"ville",
    name:"Oaxaca", city:"Oaxaca de Juárez", country:"Mexique", territory:"Oaxaca",
    lat:17.07, lon:-96.72,
    category:"CULTURE",
    sujet:"Traditions festives et couleurs — culture du mariage",
    accroche:"Ici, la fête est un art de vivre.",
    contenu:"Le centre historique d'Oaxaca, classé à l'UNESCO avec le site zapotèque de Monte Albán, vibre de couleurs : façades peintes, papier picado au-dessus des rues, fanfares et mezcal. Les célébrations mexicaines y durent plusieurs jours, entre cuisine de mole réputée, artisanat zapotèque et hospitalité débordante. Un mariage à Oaxaca est une fête totale, portée par toute une ville.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/27065503/pexels-photo-27065503.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/colorful-buildings-and-cloths-over-street-in-town-27065503/",
      author:"Christian Israel Palacios Resendiz",
      retrievedAt:"2026-09-23",
      query:"oaxaca mexico",
      subject:"Oaxaca de Juárez, Mexique — rues coloniales colorées",
      caption:"Rue colorée d'Oaxaca de Juárez",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/colorful-buildings-and-cloths-over-street-in-town-27065503/"}
  },
  {
    id:"cusco", type:"ville",
    name:"Cusco", city:"Cusco", country:"Pérou", territory:"Cusco",
    lat:-13.53, lon:-71.97,
    category:"HONEYMOON",
    sujet:"Lune de miel andine — Cusco et la Vallée sacrée",
    accroche:"Le réveil au-dessus des nuages.",
    contenu:"Ancienne capitale de l'Empire inca à 3 400 mètres d'altitude, Cusco est la porte d'entrée d'une lune de miel hors norme : Vallée sacrée, marchés andins, haciendas coloniales et, à quelques heures, le Machu Picchu au lever du jour. Dans la ville, classée à l'UNESCO, les murs incas soutiennent encore les maisons coloniales, et la Plaza de Armas vibre de musiques et de cortèges. Les couples y cherchent l'altitude, l'histoire et le vertige — dans tous les sens du terme.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/16963411/pexels-photo-16963411.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/mountains-surrounding-the-peruvian-city-of-cusco-16963411/",
      author:"Marco Luigy",
      retrievedAt:"2026-09-23",
      query:"cusco peru",
      subject:"Cusco, Pérou — la ville andine entourée de montagnes",
      caption:"Cusco entourée par les montagnes andines",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/mountains-surrounding-the-peruvian-city-of-cusco-16963411/"}
  },
  {
    id:"chichi", type:"ville",
    name:"Chichicastenango", city:"Chichicastenango", country:"Guatemala", territory:"Quiché",
    lat:14.94, lon:-91.11,
    category:"CULTURE",
    sujet:"Le marché de Chichicastenango — couleurs du Guatemala",
    accroche:"Jeudi : la ville devient un arc-en-ciel.",
    contenu:"Deux fois par semaine, Chichicastenango tient l'un des marchés les plus célèbres d'Amérique centrale : des étals à perte de vue sur les collines du Quiché, des fleurs par brassées et des couleurs partout. L'église de Santo Tomás, au sommet de son escalier, voit se mêler rites catholiques et traditions maya quiché ; les mariages y empruntent aux deux, entre bénédiction, copal et musiques de procession. Le village entier célèbre avec les époux — c'est l'essence du mariage guatémaltèque.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/11828651/pexels-photo-11828651.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/iglesia-de-santo-tomas-chichicastenango-guatemala-11828651/",
      author:"Kelly",
      retrievedAt:"2026-09-23",
      query:"chichicastenango market",
      subject:"Chichicastenango, Guatemala — église Santo Tomás et marché vus du ciel",
      caption:"L'église Santo Tomás et le marché de Chichicastenango, vus du ciel",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/iglesia-de-santo-tomas-chichicastenango-guatemala-11828651/"}
  },
  {
    id:"auckland", type:"ville",
    name:"Auckland", city:"Auckland", country:"Aotearoa / Nouvelle-Zélande", territory:"Tāmaki Makaurau",
    lat:-36.85, lon:174.76,
    category:"HONEYMOON",
    sujet:"Lune de miel à Waiheke — vignobles et Pacifique",
    accroche:"Vignes, volcans et Pacifique.",
    contenu:"Auckland, la « ville des voiles », étale ses maisons entre deux ports et une cinquantaine de cônes volcaniques. À quarante minutes de ferry, l'île de Waiheke aligne vignobles, oliveraies et criques — l'un des terrains de lune de miel les plus prisés du Pacifique Sud : dégustations face à la mer, randonnées côtières et couchers de soleil sur les vignes. Les couples y célèbrent aussi des mariages en plein air, entre plages dorées et collines vertes. Un bout du monde étonnamment simple à aimer.",
    media:{
      source:"Pexels",
      imageUrl:"https://images.pexels.com/photos/35227201/pexels-photo-35227201.jpeg?auto=compress&cs=tinysrgb&w=1000",
      pageUrl:"https://www.pexels.com/photo/scenic-beach-view-in-auckland-new-zealand-35227201/",
      author:"Elijah J Cobb",
      retrievedAt:"2026-09-23",
      query:"waiheke island",
      subject:"Auckland, Nouvelle-Zélande — plage et côte verdoyante",
      caption:"Plage et côte verdoyante à Auckland, Nouvelle-Zélande",
      note:"Vue du lieu — image d'ambiance, aucun mariage réel n'est représenté."
    },
    relations:{worldData:null, edition:null, page:null, destination:null, story:null, wedding:null},
    discover:{label:"Découvrir", kind:"pexels-source", href:"https://www.pexels.com/photo/scenic-beach-view-in-auckland-new-zealand-35227201/"}
  }
]};
window.WORLD_DATA=WORLD_DATA;
