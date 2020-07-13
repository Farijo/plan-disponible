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
		r += '<img src="'+s+'"/>';
	}
	return r;
}

function getPlanList(type) {
	const l = ruinPlan[type & 3].slice(0);
	let i = 1;
	if(l[i++] && !(type & 4)) {
		l.splice(--i, 1);
	}
	if(l[i++] && !(type & 8)) {
		l.splice(--i, 1);
	}
	if(l[i++] && !(type & 16)) {
		l.splice(--i, 1);
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
	return '<table style="text-align:end;"><tr style="font-size: 1.4em"><td>' + c[0].all + '</td><td style="text-align:start">' + im([ruinPlan[0][0]]) + '</td><td>' + c[1].all + '</td><td>' + im([ruinPlan[1][0]]) + '</td><td>' + c[2].all + '</td><td>' + im([ruinPlan[2][0]]) + '</td><td>' + c[3].all + '</td><td>' + im([ruinPlan[3][0]]) + '</td></tr><tr><td colspan="2">Bunker</td><td>' + c[1].b + '</td><td>' + im([ruinPlan[1][1]]) + '</td><td>' + c[2].b + '</td><td>' + im([ruinPlan[2][1]]) + '</td><td>' + c[3].b + '</td><td>' + im([ruinPlan[3][1]]) + '</td></tr><tr><td colspan="2">Hôpital</td><td>' + c[1].h + '</td><td>' + im([ruinPlan[1][2]]) + '</td><td>' + c[2].h + '</td><td>' + im([ruinPlan[2][2]]) + '</td><td>' + c[3].h + '</td><td>' + im([ruinPlan[3][2]]) + '</td></tr><tr><td colspan="2">Hotel</td><td>' + c[1].m + '</td><td>' + im([ruinPlan[1][3]]) + '</td><td>' + c[2].m + '</td><td>' + im([ruinPlan[2][3]]) + '</td><td>' + c[3].m + '</td><td>' + im([ruinPlan[3][3]]) + '</td></tr></table>';
}

document.addEventListener('DOMContentLoaded', function() {
	chrome.tabs.executeScript(null, {
		code: `document.getElementsByTagName('body')[0].innerText`,
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
		for(b in buildings) {
			val += getBuilding(page, b, buildings[b]);
		}
		val += '</table>';
		
		document.getElementById('content').innerHTML = '<p>Chantiers pouvant être découvert : </p>' + getCountDisplay(count) + '<br><p>Chantiers bloqués : </p>' + getCountDisplay(countUnactive) + '<br><p>Détails : </p>' + val;
	});
}, false);