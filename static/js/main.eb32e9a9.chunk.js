(window.webpackJsonp=window.webpackJsonp||[]).push([[0],{15:function(e,t,n){e.exports=n(36)},20:function(e,t,n){},22:function(e,t,n){},36:function(e,t,n){"use strict";n.r(t);var a=n(0),o=n.n(a),r=n(8),c=n.n(r),i=(n(20),n(9)),l=n(10),s=n(13),u=n(11),m=n(14),d=n(12),w=n(1),y=n.n(w),p=(n(22),n(2)),f=n.n(p),h=function(e){var t,n,a={},o="";try{for(t in o=void 0===e?window.location.search.split("?")[1].split("&"):e.split("?")[1].split("#")[0].split("&"))o.hasOwnProperty(t)&&(console.log("prop: "+t+" value: "+o[t]),a[(n=o[t].split("="))[0]]=n[1])}catch(r){console.log("Error getArgs window.location.search("+window.location.search+")")}return console.log(JSON.stringify(a)),a}(),v=function(e){return o.a.createElement("div",{className:"block",style:{backgroundColor:e.color}},e.children)},k=function(e){return e.window.map(function(e,t){return o.a.createElement(v,{color:e.color,row:e.row,column:e.column,key:t},e.count)})},E=[{keyValue:32,keySymbol:"space"},{keyValue:37,keySymbol:"left"},{keyValue:38,keySymbol:"up"},{keyValue:39,keySymbol:"right"},{keyValue:40,keySymbol:"down"}],b=function(e){var t=y.a.find(E,function(t){return t.keyValue===e});return t?t.keySymbol:null},g=function(e){function t(e){var n;return Object(i.a)(this,t),(n=Object(s.a)(this,Object(u.a)(t).call(this,e))).state=f.a.init(),n.state.timer=setInterval(function(){n.setState(function(e){return f.a.tick(e)})},250),d.a(function(e){setTimeout(function(){n.setState(function(t){var n=b(e.which);return n?f.a.key(n,t):t})})}),n}return Object(m.a)(t,e),Object(l.a)(t,[{key:"render",value:function(){return h.debug?o.a.createElement("div",{style:{columns:"400px 3"}},o.a.createElement("div",{className:"container"},o.a.createElement("div",{className:"App"},o.a.createElement(k,{window:y.a.flatten(f.a.toArray(this.state)[0])}))),o.a.createElement("div",{className:"container"},o.a.createElement("div",{className:"App"},o.a.createElement(k,{window:y.a.flatten(f.a.toArray(this.state)[1])}))),o.a.createElement("div",{className:"container"},o.a.createElement("div",{className:"App"},o.a.createElement(k,{window:y.a.flatten(f.a.join(this.state))})))):o.a.createElement("div",{className:"container"},o.a.createElement("div",{className:"App"},o.a.createElement(k,{window:y.a.flatten(f.a.join(this.state))})))}}]),t}(a.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));c.a.render(o.a.createElement(g,null),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then(function(e){e.unregister()})}},[[15,2,1]]]);
//# sourceMappingURL=main.eb32e9a9.chunk.js.map