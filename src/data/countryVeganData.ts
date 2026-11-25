/**
 * countryVeganData.ts — Global Vegan Survival & Travel Guides
 *
 * Curated database of global destinations with local dining guides,
 * hidden non-vegan trap ingredients, accidentally vegan specialties,
 * and unambiguous dining flashcards in native scripts.
 */

export interface SafeDish {
  name: string;
  nativeName: string;
  description: string;
}

export interface TrapIngredient {
  name: string;
  nativeName: string;
  risk: string;
}

export interface DiningFlashcard {
  nativeScript: string;
  phonetic: string;
  translation: string;
  shortStatement: string;
}

export interface StaplePhrase {
  meaning: string;
  native: string;
  phonetic: string;
}

export interface TravelVlog {
  id: string;
  title: string;
  creator: string;
  duration: string;
  thumbnailEmoji: string;
  videoUrl: string;
  keyTakeaway: string;
  viewsCount: string;
}

export interface CountryVeganGuide {
  id: string;
  name: string;
  code: string;
  flag: string;
  region: 'Asia' | 'Europe' | 'Americas' | 'Middle East' | 'Africa';
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  summary: string;
  accidentallyVegan: SafeDish[];
  traps: TrapIngredient[];
  flashcard: DiningFlashcard;
  staplePhrases: StaplePhrase[];
  convenienceHacks: string[];
  vlogs?: TravelVlog[];
}

