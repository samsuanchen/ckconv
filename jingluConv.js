var fs=require('fs')
var inp=fs.readFileSync('input.txt').toString().split('\r\n')
var i, L
var out=[]
console.log(inp.length)
var ckp=/^(.{0,3})CK ?([0-9l]+) ?(\(.+\))?/
var vog=/vol.\s*(\d+),\s*pp\.\s*(\d+)-(\d+)/g
var vop=/vol.\s*(\d+),\s*pp\.\s*(\d+)-(\d+)/
var jinglu=[], m, j, k=0, L, d, a, CKname, CKvalue=''
for(i=0; i<inp.length; i++) {
    L=inp[i]
	if(m=L.match(ckp)){		// match CK name =========================================
		if ('undefined'!==typeof json){
			if (CKvalue==='') 
				console.log(CKname,JSON.stringify(json),i,L)
			jinglu.push(JSON.stringify(json))
		}
		var json={}
		CKvalue=''
		++k,a=m[3],a=a?a.substr(1,a.length-2):''// CK append (a,b,c)
		j=parseInt(m[2])	// j the parsed   CK #
		if(j!==k) k--		// k the expected CK #
		CKname='CK'+j+a
		if(d=j-k)
			console.log(i+' '+d+' CK'+j+a+' '+L); k=j // resume
	}
	if (m=L.match(vog)) { // match CK value ====================================
		m.forEach(function(M){ // for each ref
			var p=M.match(vop)
			var vol=p[1], bgn=p[2], stp=p[3]
			if(CKvalue)CKvalue+=';'
			CKvalue+=vol+'@'+bgn+'-'+stp
		})
		json[CKname]=CKvalue
	//	console.log(CKname+':'+CKvalue)
	}
}
if ('undefined'!==typeof json)
	jinglu.push(JSON.stringify(json))
fs.writeFileSync('output.txt',jinglu.join(',\r\n'))