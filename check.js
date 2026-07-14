const vnd = n => n.toLocaleString("de-DE") + " ₫";
const WEEKDAY=["Wednesday","Thursday","Friday","Saturday","Sunday","Monday","Tuesday"];
const dow = d => WEEKDAY[(d-1)%7];
const ROSTER=[
 {n:"Nguyễn Minh Anh",r:250000,on:false},{n:"Trần Bảo Ngọc",r:300000,on:false},
 {n:"Lê Gia Hân",r:250000,on:false},{n:"Emma Thompson",r:200000,on:true},
 {n:"Phạm Quốc Bảo",r:300000,on:false},{n:"Olivia Nguyen",r:220000,on:true},
 {n:"Đỗ Khánh Linh",r:250000,on:false},{n:"Liam Carter",r:350000,on:false},
 {n:"Vũ Thanh Trúc",r:250000,on:false},{n:"Hoàng Nam Phong",r:320000,on:false}];
const TODAY=14;
const TODAY_ROWS=[{s:"COMPLETE",x:0},{s:"COMPLETE",x:1},{s:"PENDING",x:3},{s:"PENDING",x:4},{s:"CANCELLED",x:6}];

// 1. Does the JS reproduce the hardcoded header for Jul 14?
const t = TODAY_ROWS.map(r=>({st:r.s, rate:ROSTER[r.x].r}));
const bill = t.filter(r=>r.st!=="CANCELLED").reduce((a,r)=>a+r.rate,0);
const lost = t.filter(r=>r.st==="CANCELLED").reduce((a,r)=>a+r.rate,0);
console.log("Jul 14  ->", dow(14)+", July 14 |", t.length+" lessons ·", vnd(bill), "| loss", vnd(lost));
console.log("   expected: Tuesday, July 14 | 5 lessons · 1.050.000 ₫ | loss 250.000 ₫");
console.log("   MATCH:", dow(14)==="Tuesday" && vnd(bill)==="1.050.000 ₫" && vnd(lost)==="250.000 ₫" ? "YES" : "NO");

// 2. Weekday alignment of every cell in the grid vs its column
const cols=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const weeks=[[null,null,1,2,3,4,5],[6,7,8,9,10,11,12],[13,14,15,16,17,18,19],[20,21,22,23,24,25,26],[27,28,29,30,31,null,null]];
let bad=0;
weeks.forEach(w=>w.forEach((d,i)=>{ if(d && dow(d)!==cols[i]){bad++;console.log("  MISALIGNED: July",d,"->",dow(d),"but sits in",cols[i]);} }));
console.log("\nGrid weekday alignment:", bad===0 ? "all 31 days land in the right column" : bad+" MISALIGNED");

// 3. Monthly revenue sanity: does the studio's month land in the 15-30M realistic band?
const counts={1:2,2:3,3:2,4:4,7:4,8:2,9:3,10:1,11:4,13:3,14:5,15:2,16:3,17:2,18:4,21:3,22:2,23:3,25:4,27:3,28:3,30:2,31:3};
let month=0, lessons=0;
for(const [d,n] of Object.entries(counts)){
  const day=+d;
  for(let k=0;k<n;k++){
    let rate, st;
    if(day===TODAY){ st=TODAY_ROWS[k].s; rate=ROSTER[TODAY_ROWS[k].x].r; }
    else { rate=ROSTER[(day*3+k)%ROSTER.length].r;
           st = day>TODAY ? "PENDING" : (day<TODAY && k===n-1 && day%4===0 ? "CANCELLED":"COMPLETE"); }
    lessons++; if(st!=="CANCELLED") month+=rate;
  }
}
console.log("Days with lessons:", Object.keys(counts).length+"/35 cells |", lessons, "lessons");
console.log("Month billable:", vnd(month), "-> in the realistic 15.000.000–30.000.000 band:", month>=15e6&&month<=30e6 ? "YES":"NO");