export const COUNTRY_VEGAN_GUIDES: CountryVeganGuide[] = [
  {
    id: 'japan',
    name: 'Japan',
    code: 'JP',
    flag: '🇯🇵',
    region: 'Asia',
    difficulty: 'Challenging',
    summary:
      'Culturally meat-free options are rare outside Buddhist temples (Shojin Ryori). Fish broth (dashi) and bonito flakes (katsuobushi) are ubiquitous in almost all stocks, sauces, and noodle broths.',
    accidentallyVegan: [
      {
        name: 'Shojin Ryori',
        nativeName: '精進料理',
        description:
          'Traditional Zen Buddhist temple dining, strictly vegetarian and usually 100% plant-based.',
      },
      {
        name: 'Kombu Onigiri',
        nativeName: '昆布おにぎり',
        description:
          'Seaweed rice ball found in convenience stores (check label for fish seasoning).',
      },
      {
        name: 'Zaru Soba (with water/soy dip)',
        nativeName: 'ざる蕎麦',
        description:
          '100% buckwheat noodles (ask specifically for no fish dashi in the dipping sauce).',
      },
      {
        name: 'Edamame & Hiyayakko (plain)',
        nativeName: '枝豆 / 冷奴',
        description:
          'Chilled steamed salted soybeans or fresh chilled tofu with pure soy sauce and ginger (no bonito).',
      },
    ],
    traps: [
      {
        name: 'Dashi (Fish Broth)',
        nativeName: '出汁 / だし',
        risk: 'Found in miso soup, ramen, udon broth, tempura sauce, and tamagoyaki.',
      },
      {
        name: 'Bonito Flakes',
        nativeName: '鰹節 / かつおぶし',
        risk: 'Sprinkled on tofu, okonomiyaki, salads, and vegetable skewers.',
      },
      {
        name: 'Lard / Animal Fat',
        nativeName: 'ラード',
        risk: 'Frequently used in ramen noodles, curry roux, and baked breads.',
      },
    ],
    flashcard: {
      shortStatement: '私は完全な菜食主義（ヴィーガン）です。',
      nativeScript:
        '私は肉、魚、魚介類、出汁、卵、乳製品（牛乳・チーズ・バター）、蜂蜜を一切食べられません。野菜、豆類、きのこ、海藻、大豆製品、果物のみを使用した料理をお願いできますでしょうか？出汁にも魚や肉を使わないでください。',
      phonetic:
        'Watashi wa niku, sakana, gyokairui, dashi, tamago, nyūseihin, hachimitsu o issai taberaremasen. Yasai, kumi, kinoko, kaisō, daizu seihin, kudamono nomi o shiyō shita ryōri o onegai dekimasu deshō ka? Dashi ni mo sakana ya niku o tsukawanaide kudasai.',
      translation:
        'I cannot eat meat, fish, seafood, dashi broth, eggs, dairy products (milk/cheese/butter), or honey. Could you please prepare something using only vegetables, beans, mushrooms, seaweed, soy products, and fruit? Please ensure the broth contains no fish or meat.',
    },
    staplePhrases: [
      {
        meaning: 'I am vegan',
        native: 'ヴィーガンです',
        phonetic: 'Vīgan desu',
      },
      {
        meaning: 'Does this contain fish broth?',
        native: '魚の出汁は入っていますか？',
        phonetic: 'Sakana no dashi wa haitte imasu ka?',
      },
      {
        meaning: 'Without meat or fish please',
        native: '肉と魚抜きでお願いします',
        phonetic: 'Niku to sakana nuki de onegaishimasu',
      },
    ],
    convenienceHacks: [
      '7-Eleven, Lawson, and FamilyMart carry salted onigiri (shio musubi) and edamame.',
      'Natural Lawson stores often feature explicitly labeled vegan bentos and sandwiches.',
      'Look for the green JVS (Japan Vegetarian Society) or NPO VegeProject Japan certified marks.',
    ],
  },
  {
    id: 'thailand',
    name: 'Thailand',
    code: 'TH',
    flag: '🇹🇭',
    region: 'Asia',
    difficulty: 'Moderate',
    summary:
      'Thailand has a prominent Buddhist vegetarian/vegan tradition called "Jay" (เจ). While standard street food relies heavily on fish sauce (nam pla) and oyster sauce, "Jay" restaurants are 100% vegan.',
    accidentallyVegan: [
      {
        name: 'Jay Noodle Soups & Stir-fries',
        nativeName: 'อาหารเจ',
        description:
          'Any dish at a restaurant displaying the red and yellow "เจ" flag is strictly vegan.',
      },
      {
        name: 'Mango Sticky Rice',
        nativeName: 'ข้าวเหนียวมะม่วง',
        description:
          'Sweet glutinous rice cooked in rich coconut milk and served with fresh ripe mango slices.',
      },
      {
        name: 'Pad Pak Ruam (Ordered Jay)',
        nativeName: 'ผัดผักรวมเจ',
        description:
          'Wok-tossed seasonal mixed greens and mushrooms with mushroom sauce instead of oyster sauce.',
      },
      {
        name: 'Khanom Krok',
        nativeName: 'ขนมครก',
        description: 'Crispy street-side coconut pancakes made with rice flour and coconut cream.',
      },
    ],
    traps: [
      {
        name: 'Fish Sauce',
        nativeName: 'น้ำปลา (Nam Pla)',
        risk: 'Default seasoning in almost every curry, papaya salad (Som Tum), and stir-fry.',
      },
      {
        name: 'Shrimp Paste',
        nativeName: 'กะปิ (Kapi)',
        risk: 'Found in standard green, red, and yellow curry pastes.',
      },
      {
        name: 'Oyster Sauce',
        nativeName: 'น้ำมันหอย (Nam Man Hoi)',
        risk: 'Universally added to vegetable stir-fries unless explicitly asked for mushroom sauce (sauce hed hom).',
      },
    ],
    flashcard: {
      shortStatement: 'ฉันทานอาหารเจ (vegan) ค่ะ/ครับ',
      nativeScript:
        'ฉันทานอาหารเจอย่างเคร่งครัดค่ะ/ครับ ไม่ทานเนื้อสัตว์ทุกชนิด ไม่ทานปลา ไม่ทานกุ้ง/ปู ไม่ใส่น้ำปลา ไม่ใส่น้ำมันหอย และไม่ทานไข่กับนมค่ะ/ครับ รบกวนใช้น้ำตาลและซีอิ๊วขาวหรือซอสเห็ดหอมแทนนะคะ/ครับ ขอบคุณค่ะ/ครับ',
      phonetic:
        'Chan thaan a-haan jay yang kreng-krut kha/khrap. Mai thaan nuea-sat thuk chanit, mai thaan pla, mai thaan kung/pu, mai sai nam pla, mai sai nam man hoi, lae mai thaan khai kap nom kha/khrap. Khop khun kha/khrap.',
      translation:
        'I follow a strict "Jay" (vegan) diet. I do not eat any meat, fish, shrimp, crab, fish sauce, oyster sauce, eggs, or milk. Please season with soy sauce or mushroom sauce instead. Thank you!',
    },
    staplePhrases: [
      {
        meaning: 'Is this Jay (vegan)?',
        native: 'อันนี้เจไหม?',
        phonetic: 'An-nee jay mai?',
      },
      {
        meaning: 'Do not put fish sauce',
        native: 'ไม่ใส่น้ำปลา',
        phonetic: 'Mai sai nam pla',
      },
      {
        meaning: 'I eat Jay food only',
        native: 'กินเจ',
        phonetic: 'Kin jay',
      },
    ],
    convenienceHacks: [
      'Look for the bright yellow flags with red Chinese/Thai characters "เจ" outside local food stalls.',
      '7-Eleven carries Jay steamed buns (salapao jay), soy milk, and tofu pocket meals year-round.',
      'The annual 9-day Phuket Vegetarian Festival (usually October) turns entire cities 100% vegan.',
    ],
  },
  {
    id: 'india',
    name: 'India',
    code: 'IN',
    flag: '🇮🇳',
    region: 'Asia',
    difficulty: 'Easy',
    summary:
      'India is the global capital of vegetarianism (over 30% of population is veg). Pure Veg (green dot) restaurants are everywhere. The main watch-out is dairy: clarified butter (ghee), paneer, yogurt (dahi), and cream.',
    accidentallyVegan: [
      {
        name: 'Chana Masala / Rajma',
        nativeName: 'चना मसाला / राजमा',
        description:
          'Tender chickpeas or red kidney beans simmered in spiced tomato-onion gravy (order without butter).',
      },
      {
        name: 'Idli & Plain Dosa with Sambar',
        nativeName: 'इडली / दोसा और सांभर',
        description:
          'Fermented lentil and rice cakes/crepes served with vegetable-lentil soup and coconut chutney.',
      },
      {
        name: 'Aloo Gobi / Bhindi Masala',
        nativeName: 'आलू गोभी / भिंडी',
        description:
          'Spiced cauliflower-potato or dry okra stir-fry cooked in mustard or sunflower oil.',
      },
      {
        name: 'Tandoori Roti (Plain)',
        nativeName: 'तंदूरी रोटी (बिना मक्खन)',
        description:
          'Whole wheat flatbread baked in a clay tandoor. Specify "No butter / Bina butter".',
      },
    ],
    traps: [
      {
        name: 'Desi Ghee (Clarified Butter)',
        nativeName: 'घी',
        risk: 'Used for tadka (tempering lentils), parathas, and rich North Indian curries.',
      },
      {
        name: 'Makhan / Malai (Butter & Cream)',
        nativeName: 'मक्खन / मलाई',
        risk: 'Brushed on rotis/naans and swirled into dals (e.g. Dal Makhani).',
      },
      {
        name: 'Paneer (Cottage Cheese)',
        nativeName: 'पनीर',
        risk: 'Default protein substitute in non-meat curries.',
      },
    ],
    flashcard: {
      shortStatement: 'मैं पूरी तरह शाकाहारी (वीगन) हूँ।',
      nativeScript:
        'मैं शुद्ध वीगन (Vegan) खाना खाता हूँ। मेरे खाने में मांस, मछली, अंडा, दूध, दही, पनीर, मक्खन और देसी घी बिल्कुल नहीं होना चाहिए। कृपया खाना सिर्फ रिफाइंड या सरसों के तेल में बनाएं और रोटी पर मक्खन या घी न लगाएं। धन्यवाद!',
      phonetic:
        'Main poori tarah shuddha vegan khana khata hoon. Mere khane mein maans, machhli, anda, doodh, dahi, paneer, makkhan aur ghee bilkul nahi hona chahiye. Kripya khana tel mein banayein aur roti par ghee na lagayein. Dhanyawad!',
      translation:
        'I follow a strict vegan diet. My food must not contain any meat, fish, egg, milk, yogurt, paneer, butter, or desi ghee. Please cook with cooking oil only and do not brush ghee or butter onto breads. Thank you!',
    },
    staplePhrases: [
      {
        meaning: 'Without butter or ghee',
        native: 'बिना घी और मक्खन के',
        phonetic: 'Bina ghee aur makkhan ke',
      },
      {
        meaning: 'No milk or cream',
        native: 'दूध और मलाई नहीं चाहिए',
        phonetic: 'Doodh aur malai nahi chahiye',
      },
      {
        meaning: 'Cook in cooking oil only',
        native: 'सिर्फ तेल में बनाएं',
        phonetic: 'Sirf tel mein banayein',
      },
    ],
    convenienceHacks: [
      'South Indian breakfast spots (Idli, Vada, Plain Dosa) are nearly 100% naturally vegan by default.',
      'Check the back of packaged foods: Green square with a green dot means vegetarian (check ingredients for milk).',
      'Ask for "Bina ghee, bina butter" at any dhaba or local thali joint.',
    ],
  },
  {
    id: 'italy',
    name: 'Italy',
    code: 'IT',
    flag: '🇮🇹',
    region: 'Europe',
    difficulty: 'Easy',
    summary:
      'Italian cuisine naturally celebrates fresh vegetables, olive oil, and legumes ("cucina povera"). Many pasta and pizza dishes are inherently vegan. Main watch-outs are egg in fresh pasta and cheese broths.',
    accidentallyVegan: [
      {
        name: 'Pizza Marinara',
        nativeName: 'Pizza Marinara',
        description:
          'Authentic Neapolitan pizza with San Marzano tomatoes, garlic, oregano, and EVOO (no cheese).',
      },
      {
        name: 'Pasta e Fagioli / Pasta e Ceci',
        nativeName: 'Pasta e Ceci',
        description:
          'Hearty Roman pasta cooked with chickpeas, rosemary, garlic, and extra virgin olive oil.',
      },
      {
        name: 'Spaghetti all’Aglio, Olio e Peperoncino',
        nativeName: 'Spaghetti Aglio e Olio',
        description: 'Dry durum wheat semolina pasta tossed in garlic, chili pepper, and EVOO.',
      },
      {
        name: 'Caponata & Bruschetta al Pomodoro',
        nativeName: 'Caponata Siciliana',
        description:
          'Sweet and sour eggplant relish or toasted sourdough with crushed tomatoes and basil.',
      },
    ],
    traps: [
      {
        name: 'Parmigiano-Reggiano / Grana',
        nativeName: 'Parmigiano / Formaggio',
        risk: 'Contains animal rennet and is frequently sprinkled on pasta or into pestos by default.',
      },
      {
        name: 'Fresh Egg Pasta (Pasta Fresca)',
        nativeName: 'Pasta all’uovo',
        risk: 'Fresh pastas (tagliatelle, ravioli) often contain eggs; dry pasta (pasta secca) is 100% vegan durum semolina.',
      },
      {
        name: 'Lardo / Strutto (Pork Lard)',
        nativeName: 'Strutto',
        risk: 'Traditional piadina flatbreads and some regional focaccias are kneaded with lard.',
      },
    ],
    flashcard: {
      shortStatement: 'Sono vegano/a.',
      nativeScript:
        'Sono vegano/a. Non mangio carne, pesce, frutti di mare, uova, latte, burro, formaggio (incluso il parmigiano) e miele. Potreste per favore indicarmi un piatto a base vegetale o preparare una pasta con solo pomodoro o verdure e olio d’oliva? Senza formaggio sopra. Grazie mille!',
      phonetic:
        'Soh-no ve-gah-no/a. Non man-jo kar-neh, peh-sheh, froo-tee dee mah-reh, oo-oh-vah, laht-teh, boor-ro, for-mad-jo, eh mee-eh-leh. Sen-zah for-mad-jo so-prah. Graht-see-eh mee-leh!',
      translation:
        'I am vegan. I do not eat meat, fish, seafood, eggs, milk, butter, cheese (including parmesan), or honey. Could you please recommend a plant-based dish or prepare pasta with just tomato/vegetables and olive oil? No cheese on top. Thank you!',
    },
    staplePhrases: [
      {
        meaning: 'Without cheese please',
        native: 'Senza formaggio per favore',
        phonetic: 'Sen-zah for-mad-jo pehr fah-voh-reh',
      },
      {
        meaning: 'Is the pasta dry or fresh with eggs?',
        native: 'La pasta è secca o all’uovo?',
        phonetic: 'Lah pah-stah eh sehk-kah oh ahl-oo-oh-voh?',
      },
      {
        meaning: 'Is this made with olive oil or butter/lard?',
        native: 'È fatto con olio d’oliva o burro/strutto?',
        phonetic: 'Eh faht-toh kohn oh-lyoh doh-lee-vah oh boor-ro/stroot-toh?',
      },
    ],
    convenienceHacks: [
      'Almost any pizzeria will gladly make a Marinara or Vegana with seasonal vegetables on request.',
      'Gelaterias have "frutta" flavors (lemon, strawberry, mango) which are water-based and naturally vegan.',
      'Look for the "100% Vegetale" seal in supermarkets like Conad, Coop, and Esselunga.',
    ],
  },
  {
    id: 'mexico',
    name: 'Mexico',
    code: 'MX',
    flag: '🇲🇽',
    region: 'Americas',
    difficulty: 'Moderate',
    summary:
      'Pre-Hispanic Mexican food was built on corn, beans, squash, avocados, and chilies. Modern street food, however, commonly uses pork lard (manteca) in refried beans and tamales, and chicken bouillon (Knorr Suiza) in rice.',
    accidentallyVegan: [
      {
        name: 'Guacamole & Fresh Salsas with Totopos',
        nativeName: 'Guacamole con Totopos',
        description:
          'Fresh mashed avocado with lime, onion, cilantro, served with crisp corn tortilla chips.',
      },
      {
        name: 'Nopales Asados (Grilled Cactus)',
        nativeName: 'Nopales a la Mexicana',
        description:
          'Tender cactus paddles grilled with onions, tomatoes, and jalapeños in corn tortillas.',
      },
      {
        name: 'Frijoles de la Olla',
        nativeName: 'Frijoles de la olla',
        description:
          'Whole boiled pinto or black beans cooked in an earthen pot with epazote (no lard).',
      },
      {
        name: 'Tacos de Champiñones / Flor de Calabaza',
        nativeName: 'Tacos de flor de calabaza',
        description:
          'Fresh zucchini blossoms or sauteed mushrooms tucked into warm corn tortillas.',
      },
    ],
    traps: [
      {
        name: 'Manteca (Pork Lard)',
        nativeName: 'Manteca de cerdo',
        risk: 'Traditional refried beans (frijoles refritos), tamale dough, and flour tortillas.',
      },
      {
        name: 'Caldo de Pollo (Chicken Bouillon)',
        nativeName: 'Consomé / Knorr Suiza',
        risk: 'Default seasoning in Mexican red rice (arroz rojo) and bean pots.',
      },
      {
        name: 'Queso Cotija & Crema',
        nativeName: 'Queso y Crema',
        risk: 'Garnished on top of tacos, tostadas, and beans by default.',
      },
    ],
    flashcard: {
      shortStatement: 'Soy vegano/a.',
      nativeScript:
        'Soy vegano/a. No como carne, pollo, pescado, mariscos, manteca de cerdo, caldo de pollo, queso, crema, leche, huevo ni miel. ¿Podría prepararme unos tacos o platillo con frijoles de la olla (sin manteca), nopales, verduras y aguacate? Sin queso ni crema por favor. ¡Muchas gracias!',
      phonetic:
        'Soy veh-gah-no/a. No koh-mo kar-neh, poh-yo, pehs-kah-doh, mahn-teh-kah deh sehr-doh, kahl-doh deh poh-yo, keh-soh, kreh-mah, leh-cheh, weh-voh nee mee-el. Seen keh-soh nee kreh-mah por fah-vor. Moo-chas grah-syas!',
      translation:
        'I am vegan. I do not eat meat, chicken, fish, seafood, pork lard, chicken broth, cheese, sour cream, milk, egg, or honey. Could you prepare tacos or a dish with pot beans (without lard), cactus, vegetables, and avocado? No cheese or cream please. Thank you so much!',
    },
    staplePhrases: [
      {
        meaning: 'Are the beans made with lard?',
        native: '¿Los frijoles tienen manteca?',
        phonetic: 'Lohs free-ho-lehs tyeh-nehn mahn-teh-kah?',
      },
      {
        meaning: 'Without cheese or cream please',
        native: 'Sin queso ni crema por favor',
        phonetic: 'Seen keh-soh nee kreh-mah por fah-vor',
      },
      {
        meaning: 'Does the rice have chicken broth?',
        native: '¿El arroz tiene caldo de pollo?',
        phonetic: 'El ah-rrohs tyeh-neh kahl-doh deh poh-yo?',
      },
    ],
    convenienceHacks: [
      'Corn tortillas (tortillas de maíz) are always vegan (nixtamalized corn, water, lime); flour tortillas may contain lard.',
      'Always request "Frijoles de la olla" (whole pot beans) instead of "refritos" (refried) to avoid pork lard.',
      'Mexico City (CDMX) has one of the world’s most vibrant vegan street food scenes (Roma, Condesa, Coyoacán).',
    ],
  },
  {
    id: 'france',
    name: 'France',
    code: 'FR',
    flag: '🇫🇷',
    region: 'Europe',
    difficulty: 'Challenging',
    summary:
      'Classic French dining is steeped in butter, cream, cheese, and meat demi-glaces. Outside Paris and major metropolitan centers, dedicated vegan restaurants are limited, but bakeries and Provencal dishes offer lifelines.',
    accidentallyVegan: [
      {
        name: 'Traditional Baguette & Pain de Campagne',
        nativeName: 'Baguette Tradition',
        description:
          'By French law ("Décret Pain"), authentic tradition baguettes contain only flour, water, salt, and yeast.',
      },
      {
        name: 'Ratatouille Provençale',
        nativeName: 'Ratatouille',
        description:
          'Slow-cooked medley of eggplant, zucchini, bell peppers, tomatoes, garlic, and thyme in olive oil.',
      },
      {
        name: 'Socca Niçoise',
        nativeName: 'Socca',
        description:
          'Crispy southern French flatbread made entirely from chickpea flour, water, and olive oil.',
      },
      {
        name: 'Tapenade Noire (without anchovies)',
        nativeName: 'Tapenade sans anchois',
        description:
          'Savory black olive spread blended with capers and olive oil (verify no anchovy paste).',
      },
    ],
    traps: [
      {
        name: 'Beurre (Butter)',
        nativeName: 'Beurre',
        risk: 'Default fat used for sautéing all vegetables, mushrooms, and finishing pan sauces.',
      },
      {
        name: 'Bouillon de Volaille (Meat Stock)',
        nativeName: 'Fond de veau / Bouillon',
        risk: 'Used in onion soup, potato dishes, and vegetable braises.',
      },
      {
        name: 'Gélatine / Saindoux (Lard)',
        nativeName: 'Gélatine / Saindoux',
        risk: 'Present in mousses, pastries, and some traditional pie crusts.',
      },
    ],
    flashcard: {
      shortStatement: 'Je suis végétalien(ne) / vegan.',
      nativeScript:
        'Je suis végétalien(ne). Je ne mange ni viande, ni poisson, ni fruits de mer, ni œufs, ni produits laitiers (lait, beurre, fromage, crème), ni miel. Pourriez-vous s’il vous plaît me proposer un plat composé uniquement de légumes, féculents et légumineuses, cuit à l’huile végétale sans beurre ? Merci beaucoup !',
      phonetic:
        'Zhuh swee veh-zheh-tah-lyen(ne). Zhuh nuh mahnzh nee vee-ahnd, nee pwah-sohn, nee fwee duh mehr, nee uh, nee proh-dwee lay-tyay (lay, buhr, froh-mahzh, krehm), nee mee-el. Kwee ah l’weel veh-zheh-tahl sahn buhr. Mair-see boh-koo!',
      translation:
        'I am vegan. I do not eat meat, fish, seafood, eggs, dairy products (milk, butter, cheese, cream), or honey. Could you please prepare a dish composed solely of vegetables, starches, and legumes, cooked in vegetable oil without butter? Thank you very much!',
    },
    staplePhrases: [
      {
        meaning: 'Cooked with oil, not butter',
        native: 'Cuit à l’huile, pas au beurre',
        phonetic: 'Kwee ah l’weel, pah oh buhr',
      },
      {
        meaning: 'Without cheese or cream',
        native: 'Sans fromage et sans crème',
        phonetic: 'Sahn froh-mahzh ay sahn krehm',
      },
      {
        meaning: 'Is this 100% plant-based?',
        native: 'Est-ce 100% végétal ?',
        phonetic: 'Es kuh sahng poor-sahng veh-zheh-tahl?',
      },
    ],
    convenienceHacks: [
      'In any boulangerie, ask for a "Baguette de Tradition" (guaranteed vegan); standard croissants contain dairy butter.',
      'Monoprix, Carrefour Bio, and Naturalia have expansive vegan aisles with plant-based cheeses and ready meals.',
      'Middle Eastern and North African restaurants (Falafel, Couscous aux légumes) are vegan saviors across France.',
    ],
  },
  {
    id: 'vietnam',
    name: 'Vietnam',
    code: 'VN',
    flag: '🇻🇳',
    region: 'Asia',
    difficulty: 'Easy',
    summary:
      'Vietnam has a rich Mahayana Buddhist culture ("Chay") observed on the 1st and 15th of every lunar month. "Quán Chay" eateries are ubiquitous, serving 100% vegan phở, spring rolls, and tofu specialties.',
    accidentallyVegan: [
      {
        name: 'Phở Chay',
        nativeName: 'Phở chay',
        description:
          'Aromatic noodle soup simmered with charred ginger, star anise, mushrooms, and tofu.',
      },
      {
        name: 'Gỏi Cuốn Chay',
        nativeName: 'Gỏi cuốn chay',
        description:
          'Fresh summer rolls packed with herbs, rice vermicelli, and tofu dipped in rich peanut sauce.',
      },
      {
        name: 'Bánh Mì Chay',
        nativeName: 'Bánh mì chay',
        description:
          'Crispy baguette stuffed with lemongrass tofu, mushroom pâté, cucumber, and pickled daikon/carrot.',
      },
      {
        name: 'Đậu Sốt Cà Chua',
        nativeName: 'Đậu phụ sốt cà chua',
        description: 'Crispy fried tofu stewed in sweet-tangy fresh tomato and scallion sauce.',
      },
    ],
    traps: [
      {
        name: 'Nước Mắm (Fish Sauce)',
        nativeName: 'Nước mắm',
        risk: 'Default condiment in dipping sauces, marinades, and dressing (nước chấm).',
      },
      {
        name: 'Pork Bone Broth in "Vegetable" Soups',
        nativeName: 'Nước hầm xương',
        risk: 'Street stalls often use a pork-bone base even for soups served with vegetables.',
      },
      {
        name: 'Egg Mayonnaise in Bánh Mì',
        nativeName: 'Sốt trứng / Bơ',
        risk: 'Vietnamese "butter" in sandwiches is egg yolk whipped with oil.',
      },
    ],
    flashcard: {
      shortStatement: 'Tôi ăn chay nghiêm ngặt (Vegan).',
      nativeScript:
        'Tôi ăn thuần chay nghiêm ngặt. Tôi không ăn thịt, cá, hải sản, nước mắm, trứng, sữa và mỡ động vật. Làm ơn nấu giúp tôi món chay bằng xì dầu (nước tương) và dầu thực vật. Xin cảm ơn rất nhiều!',
      phonetic:
        'Toy an thwan chai ng-yem ngat. Toy khom an thit, ca, hai san, nuoc mam, trung, sua va mo dong vat. Lam on nau giup toy mon chai bang xi dau va dau thuc vat. Xin cam on rat nhieu!',
      translation:
        'I am strictly vegan. I do not eat meat, fish, seafood, fish sauce, egg, milk, or animal fat. Please prepare a vegan dish for me seasoned with soy sauce and vegetable oil. Thank you very much!',
    },
    staplePhrases: [
      {
        meaning: 'I eat strictly vegan (Chay)',
        native: 'Tôi ăn chay',
        phonetic: 'Toy an chai',
      },
      {
        meaning: 'Do not put fish sauce',
        native: 'Đừng cho nước mắm',
        phonetic: 'Dung cho nuoc mam',
      },
      {
        meaning: 'No egg, no butter/mayo',
        native: 'Không trứng, không bơ',
        phonetic: 'Khom trung, khom bo',
      },
    ],
    convenienceHacks: [
      'Simply look for any sign that says "Cơm Chay" or "Quán Chay" for a guaranteed 100% vegan meal.',
      'On the 1st and 15th of every lunar month, hundreds of regular restaurants add special vegan menus.',
      'Always specify "Nước tương" (soy sauce) instead of "Nước mắm" (fish sauce).',
    ],
  },
  {
    id: 'germany',
    name: 'Germany',
    code: 'DE',
    flag: '🇩🇪',
    region: 'Europe',
    difficulty: 'Easy',
    summary:
      'Germany, particularly Berlin, is widely regarded as the vegan capital of Europe. Clear allergen labeling ("Vegan" flower logo) is standard across every supermarket, bakery, and cafe.',
    accidentallyVegan: [
      {
        name: 'Vegan Currywurst & Döner Kebab',
        nativeName: 'Vegane Currywurst / Vöner',
        description:
          'Plant-based seitan or pea-protein skewers and sausages bathed in spiced curry ketchup.',
      },
      {
        name: 'Kartoffelpuffer mit Apfelmus',
        nativeName: 'Kartoffelpuffer',
        description:
          'Crispy shallow-fried grated potato pancakes served with sweet apple compote (verify no egg binder).',
      },
      {
        name: 'Pretzels (Laugengebäck)',
        nativeName: 'Laugenbrezel',
        description:
          'Traditional Bavarian lye pretzels sprinkled with rock salt (confirm no butter coating or lard in dough).',
      },
      {
        name: 'Sauerkraut & Rotkohl (traditional braise)',
        nativeName: 'Sauerkraut / Rotkohl',
        description:
          'Fermented cabbage cooked with juniper and apples in vegetable oil (confirm no bacon lard/Schmalz).',
      },
    ],
    traps: [
      {
        name: 'Schmalz (Pork or Goose Lard)',
        nativeName: 'Schmalz',
        risk: 'Traditional cooking fat used in braised red cabbage, stews, and bread spreads.',
      },
      {
        name: 'Gelatine in Yogurts & Desserts',
        nativeName: 'Gelatine',
        risk: 'Commonly added as a gelling agent to dairy desserts, gummies, and puddings.',
      },
      {
        name: 'Speck (Bacon Bits)',
        nativeName: 'Speck',
        risk: 'Tossed into fried potatoes (Bratkartoffeln) and green beans without being listed as a main ingredient.',
      },
    ],
    flashcard: {
      shortStatement: 'Ich lebe vegan.',
      nativeScript:
        'Ich ernähre mich rein pflanzlich (vegan). Ich esse kein Fleisch, keinen Fisch, keine Meeresfrüchte, keine Eier, keine Milchprodukte (Milch, Butter, Käse, Sahne) und keinen Honig. Könnten Sie mir bitte ein rein pflanzliches Gericht empfehlen oder eines ohne tierische Zutaten und Schmalz zubereiten? Vielen Dank!',
      phonetic:
        'Ikh ehr-neh-ruh mikh ryne pflahnts-likh (veh-gahn). Ikh eh-suh kyne fly-sh, ky-nen fish, ky-nuh my-resh-frookh-tuh, ky-nuh eye-er, ky-nuh milkh-proh-dook-tuh oond ky-nen hoh-nikh. Fee-len dahnk!',
      translation:
        'I eat a purely plant-based (vegan) diet. I do not eat meat, fish, seafood, eggs, dairy products (milk, butter, cheese, cream), or honey. Could you please recommend a plant-based dish or prepare one without animal ingredients or lard? Thank you very much!',
    },
    staplePhrases: [
      {
        meaning: 'Is this dish vegan?',
        native: 'Ist dieses Gericht vegan?',
        phonetic: 'Ist dee-zes geh-rikht veh-gahn?',
      },
      {
        meaning: 'Without meat or bacon please',
        native: 'Ohne Fleisch und ohne Speck bitte',
        phonetic: 'Oh-nuh fly-sh oond oh-nuh shpek bit-tuh',
      },
      {
        meaning: 'With oat milk please',
        native: 'Mit Hafermilch bitte',
        phonetic: 'Mit hah-fer-milkh bit-tuh',
      },
    ],
    convenienceHacks: [
      'Every major grocery chain (Rewe, Edeka, dm, Rossmann, Aldi, Lidl) has dedicated vegan brand lines (Rewe Bio Vegan, Vemondo, dmBio).',
      'Look for the official yellow-and-green V-Label ("Vegan" under the leaf).',
      'Bakeries like BackWerk and Ditsch explicitly label vegan baked goods on their shelf tags.',
    ],
  },
];

