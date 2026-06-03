import{j as p,i as k,q as w,m as l,e as h,a as e,h as u,u as b,F as f,p as v,x as _,k as C,b as I,s as M,t as g,d as V,f as B}from"./index-DnrDs0Bp.js";/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=t=>t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var r={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=({size:t,strokeWidth:n=2,absoluteStrokeWidth:c,color:s,iconNode:i,name:a,class:d,...m},{slots:x})=>p("svg",{...r,width:t||r.width,height:t||r.height,stroke:s||r.stroke,"stroke-width":c?Number(n)*24/Number(t):n,class:["lucide",`lucide-${S(a??"icon")}`],...m},[...i.map(y=>p(...y)),...x.default?[x.default()]:[]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const o=(t,n)=>(c,{slots:s})=>p(q,{...c,iconNode:n,name:t},s);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=o("CalendarIcon",[["path",{d:"M8 2v4",key:"1cmpym"}],["path",{d:"M16 2v4",key:"4m81vk"}],["rect",{width:"18",height:"18",x:"3",y:"4",rx:"2",key:"1hopcy"}],["path",{d:"M3 10h18",key:"8toen8"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=o("CameraIcon",[["path",{d:"M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",key:"1tc9qg"}],["circle",{cx:"12",cy:"13",r:"3",key:"1vg3eu"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=o("MessageSquareIcon",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=o("SquareCheckBigIcon",[["path",{d:"M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5",key:"1uzm8b"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const j=o("TargetIcon",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["circle",{cx:"12",cy:"12",r:"6",key:"1vlfrh"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}]]);/**
 * @license lucide-vue-next v0.468.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=o("TrendingUpIcon",[["polyline",{points:"22 7 13.5 15.5 8.5 10.5 2 17",key:"126l90"}],["polyline",{points:"16 7 22 7 22 13",key:"kwv8wd"}]]),H={class:"w-64 bg-[#2C3E37] h-screen flex flex-col text-white"},$={class:"p-6 border-b border-white/10"},D={class:"flex items-center gap-2"},E={class:"w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center"},F={class:"flex-1 p-4"},U={class:"space-y-2"},K={class:"text-sm flex-1"},R={key:0,class:"text-xs bg-white/20 px-2 py-0.5 rounded"},G=k({__name:"Sidebar",setup(t){const n=[{id:"f1",label:"성적표 촬영",icon:z,path:"/",badge:"진행중"},{id:"f1-1",label:"틀린 문항 정밀 체크",icon:T,path:"/answer-marking"},{id:"f2",label:"취약영역 분석",icon:j,path:"/analysis"},{id:"f3",label:"AI 학습 플래닝",icon:N,path:"/ai-planner"},{id:"f4",label:"AI 문제풀이 챗봇",icon:L,path:"/ai-chatbot"}];return(c,s)=>{const i=w("router-link");return l(),h("div",H,[e("div",$,[e("div",D,[e("div",E,[u(b(A),{class:"w-6 h-6 text-emerald-400"})]),s[0]||(s[0]=e("div",null,[e("h1",{class:"font-bold text-lg"},"러너스하이"),e("p",{class:"text-xs text-white/60"},"Runner's High AI")],-1))])]),e("nav",F,[e("div",U,[(l(),h(f,null,v(n,a=>u(i,{key:a.id,to:a.path,class:"block"},{default:_(({isActive:d})=>[e("div",{class:C(["flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",d?"bg-emerald-600 text-white":"text-white/70 hover:bg-white/5 hover:text-white"])},[(l(),I(M(a.icon),{class:"w-5 h-5"})),e("span",K,g(a.label),1),a.badge&&d?(l(),h("span",R,g(a.badge),1)):V("",!0)],2)]),_:2},1032,["to"])),64))])]),s[1]||(s[1]=B('<div class="p-4 border-t border-white/10"><div class="flex items-center gap-3 px-4 py-3"><div class="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center"><span class="text-sm">이</span></div><div class="text-sm"><p class="text-white/90">이민우</p><p class="text-xs text-white/50">고등학생 3학년</p></div></div></div>',1))])}}});export{z as C,L as M,j as T,G as _,A as a,o as c};
