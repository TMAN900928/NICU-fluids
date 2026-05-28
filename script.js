const milkData = {
  "Cow Milk": {carb:4.6, protein:3.4, kcal:67, na:23, k:40, ca:124, phos:98},
  "Standard Formula": {carb:7.5, protein:1.5, kcal:67, na:6.4, k:14, ca:46, phos:33},
  "Mature Breastmilk": {carb:7.4, protein:1.1, kcal:70, na:6.4, k:15, ca:35, phos:15},
  "Preterm Formula": {carb:8.6, protein:2.0, kcal:80, na:14, k:19, ca:77, phos:41},
  "Preterm Breastmilk": {carb:6.4, protein:2.7, kcal:74, na:17, k:17, ca:29, phos:13}
};

const pnData = {
  "Type A": {protein:3.3, kcal:53.2, na:3, phos:1.5, ca:1.4, mg:0.25, cl:0, acetate:0, glucose:10},
  "Type B": {protein:3, kcal:52, na:3, phos:1.5, ca:0.15, mg:0.22, cl:2, acetate:0, glucose:10},
  "Type C": {protein:3.8, kcal:65.2, na:4, phos:1.5, ca:0.15, mg:0.25, cl:2.7, acetate:1, glucose:12.5}
};

const ivdData = {
  "1/5NS": {na:77, cl:77, k:0, ca:0},
  "HS": {na:77, cl:77, k:0, ca:0},
  "NS": {na:154, cl:154, k:0, ca:0},
  "3% Saline": {na:513, cl:513, k:0, ca:0},
  "HM": {na:131, cl:111, k:5, ca:2},
  "No Drip": {na:0, cl:0, k:0, ca:0}
};

function calculate(){

let weight = parseFloat(document.getElementById("weight").value)||0;
let targetFluid = parseFloat(document.getElementById("targetFluid").value)||0;

let feedVol = parseFloat(document.getElementById("feedVol").value)||0;
let feedInterval = parseFloat(document.getElementById("feedInterval").value)||1;

let milkType = document.getElementById("milkType").value;
let feedType = document.getElementById("feedingType").value;

let pnType = document.getElementById("pnType").value;
let pnRate = parseFloat(document.getElementById("pnRate").value)||0;

let lipidDose = parseFloat(document.getElementById("lipidDose").value)||0;
let lipidRate = parseFloat(document.getElementById("lipidRate").value)||0;

let ivdType = document.getElementById("ivdType").value;
let ivdRate = parseFloat(document.getElementById("ivdRate").value)||0;
let dextrose = parseFloat(document.getElementById("dextrose").value)||0;

if(feedType==="NBM"){
  feedVol=0;
}

if(feedType==="Full Feeding"){
  document.getElementById("pnSection").style.display="none";
  document.getElementById("ivdSection").style.display="none";
}else{
  document.getElementById("pnSection").style.display="block";
  document.getElementById("ivdSection").style.display="block";
}

let feedsPerDay = 24/feedInterval;
let totalFeedMl = feedVol*feedsPerDay;

let feedFluid = totalFeedMl/weight;
let feedRate = totalFeedMl/24;

let pnFluid = (pnRate*24)/weight;
let lipidFluid = (lipidRate*24)/weight;
let ivdFluid = (ivdRate*24)/weight;

let totalFluid = feedFluid + pnFluid + lipidFluid + ivdFluid;

if(totalFluid>targetFluid){

  let excess = totalFluid-targetFluid;

  if(ivdFluid>=excess){
    ivdFluid -= excess;
    ivdRate = (ivdFluid*weight)/24;
  }else{
    excess -= ivdFluid;
    ivdFluid=0;
    ivdRate=0;

    pnFluid -= excess;
    pnRate = (pnFluid*weight)/24;
  }

  totalFluid = targetFluid;
}

let milk = milkData[milkType];
let pn = pnData[pnType];
let ivd = ivdData[ivdType];

let feedProtein = (milk.protein*totalFeedMl/100)/weight;

let pnProtein = (pn.protein*(pnRate*24)/100)/weight;

let totalProtein = feedProtein + pnProtein;

let feedCalories = (milk.kcal*totalFeedMl/100)/weight;

let pnCalories = (pn.kcal*(pnRate*24)/100)/weight;

let lipidCalories = lipidDose*10;

let totalCalories = feedCalories + pnCalories + lipidCalories;

let feedGDR = (milk.carb*feedRate)/(weight*6);

let pnGDR = (pn.glucose*pnRate)/(weight*6);

let ivdGDR = (dextrose*ivdRate)/(weight*6);

let totalGDR = feedGDR + pnGDR + ivdGDR;

let sodium = (
((milk.na/1000)*totalFeedMl)+
((pn.na/1000)*(pnRate*24))+
((ivd.na/1000)*(ivdRate*24))
)/weight;

let potassium = (
((milk.k/1000)*totalFeedMl)+
((ivd.k/1000)*(ivdRate*24))
)/weight;

let chloride = (
((pn.cl/1000)*(pnRate*24))+
((ivd.cl/1000)*(ivdRate*24))
)/weight;

let calcium = (
((milk.ca/1000)*totalFeedMl)+
((pn.ca/1000)*(pnRate*24))+
((ivd.ca/1000)*(ivdRate*24))
)/weight;

let phosphate = (
((milk.phos/1000)*totalFeedMl)+
((pn.phos/1000)*(pnRate*24))
)/weight;

let magnesium = (
((pn.mg/1000)*(pnRate*24))
)/weight;

let acetate = (
((pn.acetate/1000)*(pnRate*24))
)/weight;

document.getElementById("totalFluidOut").innerHTML =
"Total Fluid: "+totalFluid.toFixed(1)+" ml/kg/day";

document.getElementById("gdrOut").innerHTML =
"Total GDR: "+totalGDR.toFixed(1)+" mg/kg/min";

document.getElementById("caloriesOut").innerHTML =
"Calories: "+totalCalories.toFixed(1)+" kcal/kg/day";

document.getElementById("proteinOut").innerHTML =
"Protein: "+totalProtein.toFixed(1)+" g/kg/day";

document.getElementById("lipidOut").innerHTML =
"Lipid: "+lipidDose.toFixed(1)+" g/kg/day";

document.getElementById("naOut").innerHTML =
"Sodium: "+sodium.toFixed(2)+" mmol/kg/day";

document.getElementById("kOut").innerHTML =
"Potassium: "+potassium.toFixed(2)+" mmol/kg/day";

document.getElementById("clOut").innerHTML =
"Chloride: "+chloride.toFixed(2)+" mmol/kg/day";

document.getElementById("caOut").innerHTML =
"Calcium: "+calcium.toFixed(2)+" mmol/kg/day";

document.getElementById("phosOut").innerHTML =
"Phosphate: "+phosphate.toFixed(2)+" mmol/kg/day";

document.getElementById("mgOut").innerHTML =
"Magnesium: "+magnesium.toFixed(2)+" mmol/kg/day";

document.getElementById("acetateOut").innerHTML =
"Acetate: "+acetate.toFixed(2)+" mmol/kg/day";

document.getElementById("warning").innerHTML =
(totalFluid<targetFluid)
? "Fluid below target"
: "Fluid at target";
}
