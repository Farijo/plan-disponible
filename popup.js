const ruinPlan = [
	[
		chrome.extension.getURL("images/item_bplan_c.gif")
	],
	[
		chrome.extension.getURL("images/item_bplan_u.gif"),
		chrome.extension.getURL("images/item_bbplan_u.gif"),
		chrome.extension.getURL("images/item_hbplan_u.gif"),
		chrome.extension.getURL("images/item_mbplan_u.gif")
	],
	[
		chrome.extension.getURL("images/item_bplan_r.gif"),
		chrome.extension.getURL("images/item_bbplan_r.gif"),
		chrome.extension.getURL("images/item_hbplan_r.gif"),
		chrome.extension.getURL("images/item_mbplan_r.gif")
	],
	[
		chrome.extension.getURL("images/item_bplan_e.gif"),
		chrome.extension.getURL("images/item_bbplan_e.gif"),
		chrome.extension.getURL("images/item_hbplan_e.gif"),
		chrome.extension.getURL("images/item_mbplan_e.gif")
	],
];

let count = null;
let countUnactive = null;

function im(src) {
	let r = '';
	for(s of src) {
		r += `<img src="${s}"/>`;
	}
	return r;
}

function getPlanList(type) {
	const tt = type & 3;
	if(tt === 0) {
		return ruinPlan[0];
	}
	const l = ruinPlan[tt].slice(0);
	l[1] += '" class="bunker';
	l[2] += '" class="hopital';
	l[3] += '" class="hotel';
	let i = 1;
	for(mask of [4, 8, 16]) {
		if(!(type & mask)) {
			l.splice(i, 1);
		} else {
			i++;
		}
	}
	return l;
}

function addCountTo(obj, type) {
	obj.all++;
	obj.b += (type&4)>>2;
	obj.h += (type&8)>>3;
	obj.m += (type&16)>>4;
}

function explore(n, o, depth) {
	let r = '';
	for(b in o.dependencies) {
		const t = o.dependencies[b].type;
		addCountTo(countUnactive[t&3], t);
		r += '<tr style="opacity:.5"><td></td><td><table><td class="iconplan">' + im(getPlanList(t)) +  '</td><td>' + b + '</td>'
		r += explore(b, o.dependencies[b], depth+1);
		r += '</table></td></tr>'
	}
	return r;
}

function getBuilding(str, n, o) {
	if(str.includes(n)) {
		let r = '';
		for(b in o.dependencies) {
			r += getBuilding(str, b, o.dependencies[b])
		}
		return r;
	} else {
		addCountTo(count[o.type&3], o.type)
		return '<tr><td class="iconplan">' + im(getPlanList(o.type)) + '</td><td>' + n + '</td></tr>' + explore(n, o, 1);
	}
}

function getCountDisplay(c) {
	return '<table class="count"><tr style="font-size: 1.4em"><td>' + c[0].all + '</td><td style="text-align:start">' + im([ruinPlan[0][0]]) + '</td><td>' + c[1].all + '</td><td>' + im([ruinPlan[1][0]]) + '</td><td>' + c[2].all + '</td><td>' + im([ruinPlan[2][0]]) + '</td><td>' + c[3].all + '</td><td>' + im([ruinPlan[3][0]]) + '</td></tr><tr class="bunker"><td colspan="2">Bunker</td><td>' + c[1].b + '</td><td>' + im([ruinPlan[1][1]]) + '</td><td>' + c[2].b + '</td><td>' + im([ruinPlan[2][1]]) + '</td><td>' + c[3].b + '</td><td>' + im([ruinPlan[3][1]]) + '</td></tr><tr class="hopital"><td colspan="2">Hôpital</td><td>' + c[1].h + '</td><td>' + im([ruinPlan[1][2]]) + '</td><td>' + c[2].h + '</td><td>' + im([ruinPlan[2][2]]) + '</td><td>' + c[3].h + '</td><td>' + im([ruinPlan[3][2]]) + '</td></tr><tr class="hotel"><td colspan="2">Hotel</td><td>' + c[1].m + '</td><td>' + im([ruinPlan[1][3]]) + '</td><td>' + c[2].m + '</td><td>' + im([ruinPlan[2][3]]) + '</td><td>' + c[3].m + '</td><td>' + im([ruinPlan[3][3]]) + '</td></tr></table>';
}

