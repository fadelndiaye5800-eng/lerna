/* ==========================================================================
   LERNA — Les 25 questions (texte du document maître v3.0) + traduction EN
   Version « jeu d'images » : chaque réponse a son sticker (assets/stickers/).
   - « Autre » + champ libre sur toutes les questions dont la liste ne couvre pas tout
   - Langues : niveau « À l'aise », « Intermédiaire » ou « Débutant » pour chaque langue cochée
   - Localisation : drapeaux de la région d'abord, intitulés du bac selon le pays, budget dans la devise locale
   - Financement : plusieurs sources possibles en même temps
   - La question ouverte (dans 10 ans) est posée à la fin
   Les identifiants d'options sont stables : ils servent au moteur de matching,
   au prompt IA et aux colonnes Supabase (table profils).
   ========================================================================== */
(function () {
  'use strict';

  window.LERNA_BLOCKS = [
    { fr: 'Bloc 1 — Qui es-tu ?', en: 'Block 1 — Who are you?' },
    { fr: 'Bloc 2 — Tes forces académiques', en: 'Block 2 — Your academic strengths' },
    { fr: 'Bloc 3 — Tes ambitions', en: 'Block 3 — Your ambitions' },
    { fr: 'Bloc 4 — Ta situation réelle', en: 'Block 4 — Your real situation' },
    { fr: "Bloc 5 — Ton style d'apprentissage", en: 'Block 5 — Your learning style' },
    { fr: 'Pour finir — Ta vision', en: 'Last step — Your vision' }
  ];

  function o(id, img, fr, en, dfr, den) {
    var x = { id: id, img: img, label: { fr: fr, en: en } };
    if (dfr) x.desc = { fr: dfr, en: den };
    return x;
  }
  function other(fr, en) { return { ph: { fr: fr, en: en } }; }

  /* Langues d'études (pas de langues locales) — nom dans la langue elle-même sous l'étiquette */
  function lg(id, img, fr, en, native) { var x = o(id, img, fr, en); x.native = native; return x; }
  window.LERNA_LANG_LEVELS = {
    aise: { label: { fr: "À l'aise", en: 'Fluent' }, desc: { fr: 'Je peux suivre des cours', en: 'I can follow classes' } },
    inter: { label: { fr: 'Intermédiaire', en: 'Intermediate' }, desc: { fr: 'Je me débrouille', en: 'I get by' } },
    /* Débutant : aucune école qui enseigne dans cette langue, sauf avec une année de langue avant */
    deb: { label: { fr: 'Débutant', en: 'Beginner' }, desc: { fr: 'Je commence à apprendre', en: "I'm just starting to learn" } }
  };
  window.LERNA_LANG_LEVEL_ORDER = ['aise', 'inter', 'deb'];
  window.LERNA_LANG_LEVEL_IMG = { aise: 'muscle', inter: 'seedling', deb: 'chick' };

  var SUBJECTS = [
    o('maths', 'numbers', 'Mathématiques', 'Mathematics', 'Logique, calcul, raisonnement', 'Logic, calculation, reasoning'),
    o('physique', 'flask', 'Physique-Chimie', 'Physics & Chemistry', 'Sciences expérimentales', 'Experimental sciences'),
    o('svt', 'dna', 'SVT / Biologie', 'Biology / Life sciences', 'Vivant, corps humain, nature', 'Living things, the human body, nature'),
    o('histoire', 'map', 'Histoire-Géographie', 'History & Geography', 'Monde, sociétés, cultures', 'The world, societies, cultures'),
    o('eco', 'chart-bar', 'Économie / Gestion', 'Economics / Management', 'Business, argent, marchés', 'Business, money, markets'),
    o('litterature', 'pen', 'Littérature / Philo', 'Literature / Philosophy', 'Écriture, pensée, langage', 'Writing, thinking, language'),
    o('langues', 'speaking', 'Langues étrangères', 'Foreign languages', "Communiquer en d'autres langues", 'Communicating in other languages'),
    o('info', 'laptop', 'Informatique', 'Computer science', 'Technologie, code, numérique', 'Technology, code, digital'),
    o('arts', 'palette', 'Arts / Musique', 'Arts / Music', 'Créativité, expression artistique', 'Creativity, artistic expression'),
    o('sport', 'ball', 'Sport / EPS', 'Sport / PE', 'Corps, effort, performance', 'Body, effort, performance')
  ];

  window.LERNA_QUESTIONS = [
    /* ---------------- BLOC 1 ---------------- */
    {
      id: 'q1', block: 0, type: 'single', layout: 'tiles3',
      title: { fr: 'Tu as quel âge ?', en: 'How old are you?' },
      sub: { fr: 'Pas de filtre, pas de jugement — juste pour mieux t\'orienter.', en: 'No filter, no judgement — just to guide you better.' },
      options: [
        o('lt15', 'child', 'Moins de 15 ans', 'Under 15'),
        o('15-17', 'teen', '15 – 17 ans', '15 – 17'),
        o('18-20', 'cap', '18 – 20 ans', '18 – 20'),
        o('21-24', 'briefcase', '21 – 24 ans', '21 – 24'),
        o('25-30', 'rocket', '25 – 30 ans', '25 – 30'),
        o('gt30', 'star', 'Plus de 30 ans', 'Over 30')
      ]
    },
    {
      id: 'q2', block: 0, type: 'single', layout: 'rows',
      title: { fr: 'Tu en es où dans ton parcours scolaire ?', en: 'Where are you in your education right now?' },
      sub: { fr: 'Là où tu es aujourd\'hui, pas là où tu veux être.', en: 'Where you are today, not where you want to be.' },
      options: [
        o('college', 'backpack', 'Collège', 'Middle school', 'Je suis encore en 3ème ou avant', "I'm in year 9 / 3ème or below"),
        o('lycee', 'school', 'Lycée — pas encore en Terminale', 'High school — not final year yet', 'Seconde ou Première', 'Year 10 or 11 (Seconde or Première)'),
        o('terminale', 'target', 'Terminale', 'Final year of high school', 'Je passe mon bac cette année ou je l\'ai eu récemment', "I'm sitting my final exams this year or just passed them"),
        o('superieur', 'cap', 'Déjà dans le supérieur', 'Already in higher education', 'Je suis à l\'université ou en école et je cherche à m\'orienter différemment', "I'm at university or college and want to change direction"),
        o('travail', 'briefcase', 'Je travaille déjà', "I'm already working", 'Je veux reprendre des études ou me former', 'I want to go back to studying or train'),
        o('pause', 'compass', 'Pause entre deux', 'Taking a break', 'J\'ai arrêté et je cherche la bonne direction pour reprendre', "I stopped and I'm looking for the right direction to start again")
      ],
      other: other('Précise ta situation…', 'Describe your situation…')
    },
    {
      id: 'q3', block: 0, type: 'single', layout: 'tiles',
      title: { fr: 'Tu as ton bac ou un diplôme équivalent ?', en: 'Do you have your high-school diploma or equivalent?' },
      sub: { fr: 'Ça change les portes qui s\'ouvrent pour toi.', en: 'It changes which doors open for you.' },
      options: [
        o('bac-s', 'microscope', 'Oui — Bac S / Scientifique', 'Yes — Science track'),
        o('bac-es', 'chart-up', 'Oui — Bac ES / Économique', 'Yes — Economics track'),
        o('bac-l', 'book-open', 'Oui — Bac L / Littéraire', 'Yes — Literature track'),
        o('bac-tech', 'wrench', 'Oui — Bac Tech / Pro', 'Yes — Technical / Vocational'),
        o('autre-systeme', 'globe-net', 'Oui — Diplôme d\'un autre système', 'Yes — Another system', 'BFEM, WAEC, A-Levels, Bac arabe...', 'WAEC, A-Levels, IB, Arabic Bac...'),
        o('pas-encore', 'hourglass', 'Pas encore — je le prépare', "Not yet — I'm preparing for it")
      ],
      other: other('Ex : capacité en droit, DAEU, diplôme professionnel…', 'E.g. access diploma, vocational certificate…')
    },
    {
      id: 'q4', block: 0, type: 'country',
      title: { fr: 'Tu es dans quel pays en ce moment ?', en: 'Which country are you in right now?' },
      sub: { fr: 'Pour qu\'on prenne en compte ta situation réelle de départ.', en: 'So we take your real starting point into account.' },
      placeholder: { fr: 'Cherche ton pays…', en: 'Search for your country…' }
    },
    {
      id: 'q5', block: 0, type: 'multi', layout: 'tiles3', levels: true,
      title: { fr: 'Tu parles quelles langues ?', en: 'Which languages do you speak?' },
      sub: { fr: 'Coche les langues que tu parles, puis dis-nous ton niveau dans chacune.', en: 'Tick the languages you speak, then tell us your level in each one.' },
      options: [
        lg('fr', 'flag-fr', 'Français', 'French', 'Français'),
        lg('en', 'flag-gb', 'Anglais', 'English', 'English'),
        lg('ar', 'lang-ar', 'Arabe', 'Arabic', 'العربية'),
        lg('es', 'flag-es', 'Espagnol', 'Spanish', 'Español'),
        lg('pt', 'flag-pt', 'Portugais', 'Portuguese', 'Português'),
        lg('de', 'flag-de', 'Allemand', 'German', 'Deutsch'),
        lg('it', 'flag-it', 'Italien', 'Italian', 'Italiano'),
        lg('zh', 'flag-cn', 'Chinois', 'Chinese', '中文'),
        lg('ru', 'flag-ru', 'Russe', 'Russian', 'Русский'),
        lg('tr', 'flag-tr', 'Turc', 'Turkish', 'Türkçe'),
        lg('ja', 'flag-jp', 'Japonais', 'Japanese', '日本語'),
        lg('ko', 'flag-kr', 'Coréen', 'Korean', '한국어')
      ],
      other: other('Autre langue étudiée et ton niveau — ex : néerlandais (intermédiaire)', 'Another language and your level — e.g. Dutch (intermediate)')
    },

    /* ---------------- BLOC 2 ---------------- */
    {
      id: 'q6', block: 1, type: 'multi', layout: 'tiles',
      title: { fr: 'Quelles matières tu aimes vraiment ?', en: 'Which subjects do you genuinely enjoy?' },
      sub: { fr: 'Pas les matières où tu as de bonnes notes — celles que tu aimes. Coche tout ce qui te parle.', en: 'Not the ones you get good grades in — the ones you love. Tick everything that speaks to you.' },
      options: SUBJECTS,
      other: other('Ex : droit, comptabilité, religion, couture…', 'E.g. law, accounting, religious studies, fashion…')
    },
    {
      id: 'q7', block: 1, type: 'multi', layout: 'tiles3', exclusive: 'aucune',
      title: { fr: 'Quelles matières te donnent du fil à retordre ?', en: 'Which subjects give you a hard time?' },
      sub: { fr: 'Sois honnête — c\'est important pour qu\'on t\'oriente là où tu vas réussir.', en: "Be honest — it helps us point you where you'll succeed." },
      options: [
        o('maths', 'numbers', 'Mathématiques', 'Mathematics'),
        o('physique', 'flask', 'Physique-Chimie', 'Physics & Chemistry'),
        o('svt', 'dna', 'SVT / Biologie', 'Biology'),
        o('histoire', 'map', 'Histoire-Géographie', 'History & Geography'),
        o('eco', 'chart-bar', 'Économie', 'Economics'),
        o('litterature', 'pen', 'Littérature', 'Literature'),
        o('langues', 'speaking', 'Langues', 'Languages'),
        o('info', 'laptop', 'Informatique', 'Computer science'),
        o('aucune', 'cool', 'Aucune — tout me va', 'None — I get on with all of them')
      ],
      other: other('Ex : philosophie, comptabilité…', 'E.g. philosophy, accounting…')
    },
    {
      id: 'q8', block: 1, type: 'single', layout: 'rows',
      title: { fr: 'Comment tu te décrirais naturellement ?', en: 'How would you naturally describe yourself?' },
      sub: { fr: 'C\'est ta tendance naturelle — pas ce que tu penses qu\'il faudrait être.', en: "Your natural tendency — not what you think you should be." },
      options: [
        o('creatif', 'palette', 'Plutôt créatif', 'Mostly creative', 'J\'invente, j\'imagine, je crée des choses nouvelles. Les règles fixes m\'ennuient.', 'I invent, imagine and create new things. Fixed rules bore me.'),
        o('analytique', 'magnifier', 'Plutôt analytique', 'Mostly analytical', 'J\'analyse, je structure, je cherche la logique derrière les choses.', 'I analyse, structure and look for the logic behind things.'),
        o('mixte', 'zap', 'Les deux selon le contexte', 'Both, depending on context', 'Je peux être créatif et rigoureux selon ce que la situation demande.', 'I can be creative or rigorous depending on what the situation needs.'),
        o('pratique', 'hammer', 'Avant tout pratique', 'Practical above all', 'Je préfère faire plutôt que théoriser. Je veux des résultats concrets.', 'I prefer doing to theorising. I want concrete results.'),
        o('humain', 'handshake', 'Avant tout humain', 'People-oriented above all', 'J\'aime travailler avec les gens, comprendre les autres, aider et communiquer.', 'I like working with people, understanding others, helping and communicating.')
      ],
      other: other('Décris-toi en quelques mots…', 'Describe yourself in a few words…')
    },
    {
      id: 'q9', block: 1, type: 'single', layout: 'rows',
      title: { fr: 'Tu travailles mieux comment ?', en: 'How do you work best?' },
      sub: { fr: 'Pas comment tu penses qu\'il faut travailler — comment tu travailles vraiment.', en: 'Not how you think you should work — how you actually work.' },
      options: [
        o('seul', 'headphones', 'Seul dans le calme', 'Alone and in quiet', 'Je me concentre mieux sans distraction. Le silence m\'aide à avancer.', 'I focus better without distractions. Silence helps me move forward.'),
        o('groupe', 'group', 'En groupe', 'In a group', 'Les autres me stimulent. J\'apprends mieux quand on débat et partage.', 'Other people motivate me. I learn best when we debate and share.'),
        o('mix', 'mix-work', 'Un mélange selon le moment', 'A mix, depending on the moment', 'Pour apprendre seul, pour réviser en groupe. J\'adapte selon la tâche.', 'Alone to learn, in a group to revise. I adapt to the task.')
      ],
      other: other('Ex : avec de la musique, la nuit, en bibliothèque…', 'E.g. with music, at night, in a library…')
    },
    {
      id: 'q10', block: 1, type: 'single', layout: 'rows',
      title: { fr: 'Tu es plus à l\'aise avec quoi ?', en: 'What are you most comfortable with?' },
      sub: { fr: 'Ce qui vient naturellement, pas ce que tu voudrais être.', en: 'What comes naturally, not what you wish you were.' },
      options: [
        o('chiffres', 'ruler', 'Les chiffres et les formules', 'Numbers and formulas', 'J\'aime quand il y a une bonne réponse précise. Les maths, les stats, les équations me parlent.', 'I like it when there is one precise right answer. Maths, stats and equations speak to me.'),
        o('mots', 'writing', 'Les mots et les idées', 'Words and ideas', 'J\'aime argumenter, écrire, convaincre, raconter. Le langage est mon outil.', 'I like arguing, writing, persuading and storytelling. Language is my tool.'),
        o('varie', 'glow-star', 'Les deux — j\'aime varier', 'Both — I like variety', 'Je ne me sens pas limité à un seul registre.', "I don't feel limited to one mode."),
        o('concret', 'tools', 'Le concret et le visuel', 'Hands-on and visual', 'Je comprends mieux avec des schémas, des exemples, des prototypes. Moins de théorie, plus de réel.', 'I understand better with diagrams, examples and prototypes. Less theory, more reality.')
      ],
      other: other('Ex : les gens, les machines, la nature…', 'E.g. people, machines, nature…')
    },

    /* ---------------- BLOC 3 ---------------- */
    {
      id: 'q12', block: 2, type: 'single', layout: 'rows',
      title: { fr: 'Quel est ton objectif principal dans la vie professionnelle ?', en: 'What is your main goal in your working life?' },
      sub: { fr: 'Il n\'y a pas de bonne ou mauvaise réponse — tout le monde n\'a pas les mêmes envies.', en: "There's no right or wrong answer — everyone wants different things." },
      options: [
        o('entreprise', 'rocket', 'Créer ma propre entreprise', 'Start my own company', 'Je veux construire quelque chose qui m\'appartient. Être mon propre patron.', 'I want to build something of my own. Be my own boss.'),
        o('grande-entreprise', 'office', 'Évoluer dans une grande entreprise', 'Grow within a large company', 'Travailler dans un environnement structuré, progresser dans une organisation.', 'Work in a structured environment and progress within an organisation.'),
        o('public', 'institution', 'Fonction publique ou gouvernement', 'Public service or government', 'Servir mon pays, travailler dans l\'administration ou les institutions.', 'Serve my country, work in administration or public institutions.'),
        o('recherche', 'microscope', 'Recherche et enseignement', 'Research and teaching', 'Produire du savoir, enseigner, faire avancer la connaissance.', 'Produce knowledge, teach, push understanding forward.'),
        o('ong', 'earth-africa', 'ONG, humanitaire, impact social', 'NGOs, humanitarian work, social impact', 'Aider les autres, changer les choses, travailler pour une cause.', 'Help others, change things, work for a cause.'),
        o('freelance', 'laptop', 'Freelance ou indépendant', 'Freelance or self-employed', 'Travailler librement pour plusieurs clients, depuis n\'importe où.', 'Work freely for several clients, from anywhere.'),
        o('ne-sais-pas', 'shrug', 'Je ne sais pas encore', "I don't know yet", 'Je cherche encore — et c\'est exactement pour ça que je suis là.', "I'm still searching — and that's exactly why I'm here.")
      ],
      other: other('Ton objectif en quelques mots…', 'Your goal in a few words…')
    },
    {
      id: 'q13', block: 2, type: 'multi', layout: 'tiles', max: 2,
      title: { fr: 'Où tu veux vivre et travailler plus tard ?', en: 'Where do you want to live and work later on?' },
      sub: { fr: 'Tes études doivent te préparer pour là où tu veux être — pas seulement là où tu es.', en: 'Your studies should prepare you for where you want to be — not just where you are.' },
      options: [
        o('pays', 'house-garden', 'Dans mon pays actuel', 'In my current country', 'Construire ma vie ici, contribuer à mon pays.', 'Build my life here and contribute to my country.'),
        o('afrique', 'earth-africa', 'Ailleurs en Afrique', 'Elsewhere in Africa', 'Un autre pays africain avec plus d\'opportunités.', 'Another African country with more opportunities.'),
        o('europe', 'flag-eu', 'En Europe', 'In Europe', 'France, Belgique, Allemagne, Espagne, Suisse...', 'France, Belgium, Germany, Spain, Switzerland...'),
        o('canada', 'flag-ca', 'Au Canada', 'In Canada', 'Montréal, Toronto, Vancouver…', 'Montreal, Toronto, Vancouver…'),
        o('usa', 'flag-us', 'Aux États-Unis', 'In the United States', 'Silicon Valley, New York, universités top mondiales.', 'Silicon Valley, New York, world-top universities.'),
        o('asie', 'earth-asia', 'En Asie ou au Moyen-Orient', 'In Asia or the Middle East', 'Chine, Japon, Corée, Turquie, Émirats…', 'China, Japan, Korea, Turkey, UAE…'),
        o('monde', 'airplane', 'Partout dans le monde', 'Anywhere in the world', 'Une vie internationale, sans frontières.', 'An international life, without borders.')
      ],
      other: other('Un pays ou une ville précise…', 'A specific country or city…')
    },
    {
      id: 'q14', block: 2, type: 'multi', layout: 'tiles', max: 2,
      title: { fr: 'Dans ta vie, qu\'est-ce qui compte le plus pour toi ?', en: 'In your life, what matters most to you?' },
      sub: { fr: 'Choisis tes deux priorités principales — celles qui guident vraiment tes choix.', en: 'Pick your two main priorities — the ones that really guide your choices.' },
      options: [
        o('argent', 'money-bag', 'L\'argent et la stabilité', 'Money and stability', 'Vivre sans soucis financiers, avoir la sécurité', 'Living without money worries, feeling secure'),
        o('impact', 'heart', 'L\'impact et aider les autres', 'Impact and helping others', 'Laisser quelque chose de positif dans le monde', 'Leaving something positive in the world'),
        o('reconnaissance', 'trophy', 'La reconnaissance', 'Recognition', 'Être connu, respecté, admiré pour ce que je fais', 'Being known, respected and admired for what I do'),
        o('liberte', 'dove', 'La liberté', 'Freedom', 'Faire ce que je veux, quand je veux, depuis où je veux', 'Doing what I want, when I want, from where I want'),
        o('famille', 'family', 'La famille', 'Family', 'Être là pour ma famille, leur offrir une bonne vie', 'Being there for my family and giving them a good life'),
        o('connaissance', 'brain', 'La connaissance', 'Knowledge', 'Apprendre sans arrêt, maîtriser mon domaine', 'Learning constantly, mastering my field')
      ],
      other: other('Ce qui compte pour toi…', 'What matters to you…')
    },
    {
      id: 'q15', block: 2, type: 'multi', layout: 'tiles',
      title: { fr: 'Tu as déjà une idée de secteur qui t\'attire ?', en: 'Do you already have a sector that attracts you?' },
      sub: { fr: 'Coche tout ce qui t\'attire — même si c\'est plusieurs choses très différentes.', en: 'Tick everything that attracts you — even if they are very different.' },
      options: [
        o('business', 'briefcase', 'Business et Commerce', 'Business and Trade', 'Vendre, négocier, gérer, entreprendre', 'Selling, negotiating, managing, entrepreneurship'),
        o('sante', 'stethoscope', 'Santé et Médecine', 'Health and Medicine', 'Soigner, prévenir, guérir', 'Caring, preventing, healing'),
        o('tech', 'robot', 'Tech et Informatique', 'Tech and Computing', 'Code, IA, cybersécurité, données', 'Code, AI, cybersecurity, data'),
        o('droit', 'scales', 'Droit et Justice', 'Law and Justice', 'Lois, défense, notariat, magistrature', 'Law, defence, notary work, the judiciary'),
        o('art', 'palette', 'Art et Création', 'Art and Design', 'Design, mode, cinéma, musique, architecture', 'Design, fashion, film, music, architecture'),
        o('sciences', 'flask', 'Sciences et Recherche', 'Science and Research', 'Physique, chimie, biologie, mathématiques', 'Physics, chemistry, biology, mathematics'),
        o('education', 'teacher', 'Éducation et Formation', 'Education and Training', 'Enseigner, former, transmettre', 'Teaching, training, passing on knowledge'),
        o('comm', 'megaphone', 'Communication et Médias', 'Communication and Media', 'Journalisme, publicité, réseaux sociaux', 'Journalism, advertising, social media'),
        o('ingenierie', 'gear', 'Ingénierie', 'Engineering', 'Construire, concevoir, optimiser des systèmes', 'Building, designing, optimising systems'),
        o('agri', 'rice', 'Agriculture et Environnement', 'Agriculture and Environment', 'Alimentation, écologie, développement durable', 'Food, ecology, sustainable development')
      ],
      other: other('Ex : sport, aviation, mode, tourisme…', 'E.g. sport, aviation, fashion, tourism…')
    },

    /* ---------------- BLOC 4 ---------------- */
    {
      id: 'q16', block: 3, type: 'multi', layout: 'tiles',
      title: { fr: 'Qui finance tes études ?', en: 'Who pays for your studies?' },
      sub: { fr: 'Coche tout ce qui t\'aide — on peut avoir plusieurs sources à la fois. LERNA t\'orientera vers ce qui est réellement accessible pour toi.', en: "Tick everything that helps — you can have several sources at once. LERNA will point you to what's really within reach." },
      options: [
        o('parents', 'family', 'Mes parents', 'My parents', 'Ils paient tout ou une partie', 'They pay for all or part of it'),
        o('famille', 'elders', 'Famille élargie ou tuteur', 'Wider family or guardian', 'Oncle, tante, grand frère, tuteur…', 'Uncle, aunt, older sibling, guardian…'),
        o('bourse', 'medal', 'Une bourse', 'A scholarship', 'J\'en ai une ou j\'en cherche une', 'I have one or am looking for one'),
        o('moi', 'muscle', 'Moi-même', 'Myself', 'Je travaille ou je vais travailler', 'I work or will work'),
        o('pret', 'bank', 'Un prêt étudiant', 'A student loan', 'Banque ou organisme de prêt', 'Bank or loan provider'),
        o('cherche', 'search', 'Je cherche encore', "I'm still looking", 'C\'est un de mes blocages actuels', "It's one of my current roadblocks")
      ],
      other: other('Ex : une entreprise, une association, ma communauté…', 'E.g. a company, a charity, my community…')
    },
    {
      id: 'q17', block: 3, type: 'single', layout: 'rows',
      title: { fr: 'Quel est ton budget annuel pour les frais de scolarité ?', en: 'What is your yearly budget for tuition fees?' },
      sub: { fr: 'Honnêteté totale ici — c\'est la variable la plus importante pour ton orientation.', en: 'Total honesty here — this is the most important variable for your orientation.' },
      options: [
        o('gratuit', 'gift', 'Gratuit ou quasi-gratuit', 'Free or almost free', 'Universités publiques, bourses complètes — moins de 300$ / an maximum', 'Public universities, full scholarships — under $300 a year'),
        o('faible', 'dollar', 'Budget faible', 'Low budget', 'Entre 300$ et 1 500$ par an', 'Between $300 and $1,500 a year'),
        o('moyen', 'money-bag', 'Budget moyen', 'Medium budget', 'Entre 1 500$ et 5 000$ par an', 'Between $1,500 and $5,000 a year'),
        o('confortable', 'gem', 'Budget confortable', 'Comfortable budget', 'Entre 5 000$ et 15 000$ par an', 'Between $5,000 and $15,000 a year'),
        o('premium', 'crown', 'Budget premium', 'Premium budget', 'Plus de 15 000$ par an — les meilleures écoles mondiales sont accessibles', "Over $15,000 a year — the world's top schools are within reach")
      ]
    },
    {
      id: 'q18', block: 3, type: 'single', layout: 'rows',
      title: { fr: 'Tu peux quitter ton pays pour étudier ?', en: 'Can you leave your country to study?' },
      sub: { fr: 'Ça ouvre ou réduit le champ des possibles — on veut te recommander ce qui est vraiment faisable.', en: 'It widens or narrows your options — we want to recommend what is truly doable.' },
      options: [
        o('facile', 'airplane', 'Oui, facilement', 'Yes, easily', 'Ma famille soutient ce choix et les démarches de visa me semblent accessibles.', 'My family supports it and the visa process feels manageable.'),
        o('raison', 'thinking', 'Oui, si j\'ai une bonne raison', 'Yes, if there is a good reason', 'Possible, mais il faudrait que l\'offre soit vraiment meilleure qu\'ici.', 'Possible, but the offer would need to be clearly better than at home.'),
        o('difficile', 'worried', 'Difficilement', 'With difficulty', 'Contraintes familiales, financières ou administratives importantes.', 'Significant family, financial or administrative constraints.'),
        o('non', 'house-garden', 'Non, je reste dans mon pays', "No, I'm staying in my country", 'J\'oriente ma recherche sur les meilleures options locales.', "I'm focusing on the best local options.")
      ],
      other: other('Ta situation en quelques mots…', 'Your situation in a few words…')
    },
    {
      id: 'q19', block: 3, type: 'single', layout: 'rows',
      title: { fr: 'Tu as besoin de travailler pendant tes études ?', en: 'Do you need to work while you study?' },
      sub: { fr: 'Certaines formations sont compatibles avec un job, d\'autres non. On a besoin de savoir.', en: "Some programmes fit with a job, others don't. We need to know." },
      options: [
        o('oblig', 'briefcase', 'Oui, obligatoirement', 'Yes, I have to', 'Je dois travailler pour financer ma vie ou mes études. C\'est non négociable.', 'I must work to pay for my life or studies. It is non-negotiable.'),
        o('alternance', 'handshake', 'Oui — en alternance de préférence', 'Yes — ideally a work-study programme', 'Travailler ET étudier en même temps, idéalement payé par une entreprise.', 'Working AND studying at the same time, ideally paid by a company.'),
        o('peut-etre', 'coin', 'Peut-être, pour avoir un peu d\'argent', 'Maybe, for some extra money', 'Ce n\'est pas obligatoire mais j\'aimerais avoir mon propre revenu.', "It's not essential but I'd like my own income."),
        o('non', 'books', 'Non, je me concentre sur mes études', "No, I'll focus on my studies", 'Je peux me consacrer entièrement à ma formation.', 'I can dedicate myself fully to my studies.')
      ],
      other: other('Ex : je travaille déjà le week-end…', 'E.g. I already work at weekends…')
    },
    {
      id: 'q20', block: 3, type: 'single', layout: 'rows',
      title: { fr: 'Tu veux une formation de quelle durée ?', en: 'How long a programme do you want?' },
      sub: { fr: 'Être médecin prend 9 ans. Être développeur web certifié prend 1 an. Tout dépend de ton projet.', en: 'Becoming a doctor takes 9 years. Becoming a certified web developer takes 1 year. It all depends on your plan.' },
      options: [
        o('courte', 'zap', 'Courte — 1 à 2 ans', 'Short — 1 to 2 years', 'BTS, DUT, formations certifiantes. Je veux entrer rapidement sur le marché du travail.', 'Diplomas, certificates, vocational programmes. I want to start working quickly.'),
        o('moyenne', 'book-green', 'Moyenne — 3 ans', 'Medium — 3 years', 'Licence, Bachelor. Un diplôme solide sans s\'engager trop longtemps.', "Bachelor's degree. A solid qualification without committing too long."),
        o('longue', 'cap', 'Longue — 4 à 5 ans', 'Long — 4 to 5 years', 'Master, grandes écoles. Je vise haut et j\'accepte d\'investir du temps.', "Master's, top schools. I'm aiming high and happy to invest the time."),
        o('tres-longue', 'trophy', 'Très longue — 6 ans et plus', 'Very long — 6 years or more', 'Médecine, droit approfondi, doctorat. Je suis prêt pour le long terme.', "Medicine, advanced law, PhD. I'm ready for the long haul."),
        o('ne-sais-pas', 'shrug', 'Je ne sais pas encore', "I don't know yet", 'LERNA m\'aidera à trouver la durée adaptée à mon projet.', 'LERNA will help me find the right length for my plan.')
      ]
    },

    /* ---------------- BLOC 5 ---------------- */
    {
      id: 'q21', block: 4, type: 'single', layout: 'rows',
      title: { fr: 'Tu préfères comment apprendre ?', en: 'How do you prefer to learn?' },
      sub: { fr: 'Le format de la formation compte autant que le contenu.', en: 'The format of a programme matters as much as its content.' },
      options: [
        o('presentiel', 'school', 'En présentiel dans un campus', 'In person on a campus', 'J\'ai besoin de la vie de campus, des interactions en face à face, d\'un cadre physique.', 'I need campus life, face-to-face interaction and a physical setting.'),
        o('en-ligne', 'laptop', 'En ligne depuis chez moi', 'Online from home', 'Je suis autonome et je préfère étudier à mon rythme sans contrainte géographique.', "I'm independent and prefer studying at my own pace, wherever I am."),
        o('hybride', 'hybrid', 'Un mix des deux — formation hybride', 'A mix of both — hybrid', 'Quelques jours en présentiel, le reste en ligne. Le meilleur des deux mondes.', 'A few days in person, the rest online. The best of both worlds.')
      ],
      other: other('Ex : cours du soir, week-end…', 'E.g. evening classes, weekends…')
    },
    {
      id: 'q22', block: 4, type: 'single', layout: 'rows',
      title: { fr: 'Tu veux une formation plutôt théorique ou pratique ?', en: 'Do you want a more theoretical or practical programme?' },
      sub: { fr: 'Aucun choix n\'est meilleur — tout dépend de comment tu apprends le mieux.', en: 'Neither is better — it depends on how you learn best.' },
      options: [
        o('theorique', 'books', 'Très théorique', 'Very theoretical', 'Beaucoup de cours, de lectures, de recherches. J\'aime comprendre les fondements profonds.', 'Lots of lectures, reading and research. I like understanding the deep foundations.'),
        o('pratique', 'tools', 'Avant tout pratique', 'Practical above all', 'Projets concrets, stages, ateliers, expérimentations. Je veux apprendre en faisant.', 'Real projects, internships, workshops, experiments. I want to learn by doing.'),
        o('equilibre', 'scales', 'Un bon équilibre entre les deux', 'A good balance of both', 'De la théorie pour comprendre, de la pratique pour appliquer. Les deux sont importants.', 'Theory to understand, practice to apply. Both matter.')
      ],
      other: other('Précise ce que tu veux…', 'Tell us what you want…')
    },
    {
      id: 'q23', block: 4, type: 'single', layout: 'rows',
      title: { fr: 'Ton diplôme, il doit être reconnu où ?', en: 'Where does your degree need to be recognised?' },
      sub: { fr: 'Un diplôme local peut suffire pour certains projets, et être insuffisant pour d\'autres.', en: 'A local degree can be enough for some plans and not enough for others.' },
      options: [
        o('monde', 'globe-net', 'Dans le monde entier', 'Worldwide', 'Je veux pouvoir travailler partout. Mon diplôme doit ouvrir des portes à l\'international.', 'I want to be able to work anywhere. My degree must open doors internationally.'),
        o('region', 'map', 'Dans ma région (ex : Afrique de l\'Ouest)', 'In my region (e.g. West Africa)', 'Je veux travailler dans plusieurs pays de ma région. Un diplôme régionalement reconnu suffit.', 'I want to work in several countries in my region. A regionally recognised degree is enough.'),
        o('pays', 'house-garden', 'Dans mon pays suffit', 'My country is enough', 'Je construis ma carrière ici. La reconnaissance locale prime.', "I'm building my career here. Local recognition comes first."),
        o('ne-sais-pas', 'shrug', 'Je ne sais pas encore', "I don't know yet")
      ],
      other: other('Un pays ou un organisme précis (ex : ordre des médecins)…', 'A specific country or body (e.g. medical council)…')
    },
    {
      id: 'q24', block: 4, type: 'single', layout: 'rows',
      title: { fr: 'Comment tu organises ton travail en général ?', en: 'How do you usually organise your work?' },
      sub: { fr: 'Certaines formations récompensent la régularité. D\'autres testent sous pression. Laquelle te correspond ?', en: 'Some programmes reward consistency. Others test you under pressure. Which suits you?' },
      options: [
        o('regulier', 'calendar-spiral', 'Régulièrement tout au long de l\'année', 'Steadily throughout the year', 'Petit à petit, chaque jour. Je n\'attends pas la dernière minute.', "Little by little, every day. I don't leave things to the last minute."),
        o('intense', 'fire', 'Intensément avant les examens', 'Intensely before exams', 'Je me mets en mode sprint quand la pression arrive. Ça me motive.', 'I go into sprint mode when the pressure is on. It motivates me.'),
        o('projets', 'target', 'Par projets avec des deadlines', 'In projects with deadlines', 'Quand j\'ai un objectif clair et une date limite, je suis efficace.', "When I have a clear goal and a deadline, I'm effective."),
        o('cherche', 'magnifier', 'Je cherche encore mon rythme', "I'm still finding my rhythm", 'Je n\'ai pas encore trouvé ce qui fonctionne vraiment pour moi.', "I haven't found what really works for me yet.")
      ],
      other: other('Ta façon de t\'organiser…', 'How you organise yourself…')
    },
    {
      id: 'q25', block: 4, type: 'single', layout: 'rows',
      title: { fr: 'La vie de campus, c\'est important pour toi ?', en: 'Is campus life important to you?' },
      sub: { fr: 'Associations, sport, événements, vie sociale — certains en ont besoin, d\'autres viennent juste pour apprendre.', en: 'Clubs, sport, events, social life — some people need it, others just come to learn.' },
      options: [
        o('tres', 'party', 'Très important', 'Very important', 'La vie étudiante fait partie de mes études. Je veux un campus vivant, des associations, des événements.', 'Student life is part of my studies. I want a lively campus, clubs and events.'),
        o('assez', 'smile', 'Assez important', 'Fairly important', 'J\'aime avoir cette option même si ce n\'est pas ma priorité principale.', "I like having the option even if it's not my main priority."),
        o('peu', 'book-open', 'Peu important', 'Not very important', 'Je viens pour apprendre. La qualité académique prime sur tout le reste.', 'I come to learn. Academic quality comes before everything else.'),
        o('pas', 'house', 'Pas du tout important', 'Not important at all', 'J\'étudie en ligne ou je gère ma vie sociale en dehors de l\'école.', 'I study online or handle my social life outside school.')
      ]
    },

    /* ---------------- POUR FINIR (question ouverte) ---------------- */
    {
      id: 'q11', block: 5, type: 'text', img: 'telescope', last: true,
      title: { fr: 'Dans 10 ans, tu te vois faire quoi ?', en: 'In 10 years, what do you see yourself doing?' },
      sub: { fr: 'Décris ce que tu imagines. Pas besoin d\'être précis — juste ce qui te vient à l\'esprit. C\'est facultatif.', en: "Describe what you imagine. No need to be precise — just what comes to mind. It's optional." },
      placeholder: {
        fr: 'Ex : Je veux diriger ma propre entreprise dans la tech. Je veux soigner des gens. Je veux travailler en communication pour une grande marque internationale...',
        en: 'E.g. I want to run my own tech company. I want to care for people. I want to work in communications for a big international brand...'
      },
      note: {
        img: 'speech',
        label: { fr: 'Autre chose que LERNA devrait savoir ?', en: 'Anything else LERNA should know?' },
        placeholder: { fr: 'Une contrainte, un rêve, une école que tu vises déjà…', en: 'A constraint, a dream, a school you already have in mind…' }
      }
    }
  ];

  /* Questions de la mise à jour mensuelle du profil (5 questions, 1 minute) */
  window.LERNA_UPDATE_SET = ['q2', 'q5', 'q13', 'q16', 'q17'];

  window.LERNA_QUESTION = function (id) {
    return window.LERNA_QUESTIONS.filter(function (q) { return q.id === id; })[0] || null;
  };

  /* Libellés des questions pour le prompt IA (document maître §14.4) */
  window.LERNA_PROMPT_LABELS = {
    q1: 'Âge', q2: 'Niveau scolaire actuel', q3: 'Bac ou diplôme équivalent', q4: 'Pays actuel', q5: 'Langues parlées (avec niveau)',
    q6: 'Matières aimées', q7: 'Matières difficiles', q8: 'Type de profil personnel', q9: 'Style de travail', q10: "À l'aise avec quoi",
    q12: 'Objectif professionnel principal', q13: 'Lieu de vie souhaité (2 choix max)', q14: 'Priorités de vie',
    q15: "Secteurs d'intérêt", q16: 'Sources de financement (plusieurs possibles)', q17: 'Budget annuel scolarité', q18: 'Mobilité internationale',
    q19: 'Besoin de travailler pendant les études', q20: 'Durée de formation souhaitée', q21: "Mode d'apprentissage préféré",
    q22: 'Théorique ou pratique', q23: 'Reconnaissance du diplôme souhaitée', q24: 'Organisation du travail', q25: 'Importance de la vie de campus',
    q11: 'Vision à 10 ans (texte libre)', note: 'Autre chose à savoir (texte libre)'
  };

  /* Réponse lisible d'une question (inclut « Autre » et les niveaux de langue).
     withDesc : ajoute la description de l'option (utile pour l'IA). */
  window.LERNA_ANSWER_TEXT = function (q, answers, lang, withDesc) {
    lang = lang || 'fr';
    var v = answers[q.id];
    var Lx = function (x) { return x ? (x[lang] || x.fr) : ''; };
    if (q.type === 'country') return v ? window.LERNA_COUNTRY_NAME(v, lang) : '';
    if (q.type === 'text') return v ? String(v) : '';
    var ids = Array.isArray(v) ? v : (v ? [v] : []);
    var lvls = q.levels ? (answers[q.id + '_lvl'] || {}) : null;
    var parts = ids.map(function (id) {
      if (id === 'autre') {
        var txt = String(answers[q.id + '_autre'] || '').trim();
        return (lang === 'en' ? 'Other' : 'Autre') + (txt ? ' : ' + txt : '');
      }
      var opt = q.options.filter(function (x) { return x.id === id; })[0];
      if (!opt) return id;
      var s = Lx(opt.label);
      if (lvls && lvls[id] && window.LERNA_LANG_LEVELS[lvls[id]]) s += ' (' + Lx(window.LERNA_LANG_LEVELS[lvls[id]].label).toLowerCase() + ')';
      else if (withDesc && opt.desc) s += ' (' + Lx(opt.desc) + ')';
      return s;
    });
    return parts.join(', ');
  };

  /* Pays : codes ISO, noms localisés via Intl.DisplayNames. Ordre du document maître, puis alphabétique. */
  var PRIORITY = ['SN', 'CI', 'CM', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE', 'GA', 'CG', 'CD', 'MG', 'MA', 'DZ', 'TN', 'EG', 'NG', 'GH', 'ZA', 'KE', 'ET'];
  var ALL = ('AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW GP MQ GF RE YT NC PF').split(' ');
  var FALLBACK = { SN: 'Sénégal', CI: "Côte d'Ivoire", CM: 'Cameroun', FR: 'France', CA: 'Canada', US: 'États-Unis', MA: 'Maroc', BE: 'Belgique' };
  window.LERNA_COUNTRY_NAME = function (code, lang) {
    if (!code) return '';
    try {
      var dn = new Intl.DisplayNames([lang || (window.Lerna && Lerna.lang) || 'fr'], { type: 'region' });
      return dn.of(code) || code;
    } catch (e) { return FALLBACK[code] || code; }
  };
  /* Drapeaux de la région de la personne d'abord : Europe en premier depuis la France,
     Afrique de l'Ouest en premier depuis le Sénégal, etc. (pays deviné par l'adresse internet ou le fuseau horaire) */
  var REGIONS = {
    ouest: ['SN', 'CI', 'ML', 'BF', 'GN', 'TG', 'BJ', 'NE', 'MR', 'GM', 'GW', 'CV', 'GH', 'NG', 'LR', 'SL'],
    centre: ['CM', 'GA', 'CG', 'CD', 'TD', 'CF', 'GQ', 'ST'],
    nord: ['MA', 'DZ', 'TN', 'EG', 'LY'],
    est: ['KE', 'ET', 'RW', 'BI', 'UG', 'TZ', 'DJ', 'SO', 'SD', 'SS', 'ER'],
    sud: ['ZA', 'MG', 'MU', 'KM', 'SC', 'MZ', 'AO', 'ZM', 'ZW', 'NA', 'BW', 'MW', 'LS', 'SZ', 'RE', 'YT'],
    europe: ['FR', 'BE', 'CH', 'LU', 'DE', 'ES', 'IT', 'PT', 'NL', 'GB', 'IE', 'AT', 'SE', 'NO', 'DK', 'FI', 'PL', 'GR', 'RO', 'MC', 'GP', 'MQ', 'GF'],
    amerique: ['CA', 'US', 'HT', 'MX', 'BR'],
    asie: ['AE', 'SA', 'QA', 'TR', 'LB', 'JO', 'KW', 'CN', 'JP', 'KR', 'IN', 'SG', 'MY']
  };
  /* Ordre des régions selon la région de départ */
  var NEXT = {
    ouest: ['ouest', 'centre', 'nord', 'europe', 'amerique', 'est', 'sud', 'asie'],
    centre: ['centre', 'ouest', 'nord', 'europe', 'amerique', 'est', 'sud', 'asie'],
    nord: ['nord', 'ouest', 'centre', 'europe', 'asie', 'amerique', 'est', 'sud'],
    est: ['est', 'sud', 'centre', 'ouest', 'nord', 'europe', 'asie', 'amerique'],
    sud: ['sud', 'est', 'centre', 'ouest', 'nord', 'europe', 'amerique', 'asie'],
    europe: ['europe', 'nord', 'ouest', 'centre', 'amerique', 'est', 'sud', 'asie'],
    amerique: ['amerique', 'europe', 'ouest', 'centre', 'nord', 'asie', 'est', 'sud'],
    asie: ['asie', 'nord', 'europe', 'ouest', 'centre', 'est', 'sud', 'amerique']
  };
  window.LERNA_REGION = function (code) {
    for (var k in REGIONS) if (REGIONS[k].indexOf(code) !== -1) return k;
    var c = window.LERNA_CONTINENT ? window.LERNA_CONTINENT(code) : '';
    return c === 'europe' ? 'europe' : c === 'amerique-nord' ? 'amerique' : c === 'asie' ? 'asie' : c === 'afrique' ? 'ouest' : '';
  };
  window.LERNA_PRIORITY_FOR = function (around) {
    var r = window.LERNA_REGION(around);
    if (!r) return PRIORITY.slice();
    var out = around && ALL.indexOf(around) !== -1 ? [around] : [];
    NEXT[r].forEach(function (k) { REGIONS[k].forEach(function (c) { if (out.indexOf(c) === -1) out.push(c); }); });
    return out;
  };
  window.LERNA_COUNTRIES = function (lang, around) {
    var name = function (c) { return window.LERNA_COUNTRY_NAME(c, lang); };
    if (around === undefined) around = window.Lerna && Lerna.geoCountry ? Lerna.geoCountry() : window.LERNA_GUESS_COUNTRY();
    var pr = window.LERNA_PRIORITY_FOR(around);
    var rest = ALL.filter(function (c) { return pr.indexOf(c) === -1; })
      .map(function (c) { return { code: c, name: name(c) }; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, lang || 'fr'); });
    return {
      priority: pr.map(function (c) { return { code: c, name: name(c) }; }),
      rest: rest
    };
  };
  window.LERNA_COUNTRY_OPTIONS = function (lang, selected) {
    var c = window.LERNA_COUNTRIES(lang), h = '';
    var opt = function (x) { return '<option value="' + x.code + '"' + (x.code === selected ? ' selected' : '') + '>' + x.name + '</option>'; };
    h += '<optgroup label="—">' + c.priority.map(opt).join('') + '</optgroup>';
    h += '<optgroup label="A–Z">' + c.rest.map(opt).join('') + '</optgroup>';
    return h;
  };
  /* Continent d'un pays (pour le matching) */
  var AF = 'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW RE YT'.split(' ');
  var EU = 'AL AD AT BY BE BA BG HR CY CZ DK EE FI FR DE GR HU IS IE IT LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA GP MQ GF'.split(' ');
  var NA = 'CA US MX'.split(' ');
  var AS = 'AE SA QA KW BH OM JO LB IL TR IR IQ IN PK BD LK NP CN HK MO TW JP KR KP MN SG MY ID TH VN PH KH LA MM BN TL KZ UZ KG TJ TM AF AZ AM GE YE SY PS MV BT'.split(' ');
  window.LERNA_CONTINENT = function (code) {
    if (AF.indexOf(code) !== -1) return 'afrique';
    if (EU.indexOf(code) !== -1) return 'europe';
    if (NA.indexOf(code) !== -1) return 'amerique-nord';
    if (AS.indexOf(code) !== -1) return 'asie';
    return 'autre';
  };
  /* Image du drapeau d'un pays (assets/flags) */
  window.LERNA_FLAG = function (code) { return /^[A-Z]{2}$/.test(code || '') ? 'assets/flags/' + code + '.webp' : ''; };
  /* Pays probable d'après le fuseau horaire de l'appareil (simple suggestion, jamais imposée) */
  var TZ = {
    'Africa/Dakar': 'SN', 'Africa/Abidjan': 'CI', 'Africa/Douala': 'CM', 'Africa/Bamako': 'ML', 'Africa/Ouagadougou': 'BF',
    'Africa/Conakry': 'GN', 'Africa/Lome': 'TG', 'Africa/Porto-Novo': 'BJ', 'Africa/Niamey': 'NE', 'Africa/Libreville': 'GA',
    'Africa/Brazzaville': 'CG', 'Africa/Kinshasa': 'CD', 'Africa/Lubumbashi': 'CD', 'Indian/Antananarivo': 'MG', 'Africa/Casablanca': 'MA',
    'Africa/Algiers': 'DZ', 'Africa/Tunis': 'TN', 'Africa/Cairo': 'EG', 'Africa/Lagos': 'NG', 'Africa/Accra': 'GH',
    'Africa/Johannesburg': 'ZA', 'Africa/Nairobi': 'KE', 'Africa/Addis_Ababa': 'ET', 'Africa/Nouakchott': 'MR', 'Africa/Banjul': 'GM',
    'Africa/Bissau': 'GW', 'Africa/Ndjamena': 'TD', 'Africa/Bangui': 'CF', 'Africa/Kigali': 'RW', 'Africa/Bujumbura': 'BI',
    'Atlantic/Cape_Verde': 'CV', 'Indian/Comoro': 'KM', 'Africa/Djibouti': 'DJ', 'Indian/Mauritius': 'MU', 'Indian/Reunion': 'RE',
    'Europe/Paris': 'FR', 'Europe/Brussels': 'BE', 'Europe/Zurich': 'CH', 'Europe/Luxembourg': 'LU', 'Europe/London': 'GB',
    'Europe/Berlin': 'DE', 'Europe/Madrid': 'ES', 'Europe/Lisbon': 'PT', 'Europe/Rome': 'IT', 'Europe/Amsterdam': 'NL',
    'America/Toronto': 'CA', 'America/Montreal': 'CA', 'America/Vancouver': 'CA', 'America/New_York': 'US', 'America/Chicago': 'US',
    'America/Los_Angeles': 'US', 'America/Port-au-Prince': 'HT', 'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Europe/Istanbul': 'TR',
    'Asia/Shanghai': 'CN', 'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR'
  };
  window.LERNA_GUESS_COUNTRY = function () {
    try { return TZ[Intl.DateTimeFormat().resolvedOptions().timeZone] || ''; } catch (e) { return ''; }
  };
  /* Sous-région ouest-africaine (reconnaissance régionale CAMES/UEMOA/CEDEAO) */
  window.LERNA_WEST_AFRICA = 'SN CI ML BF GN TG BJ NE GW GM GH NG LR SL CV MR'.split(' ');

  /* ------------------------------------------------------------------ */
  /* Questions adaptées au pays : intitulés du bac, ordre des destinations, */
  /* budget dans la devise de la personne. Les identifiants ne changent    */
  /* jamais (le moteur et l'IA reçoivent toujours les mêmes codes).        */
  /* ------------------------------------------------------------------ */
  var BAC = {
    /* Afrique francophone (séries C/D/S, A/L, G, technique) */
    afr: {
      'bac-s': ['Oui — Bac scientifique (C, D, S1, S2…)', 'Yes — Science bac (C, D, S1, S2…)'],
      'bac-es': ['Oui — Bac G / économie-gestion', 'Yes — G bac / economics & management'],
      'bac-l': ['Oui — Bac littéraire (A, L…)', 'Yes — Literary bac (A, L…)'],
      'bac-tech': ['Oui — Bac technique (E, F, T…)', 'Yes — Technical bac (E, F, T…)'],
      other: ['Bac français, WAEC, IB, Bac arabe…', 'French bac, WAEC, IB, Arabic bac…']
    },
    sn: {
      'bac-s': ['Oui — Bac S (S1, S2, S3…)', 'Yes — S bac (S1, S2, S3…)'],
      'bac-es': ['Oui — Bac G (STEG)', 'Yes — G bac (STEG)'],
      'bac-l': ['Oui — Bac L (L1, L2, L\'1…)', 'Yes — L bac (L1, L2, L\'1…)'],
      'bac-tech': ['Oui — Bac T (T1, T2…)', 'Yes — T bac (T1, T2…)'],
      other: ['Bac français, WAEC, IB, Bac arabe…', 'French bac, WAEC, IB, Arabic bac…']
    },
    /* France : bac général avec spécialités depuis 2021 */
    fr: {
      'bac-s': ['Oui — Bac général, spécialités scientifiques', 'Yes — General bac, science specialities'],
      'bac-es': ['Oui — Bac général, spécialité SES / éco', 'Yes — General bac, economics speciality'],
      'bac-l': ['Oui — Bac général, spécialités littéraires', 'Yes — General bac, humanities specialities'],
      'bac-tech': ['Oui — Bac technologique ou pro (STMG, STI2D…)', 'Yes — Technological or vocational bac (STMG, STI2D…)'],
      other: ['Bac d\'un autre pays, IB, A-Levels…', 'Another country\'s diploma, IB, A-Levels…']
    },
    /* Maghreb */
    nord: {
      'bac-s': ['Oui — Bac sciences (maths, expérimentales…)', 'Yes — Science bac (maths, experimental…)'],
      'bac-es': ['Oui — Bac économie et gestion', 'Yes — Economics & management bac'],
      'bac-l': ['Oui — Bac lettres / sciences humaines', 'Yes — Humanities bac'],
      'bac-tech': ['Oui — Bac technique ou professionnel', 'Yes — Technical or vocational bac'],
      other: ['Bac français, IB, A-Levels…', 'French bac, IB, A-Levels…']
    },
    /* Belgique, Suisse, Luxembourg */
    be: {
      'bac-s': ['Oui — CESS / maturité, orientation sciences', 'Yes — Secondary diploma, science track'],
      'bac-es': ['Oui — CESS / maturité, orientation économie', 'Yes — Secondary diploma, economics track'],
      'bac-l': ['Oui — CESS / maturité, orientation langues ou lettres', 'Yes — Secondary diploma, languages or humanities'],
      'bac-tech': ['Oui — Technique ou professionnel', 'Yes — Technical or vocational'],
      other: ['Bac français, IB, diplôme d\'un autre pays…', 'French bac, IB, another country\'s diploma…']
    },
    /* Pays anglophones (WAEC, A-Levels, High School Diploma) */
    anglo: {
      'bac-s': ['Oui — Diplôme de fin d\'études, filière sciences', 'Yes — School-leaving diploma, science track'],
      'bac-es': ['Oui — Filière commerce / économie', 'Yes — Commercial / economics track'],
      'bac-l': ['Oui — Filière arts / lettres', 'Yes — Arts / humanities track'],
      'bac-tech': ['Oui — Filière technique ou professionnelle', 'Yes — Technical or vocational track'],
      other: ['WASSCE, A-Levels, IB, High School Diploma…', 'WASSCE, A-Levels, IB, High School Diploma…']
    }
  };
  var ANGLO = 'NG GH LR SL GM KE UG TZ RW ZA ZM ZW BW NA MW GB IE US'.split(' ');
  function bacGroup(c) {
    if (!c) return '';
    if (c === 'SN') return 'sn';
    if ('FR GP MQ GF RE YT NC PF MC'.split(' ').indexOf(c) !== -1) return 'fr';
    if ('BE CH LU'.split(' ').indexOf(c) !== -1) return 'be';
    if ('MA DZ TN'.split(' ').indexOf(c) !== -1) return 'nord';
    if (ANGLO.indexOf(c) !== -1) return 'anglo';
    if ('CI ML BF GN TG BJ NE MR CM GA CG CD TD CF GQ MG DJ KM BI'.split(' ').indexOf(c) !== -1) return 'afr';
    return '';
  }
  function keepBase(q) {
    if (q._base) return;
    q._base = { sub: q.sub, options: q.options.map(function (x) { return { id: x.id, label: x.label, desc: x.desc }; }) };
  }
  function restore(q) {
    if (!q._base) return;
    q.sub = q._base.sub;
    q.options = q._base.options.map(function (b) {
      var x = q.options.filter(function (o) { return o.id === b.id; })[0];
      x.label = b.label; x.desc = b.desc; return x;
    });
  }
  /* Arrondi lisible : 2 chiffres significatifs (175 000 FCFA, 1 300 €) */
  function nice(n) {
    if (n < 100) return Math.round(n);
    var p = Math.pow(10, Math.floor(Math.log10(n)) - 1);
    return Math.round(n / p) * p;
  }
  window.LERNA_LOCALIZE_QUESTIONS = function (country) {
    var Q = {};
    window.LERNA_QUESTIONS.forEach(function (q) { Q[q.id] = q; });
    /* Q3 — le bac selon le pays */
    var q3 = Q.q3; keepBase(q3); restore(q3);
    var g = BAC[bacGroup(country)];
    if (g) q3.options.forEach(function (x) {
      if (g[x.id]) x.label = { fr: g[x.id][0], en: g[x.id][1] };
      if (x.id === 'autre-systeme') x.desc = { fr: g.other[0], en: g.other[1] };
    });
    /* Q13 — destinations : la région de la personne d'abord */
    var q13 = Q.q13; keepBase(q13); restore(q13);
    var cont = window.LERNA_CONTINENT(country), order;
    if (cont === 'europe') {
      order = ['pays', 'europe', 'canada', 'usa', 'afrique', 'asie', 'monde'];
      q13.options.forEach(function (x) {
        if (x.id === 'europe') x.label = { fr: 'Ailleurs en Europe', en: 'Elsewhere in Europe' };
        if (x.id === 'afrique') x.label = { fr: 'En Afrique', en: 'In Africa' };
      });
    } else if (cont === 'amerique-nord') {
      order = country === 'US' ? ['pays', 'canada', 'europe', 'afrique', 'asie', 'monde', 'usa'] : ['pays', 'usa', 'europe', 'afrique', 'asie', 'monde', 'canada'];
      if (country === 'CA' || country === 'US') order.pop(); /* « Au Canada » depuis le Canada = « Dans mon pays » */
      q13.options.forEach(function (x) { if (x.id === 'afrique') x.label = { fr: 'En Afrique', en: 'In Africa' }; });
    } else if (cont === 'asie') {
      order = ['pays', 'asie', 'europe', 'canada', 'usa', 'afrique', 'monde'];
      q13.options.forEach(function (x) {
        if (x.id === 'asie') x.label = { fr: 'Ailleurs en Asie ou au Moyen-Orient', en: 'Elsewhere in Asia or the Middle East' };
        if (x.id === 'afrique') x.label = { fr: 'En Afrique', en: 'In Africa' };
      });
    }
    if (order) {
      var byId = {}; q13.options.forEach(function (x) { byId[x.id] = x; });
      q13.options = order.filter(function (id) { return byId[id]; }).map(function (id) { return byId[id]; });
    }
    /* Q17 — budget dans la devise de la personne (les tranches restent définies en dollars) */
    var q17 = Q.q17; keepBase(q17); restore(q17);
    var cur = window.Lerna && Lerna.currency ? Lerna.currency(country) : 'USD';
    if (cur !== 'USD' && window.Lerna && Lerna.money) {
      var fx = Lerna.fx();
      var m = function (usd, lang) {
        var v = nice(usd * fx[cur]);
        var loc = lang === 'en' ? 'en-US' : 'fr-FR';
        return cur === 'XOF' ? v.toLocaleString(loc) + ' FCFA' : (lang === 'en' ? '€' + v.toLocaleString(loc) : v.toLocaleString(loc) + ' €');
      };
      var D = {
        gratuit: function (l) { return l === 'en' ? 'Public universities, full scholarships — under ' + m(300, l) + ' a year' : 'Universités publiques, bourses complètes — moins de ' + m(300, l) + ' / an maximum'; },
        faible: function (l) { return l === 'en' ? 'Between ' + m(300, l) + ' and ' + m(1500, l) + ' a year' : 'Entre ' + m(300, l) + ' et ' + m(1500, l) + ' par an'; },
        moyen: function (l) { return l === 'en' ? 'Between ' + m(1500, l) + ' and ' + m(5000, l) + ' a year' : 'Entre ' + m(1500, l) + ' et ' + m(5000, l) + ' par an'; },
        confortable: function (l) { return l === 'en' ? 'Between ' + m(5000, l) + ' and ' + m(15000, l) + ' a year' : 'Entre ' + m(5000, l) + ' et ' + m(15000, l) + ' par an'; },
        premium: function (l) { return l === 'en' ? 'Over ' + m(15000, l) + " a year — the world's top schools are within reach" : 'Plus de ' + m(15000, l) + ' par an — les meilleures écoles mondiales sont accessibles'; }
      };
      q17.options.forEach(function (x) { if (D[x.id]) x.desc = { fr: D[x.id]('fr'), en: D[x.id]('en') }; });
      var date = Lerna.fmtDate ? fx.date : '';
      q17.sub = {
        fr: q17._base.sub.fr + ' Montants convertis depuis le dollar' + (date ? ' (taux du ' + new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) + ')' : '') + '.',
        en: q17._base.sub.en + ' Amounts converted from US dollars' + (date ? ' (rate of ' + new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ')' : '') + '.'
      };
    }
  };
})();
