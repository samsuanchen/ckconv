var fs=require('fs') 
// read input.txt
var inp=fs.readFileSync('input.txt',"utf8").replace(/\r\n/g,'\n');
/*
var inp=fs.readFileSync('../A Catalogue of the Comparative Kangyur_Hackett.txt').toString()
var inpBgn="('dul ba) texts 0001-0024", ib=inp.indexOf(inpBgn)
var inpEnd='Concordances', ie=inp.indexOf('\r\n'+inpEnd+'\r\n')
inp=inp.substring(ib,ie) // ignore leading and trailing text
inp=inp.replace(/" CK 857/,'CK 857')
var txtMoved=/\r\n.+? texts 0764-0767\r\n/, m=inp.match(txtMoved)
if (m) {
	inp=inp.replace(m[0],'\r\n')
	inp=inp.replace(/\r\nCK 764/,m[0]+'CK 764')
}
inp=inp.replace(/\r\nCK(\d+)/g,function(txt){
	var m=txt.match(/\r\nCK(\d+)/)
	console.log('CK'+m[1]+' ===> CK '+m[1])
	return '\r\nCK '+m[1]
}) */
var lines=inp.split('\n'), len, limit, L, id=0, offset=0
var lineRange=lines.map(function(line){
	len=line.length, limit=offset+len
	L={id:id++, start:offset, len:len, limit:limit, text:line}
	offset=limit+2
	return L
})
function offsetToLine(offset) { // given char offset return line id (starting from 0)
	for (var i=0; i<lineRange.length; i++)
		if (offset>=lineRange[i].start && offset<lineRange[i].limit)
			break
	return i
}
var groupp='(texts?|TEXTS?) (\\d{4})(-\\d{4})?\\n(.+\\n)?CK\\s(\\d+)'
var groupg=RegExp(groupp,'g'); groupp=RegExp(groupp)
var m=inp.match(groupg),M,ib,ie,i=1,p,groups=[] // match all groups
debugger;
m.forEach(function(g){
	M=g.match(groupp),ib=parseInt(M[2]),ie=M[3],b=parseInt(M[5])
	if (M[4]) if (p=M[4].match( /(texts?|TEXTS?) (\d{4})(-\d{4})?/ )) {
		ie=p[3]
	}
	ie=ie?parseInt(ie.substr(1)):ie=ib
	if ( i!==ib || b!==ib )
		console.log('***** group begin expected',i,'parsed',ib,ie,b,M[0])
	groups.push({b:ib,e:ie})
	console.log(ib,ie)
	i=ie+1
})
var pagep='\\n(\\d+) [•■*-]|[•■*-] (\\d+)\\n'
var pageg=RegExp(pagep,'g'); pagep=RegExp(pagep)
var m=inp.match(pageg),M,t,i,p=3,j,pages={}
m.forEach(function(page){
	M=page.match(pagep), t=M[1]||M[2]
	if(t){
		i=parseInt(t)
		if(p!==i) {
			pages[p]='\n'+p+'\n'
			console.log('page expected',p,'parsed',i)
		}
		pages[i]=t
		var O=inp.indexOf(M[0])
		var L=offsetToLine(O+2)
		console.log('page '+i+' at '+O+' line '+L)
		p=i+1
	}
})
var numErrNotQ=0
inp=inp.split(/\nCK/)
console.log(inp.length-1,'CKs')
var m, k=0, j, d, a, CKname, CKvalue, fieldName, fieldValue
function parseCKname(CK){
	m=CK.match(/^([0-9\t ]+)(\(.+\))?/)		// match CKname 
	if (m) {
		k++, j=parseInt(m[1].replace(/\s/g,''))	// CK # (k the expected, j the parsed)
		a=m[2], a=a?a.substr(1,a.length-2):''	// CK append (a = 'a','b','c',...)
		if (k!==j && a)					// if not expected
			k--							//		adjust k first
		if (k-j) {						// if still not expected
			console.log('***** CK expect '+k+' parsed '+j+'\n'+CK), numErrNotQ++
			k=j							// adjust
			return
		}
	//	console.log('CK'+j+a, CK.substr(0,m[0].length+10))
		return 'CK'+j+a				// return CKname
	} else if (k)
		console.log('????? error',CK), numErrNotQ++
}
var vop='vol.\\s*(\\d+),\\s*pp\\.\\s*([0-9\\- ,]+)'
var vog=RegExp(vop,'g'); vop=RegExp(vop)
var p, vol, bgn, stp
function parseCKvalue(CK){
	if (m=CK.match(vog)) { // match CK value ====================================
		var CKvalue=[]
		m.forEach(function(ref){ // for each ref
			p=ref.match(vop), vol=p[1], at=p[2].replace(/ /g,'')
			CKvalue.push(vol+'@'+at)
		})
		CKvalue=CKvalue.join(';')	
		console.log('{ "'+CKname+'":"'+CKvalue+'",')
	} else
		CKvalue='***** no CKvalue *****', numErrNotQ++
	return CKvalue
}
var jinglu=[], json={}
var fieldValuep='([0-9li!]+[ab][0-9li!]+-[0-9li!]+[ab][0-9li!]+);?'
var fieldValueg=RegExp(fieldValuep,'g'); fieldValuep=RegExp(fieldValuep)
function parseFieldValue(txt){ var f,v,vbgn,vlmt,j,t,i=0
	v=txt.match(/\(vol.\s?(\d+)(-\d+)?(,\sp\..+?)?/)
	if (!v) return
	f=txt.substr(0,txt.indexOf(v[0])+v[0].length).match(fieldValueg)
	if (!f) return
	if(fieldName.match(/^Q/))
		return '????? '+txt
	vbgn=parseInt(v[1]), vlmt=(v[2]?parseInt(v[2].substr(1)):vbgn)+1
	f=f.map(function(ref){
		return (vbgn++)+'@'+ref.match(fieldValuep)[1].replace(/[il!]/g,'1')
	}).join(';')
	if (vbgn!==vlmt) {
		console.log('?????',CKname,fieldName,'vol. range unmatched\n'+txt),numErrNotQ++
		return '????? '+txt
	}
	return f
}
var fieldNamep='([DQNCHJU])([0-9 \\t]+)(\\([a-z]\\))?'
var fieldNameg=RegExp(fieldNamep,'g'); fieldNamep=RegExp(fieldNamep)
function parseFields(CK){
	var m=CK.match(fieldNameg)
	if(!m)return
	var fields=m.map(function(field){
		var p=field.match(fieldNamep),a=p[3],a=a?a.substr(1,a.length-2):''
		fieldName=(p[1]+p[2]+a).replace(/\s/g,'')
	return {fieldName:fieldName,at:CK.indexOf(p[1]+p[2]+(p[3]||''))}
	})
	for (var i=0;i<fields.length;i++) {
		var ib=fields[i].at,v
		var ie=(i===fields.length-1)?CK.length:fields[i+1].at
		var txt=CK.substring(ib,ie).replace(/\n/g,' ')
		var n=txt.match(fieldNamep)[0].length
		var txt=txt.substr(n)
		fieldName=fields[i].fieldName
		fields[i].txt=txt
		fields[i].value=parseFieldValue(txt)
	}
	return fields
}
var noValues=0
inp.forEach(function(CK){
	if (CKname=parseCKname(CK)) {
		if (CKvalue)
			jinglu.push(JSON.stringify(json)),json={}
		json[CKname]=CKvalue=parseCKvalue(CK)
		var fields=parseFields(CK)
		if(fields) {
			fields=fields.map(function(f){
				json[f.fieldName]=f.value
				return '"'+f.fieldName+'":"'+f.value+'"'
			}).join(',\n  ')
			console.log('  '+fields)
		}
		console.log('}')
	}
})
if (CKvalue)
	jinglu.push(JSON.stringify(json))
fs.writeFileSync('../output.txt','[\n'+jinglu.join(',\n')+'\n]')
console.log('numErrNotQ',numErrNotQ)