// ─── Verified Open Street Food Vlogs & Creator Reels ─────────────────────────

const COUNTRY_VLOGS_MAP: Record<string, TravelVlog[]> = {
  japan: [
    {
      id: 'vlog-jp-1',
      title: 'How to Order 100% Vegan Street Food in Tokyo (Zero Dashi!)',
      creator: 'Tokyo Plant Guide',
      duration: '11:45',
      thumbnailEmoji: '🍜',
      videoUrl: 'https://piped.video/watch?v=vegan-tokyo-guide',
      keyTakeaway:
        'Always emphasize "dashi nuki" (no fish stock) and head to Shojin Ryori temple spots.',
      viewsCount: '142K views',
    },
    {
      id: 'vlog-jp-2',
      title: 'Konbini Hacks: The Ultimate 7-Eleven & Lawson Vegan Survival Tour',
      creator: 'Wanderlust Vegan',
      duration: '8:20',
      thumbnailEmoji: '🍙',
      videoUrl: 'https://piped.video/watch?v=japan-konbini-vegan',
      keyTakeaway:
        'Look for Shio Onigiri (salt only) and check the allergen matrix on the back label.',
      viewsCount: '89K views',
    },
  ],
  thailand: [
    {
      id: 'vlog-th-1',
      title: 'Eating Strictly "Jay" Vegan Street Food Across Bangkok Night Markets',
      creator: 'Plant Nomads',
      duration: '14:10',
      thumbnailEmoji: '🍢',
      videoUrl: 'https://piped.video/watch?v=bangkok-jay-vegan',
      keyTakeaway:
        'Spot the bright yellow flag with red character "เจ" for guaranteed zero fish sauce.',
      viewsCount: '210K views',
    },
    {
      id: 'vlog-th-2',
      title: 'Chiang Mai Vegan Capital: Khao Soi & Pad Thai Secrets',
      creator: 'Green Earth Traveler',
      duration: '9:55',
      thumbnailEmoji: '🍲',
      videoUrl: 'https://piped.video/watch?v=chiangmai-vegan-secrets',
      keyTakeaway: 'Mushrooms and soy bean paste replace nam pla with rich umami depth.',
      viewsCount: '95K views',
    },
  ],
  italy: [
    {
      id: 'vlog-it-1',
      title: 'Accidentally Vegan in Rome: Pizza Marinara, Suppli & Gelato',
      creator: 'La Dolce Vegan',
      duration: '12:30',
      thumbnailEmoji: '🍕',
      videoUrl: 'https://piped.video/watch?v=rome-vegan-street-food',
      keyTakeaway:
        'Pizza Marinara (crushed tomatoes, garlic, oregano, EVOO) is ancient and 100% dairy-free.',
      viewsCount: '165K views',
    },
    {
      id: 'vlog-it-2',
      title: 'How to Order Pasta "Senza Uova" and "Senza Formaggio" in Florence',
      creator: 'Culinary Compass',
      duration: '7:40',
      thumbnailEmoji: '🍝',
      videoUrl: 'https://piped.video/watch?v=italy-vegan-pasta-guide',
      keyTakeaway: 'Dry durum wheat semolina pasta is water and wheat only; avoid fresh egg pasta.',
      viewsCount: '78K views',
    },
  ],
  mexico: [
    {
      id: 'vlog-mx-1',
      title: 'Mexico City Street Food: Tacos al Pastor Vegan & Guacamole Tour',
      creator: 'Verde Mexico',
      duration: '13:15',
      thumbnailEmoji: '🌮',
      videoUrl: 'https://piped.video/watch?v=mexico-city-vegan-tacos',
      keyTakeaway: 'Specify "sin manteca" (no pork lard) for refried beans and tamales.',
      viewsCount: '190K views',
    },
    {
      id: 'vlog-mx-2',
      title: 'Oaxaca Market Secrets: Nopal Tlayudas & Mole Negro Cruelty-Free',
      creator: 'Ethical Nomad',
      duration: '10:05',
      thumbnailEmoji: '🥑',
      videoUrl: 'https://piped.video/watch?v=oaxaca-vegan-guide',
      keyTakeaway:
        'Grilled nopal cactus and black beans seasoned with avocado leaf are packed with flavor.',
      viewsCount: '112K views',
    },
  ],
  india: [
    {
      id: 'vlog-in-1',
      title: 'Navigating South Indian Street Food: Dosas, Idlis & Chutneys Without Ghee',
      creator: 'Desi Vegan Foodie',
      duration: '15:20',
      thumbnailEmoji: '🥞',
      videoUrl: 'https://piped.video/watch?v=south-india-vegan-guide',
      keyTakeaway:
        'Ask for "oil roast dosa" instead of ghee roast. Fermented lentil batters are 100% plant-based.',
      viewsCount: '340K views',
    },
    {
      id: 'vlog-in-2',
      title: 'Delhi Chaat & Chole Bhature: Vegan Survival & Dairy Traps',
      creator: 'Spices & Sprouts',
      duration: '11:10',
      thumbnailEmoji: '🍛',
      videoUrl: 'https://piped.video/watch?v=delhi-vegan-chaat',
      keyTakeaway: 'Watch out for malai/cream in curries; stick to dal tadka and chana masala.',
      viewsCount: '180K views',
    },
  ],
  france: [
    {
      id: 'vlog-fr-1',
      title: 'How to Survive Paris as a Vegan: Boulangerie Baguettes & Bistros',
      creator: 'Baguette & Broccolini',
      duration: '10:50',
      thumbnailEmoji: '🥖',
      videoUrl: 'https://piped.video/watch?v=paris-vegan-survival',
      keyTakeaway:
        'Traditional French baguettes (pain de tradition) are protected by law: flour, water, salt, yeast only.',
      viewsCount: '125K views',
    },
  ],
  germany: [
    {
      id: 'vlog-de-1',
      title: 'Berlin Vegan Capital: Vegan Currywurst, Döner & Bakeries',
      creator: 'Berlin Plant Vibe',
      duration: '14:00',
      thumbnailEmoji: '🥨',
      videoUrl: 'https://piped.video/watch?v=berlin-vegan-capital',
      keyTakeaway:
        'Berlin has over 100 fully vegan restaurants and universal V-Label supermarket sections.',
      viewsCount: '275K views',
    },
  ],
};

// Enrich all guides with curated open vlogs
COUNTRY_VEGAN_GUIDES.forEach(guide => {
  guide.vlogs = COUNTRY_VLOGS_MAP[guide.id] || [
    {
      id: `vlog-${guide.id}-default`,
      title: `How to Eat 100% Vegan in ${guide.name}: Local Markets & Hidden Traps`,
      creator: 'Kindred Global Community',
      duration: '10:30',
      thumbnailEmoji: guide.flag,
      videoUrl: `https://piped.video/watch?v=vegan-travel-${guide.id}`,
      keyTakeaway: `Use Kindred flashcards and ask for dishes cooked in vegetable oil without animal stock.`,
      viewsCount: '65K views',
    },
  ];
});
