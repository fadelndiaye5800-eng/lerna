/* LERNA — « Reconnaissance et accréditation » : comment vérifier qu'une école et SON diplôme sont reconnus.
   Aucune décision n'est inventée : LERNA n'affiche que la marche à suivre et les registres officiels.
   Sources (vérifiées le 2026-10-18) :
   - Sénégal : ANAQ-Sup (habilitations et accréditations publiées sur anaqsup.sn), MESRI ;
     298 établissements privés recensés, 155 sans habilitation (ministre de l'Enseignement supérieur, Le Soleil, 16 juillet 2025).
   - CAMES : reconnaissance des diplômes dans ses pays membres (lecames.org).
   - France : Parcoursup (plateforme nationale), diplômes nationaux et titres RNCP (France compétences). */
(function () {
  var CAMES = ['BJ', 'BF', 'BI', 'CM', 'CF', 'CG', 'CI', 'GA', 'GN', 'GW', 'GQ', 'MG', 'ML', 'NE', 'CD', 'RW', 'SN', 'TD', 'TG'];
  var T = function (fr, en) { return { fr: fr, en: en }; };
  var LINKS = {
    hab: ['https://anaqsup.sn/habilitations/', T('Habilitations ANAQ-Sup', 'ANAQ-Sup institution approvals')],
    acc: ['https://anaqsup.sn/acreditations/', T('Accréditations ANAQ-Sup', 'ANAQ-Sup programme accreditations')],
    cames: ['https://www.lecames.org/diplome_cames/', T('Diplômes reconnus CAMES', 'CAMES-recognised degrees')],
    psup: ['https://www.parcoursup.gouv.fr/', T('Parcoursup', 'Parcoursup')],
    rncp: ['https://www.francecompetences.fr/', T('France compétences (RNCP)', 'France compétences (RNCP)')]
  };
  var TXT = {
    title: T('Reconnaissance et accréditation', 'Recognition and accreditation'),
    why: T('Avant de payer, vérifie que l’école ET le diplôme précis sont reconnus. Une école peut être autorisée à ouvrir sans avoir le droit de délivrer des diplômes reconnus.',
      'Before paying, check that the school AND the specific degree are recognised. A school can be allowed to open without being allowed to award recognised degrees.'),
    snStat: T('Au Sénégal, sur 298 établissements privés recensés, 155 n’avaient aucune habilitation officielle (ministre de l’Enseignement supérieur, juillet 2025).',
      'In Senegal, out of 298 private institutions on record, 155 had no official approval (Minister of Higher Education, July 2025).'),
    sn: [
      T('Demande le numéro d’agrément (provisoire « AP » ou définitif « AD »). Une école seulement agréée ne peut pas délivrer de licence ou de master reconnus.', 'Ask for the operating-licence number (provisional “AP” or final “AD”). A school that only has this licence cannot award recognised bachelor’s or master’s degrees.'),
      T('Cherche le nom exact de l’école dans les habilitations de l’ANAQ-Sup et lis la décision la plus récente (favorable ou défavorable).', 'Search the school’s exact name in the ANAQ-Sup approvals and read the latest decision (favourable or not).'),
      T('Vérifie que TA filière est accréditée (ANAQ-Sup ou CAMES) : l’habilitation protège l’école, l’accréditation protège ton diplôme.', 'Check that YOUR programme is accredited (ANAQ-Sup or CAMES): approval covers the school, accreditation covers your degree.'),
      T('Médecine, pharmacie, dentaire, vétérinaire : une autorisation spéciale du ministère est obligatoire en plus.', 'Medicine, pharmacy, dentistry, veterinary: a special ministry authorisation is also required.'),
      T('En cas de doute, écris à l’ANAQ-Sup (secretariat@anaqsup.sn) et attends une réponse écrite avant de payer.', 'If in doubt, write to ANAQ-Sup (secretariat@anaqsup.sn) and wait for a written answer before paying.')
    ],
    cames: [
      T('Vérifie que l’établissement privé est autorisé par le ministère de l’Enseignement supérieur du pays.', 'Check that the private institution is authorised by the country’s ministry of higher education.'),
      T('Vérifie que ta filière figure dans la liste des diplômes reconnus par le CAMES, ou qu’elle est accréditée par l’agence nationale.', 'Check that your programme appears in the CAMES list of recognised degrees, or is accredited by the national agency.'),
      T('Demande les numéros d’autorisation par écrit et compare-les avec les listes officielles.', 'Ask for the authorisation numbers in writing and compare them with the official lists.')
    ],
    ma: [
      T('Pour une université privée, vérifie qu’elle est « reconnue par l’État » et que ta filière est accréditée par le ministère.', 'For a private university, check that it is “recognised by the State” and that your programme is accredited by the ministry.'),
      T('Demande si le diplôme a l’équivalence d’un diplôme national : c’est ce qui compte pour un concours ou un emploi public.', 'Ask whether the degree is equivalent to a national degree: that is what matters for exams or public-sector jobs.')
    ],
    fr: [
      T('Vérifie que la formation est sur Parcoursup ou sur le site officiel de l’école avec le nom exact du diplôme.', 'Check that the programme is on Parcoursup or on the school’s official site with the exact degree name.'),
      T('Un « bachelor » ou un « MBA » privé n’est pas toujours un diplôme d’État : demande s’il s’agit d’un diplôme national (licence, master), d’un diplôme visé ou d’un titre inscrit au RNCP.', 'A private “bachelor” or “MBA” is not always a State degree: ask whether it is a national degree (licence, master), a State-endorsed degree or an RNCP-registered title.'),
      T('Pour un titre RNCP, retrouve sa fiche officielle sur France compétences (niveau, organisme, date de fin).', 'For an RNCP title, find its official record on France compétences (level, provider, end date).')
    ],
    other: [
      T('Vérifie que l’établissement est reconnu par le ministère de l’Enseignement supérieur du pays (ou l’agence nationale d’accréditation).', 'Check that the institution is recognised by the country’s ministry of higher education (or national accreditation agency).'),
      T('Demande le nom exact du diplôme et vérifie qu’il est reconnu dans le pays où tu veux travailler ensuite.', 'Ask for the exact degree name and check that it is recognised in the country where you want to work afterwards.')
    ],
    pub: T('Établissement public : il est reconnu par l’État de son pays. Vérifie quand même que la filière précise délivre le diplôme que tu vises.', 'Public institution: it is recognised by its country’s State. Still check that the specific programme awards the degree you want.'),
    flags: T('Signaux d’alerte : paiement demandé par mobile money à un particulier, promesse de « diplôme garanti » ou de visa, refus de donner les numéros d’agrément ou d’accréditation, logo d’un organisme sans lien vérifiable.',
      'Warning signs: payment requested by mobile money to a private person, promise of a “guaranteed degree” or visa, refusal to give approval or accreditation numbers, an organisation’s logo with no verifiable link.')
  };
  function L(x) { return (window.Lerna && Lerna.L) ? Lerna.L(x) : x.fr; }
  function esc(s) { return (window.Lerna && Lerna.esc) ? Lerna.esc(s) : String(s); }
  function link(k) { var l = LINKS[k]; return '<a class="btn btn-ghost btn-sm" href="' + l[0] + '" target="_blank" rel="noopener">' + esc(L(l[1])) + ' ↗</a>'; }

  window.LERNA_ACCRED = function (s) {
    var priv = s.type === 'private', pays = s.pays, steps, links, intro = '';
    if (pays === 'SN') { steps = TXT.sn; links = ['hab', 'acc', 'cames']; if (priv) intro = '<p class="small" style="margin-top:6px"><strong>' + esc(L(TXT.snStat)) + '</strong></p>'; }
    else if (pays === 'FR') { steps = TXT.fr; links = ['psup', 'rncp']; }
    else if (pays === 'MA') { steps = TXT.ma; links = []; }
    else if (CAMES.indexOf(pays) !== -1) { steps = TXT.cames; links = ['cames']; }
    else { steps = TXT.other; links = []; }
    var h = '<div class="card accred"><h3>' + esc(L(TXT.title)) + '</h3>';
    h += (s.type === 'public' ? '<p style="margin-top:6px">' + esc(L(TXT.pub)) + '</p>' : '<p style="margin-top:6px">' + esc(L(TXT.why)) + '</p>' + intro);
    h += '<ol class="accred-steps">' + steps.map(function (x) { return '<li>' + esc(L(x)) + '</li>'; }).join('') + '</ol>';
    h += '<p class="small muted" style="margin-top:10px">' + esc(L(TXT.flags)) + '</p>';
    if (links.length) h += '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap">' + links.map(link).join('') + '</div>';
    return h + '</div>';
  };
  window.LERNA_ACCRED_FLAGS = function () { return L(TXT.flags); };
})();