document.addEventListener('DOMContentLoaded', function() {
	chrome.tabs.executeScript(null, {
		code: `document.body.innerText`,
		allFrames: false,
		runAt: 'document_start',
	}, function(results) {
		const page = results[0];
		
		if(!page.includes('Cette section permet de participer à la construction de nouveaux bâtiments. Commencez par récupérer des ressources dans le désert (bois, métal...), puis apportez des Points d\'Action (PA) au bâtiment qui vous intéresse le plus.')) {
			document.getElementById('content').innerHTML = 'Vous devez aller sur la page chantiers';
			return
		}
		
		count = [{all:0,b:0,m:0,h:0}, {all:0,b:0,m:0,h:0}, {all:0,b:0,m:0,h:0}, {all:0,b:0,m:0,h:0}];
		countUnactive = [{all:0,b:0,m:0,h:0}, {all:0,b:0,m:0,h:0}, {all:0,b:0,m:0,h:0}, {all:0,b:0,m:0,h:0}];
		
		let val = '<table id="det">';
		for(const buil in buildings) {
			val += getBuilding(page, buil, buildings[buil]);
		}
		val += '</table>';
		
		document.getElementById('content').innerHTML = '<p>Informations générales : </p><p><input type="checkbox" id="bunker" checked><label for="bunker">Bunker</label><input type="checkbox" id="hopital" checked><label for="hopital">Hôpital</label><input type="checkbox" id="hotel"checked><label for="hotel">Hotel</label><br><button id="cpy-paste">Formatage forum</button></p><br><p>Chantiers pouvant être découvert : </p>' + getCountDisplay(count) + '<br><p>Chantiers bloqués : </p>' + getCountDisplay(countUnactive) + '<br><p>Détails : </p>' + val;
		
		const b = document.getElementById('bunker');
		const h = document.getElementById('hopital');
		const m = document.getElementById('hotel');
    b.addEventListener('change', hider);
    h.addEventListener('change', hider);
    m.addEventListener('change', hider);
    
    document.getElementById('cpy-paste').addEventListener('click', function() {
      const o = {b: 'Bunker', h: 'Hôpital', m: 'Hôtel'};
      if(!b.checked) delete o.b;
      if(!h.checked) delete o.h;
      if(!m.checked) delete o.m;
      const text = getCpy(count, countUnactive, o);
      navigator.clipboard.writeText(text);
    });
	});
}, false);

function hider(event) {
	const all  = document.getElementsByClassName(event.target.id);
	const prop = event.target.checked ? '' : 'none';
	for (e of all) {
		e.style.display = prop;
	}
}

function getCpy(c, cu, ruins) {
  const o = ['', '', '', ''];
  const p = ['', '', '', ''];
  const names = ['commun', 'inhabituel', 'rare', 'épique'];
  
  for(let i=0; i<4; i++) {
    if(c[i].all === 0 && cu[i].all > 0) {
      p[i] = `\n *//${names[i]}// `;
    }
    const m = c[i].all+cu[i].all;
    if(m > 0) {
      o[i] = `\n *//${m} ${names[i]}// `;
    }
    for(r in ruins) {
      if(c[i][r] === 0 && cu[i][r] > 0) {
        if(!p[i]) {
          p[i] = `\n *//${names[i]}// `;
        }
        p[i] += `\n:hordes_ruine_5: **${ruins[r]}**`;
      }
      const n = c[i][r]+cu[i][r];
      if(n > 0) {
        o[i] += `\n:hordes_ruine_5: **${n} ${ruins[r]}**`;
      }
    }
  }
  
  let notOpen = p.join('');
  if(notOpen) {
    notOpen = '\n\n\n:hordes_fleche: A ne pas ouvrir : ' + notOpen;
  }
  
  let toFound = o.join('');
  if(toFound) {
    toFound = '\n\n\n:hordes_fleche:Restant à trouver :\n' + toFound;
  } else {
    toFound = '\n\n\n:hordes_explo: Tous est découvert félicitation ! :hordes_winbas_2:'
  }
  
	let ret = `:hordes_plan: Etat des plans :hordes_plan:${toFound}${notOpen}`;
  return ret;
}










