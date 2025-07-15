const pnData = {
  starter: {
    aa: 3.3, glucose: 10, sodium: 3, phosphate: 1.5, potassium: 0,
    calcium: 1.4, magnesium: 0.25, chloride: 0, acetate: 0,
    traceElements: 0, kcal: 53.2, dextrosePercent: 10
  },
  maintenance: {
    aa: 3, glucose: 10, sodium: 3, phosphate: 1.5, potassium: 2,
    calcium: 0.15, magnesium: 0.22, chloride: 2, acetate: 0,
    traceElements: 0.74, kcal: 52, dextrosePercent: 10
  },
  concentrated: {
    aa: 3.8, glucose: 12.5, sodium: 4, phosphate: 1.5, potassium: 2.7,
    calcium: 0.15, magnesium: 0.25, chloride: 2.7, acetate: 1,
    traceElements: 0.74, kcal: 65.2, dextrosePercent: 12.5
  }
};

const lipidData = {
  1: { vol: 6, g: 1.07, kcal: 10.8 },
  2: { vol: 12, g: 2.13, kcal: 21.6 },
  default: { vol: 18, g: 3.2, kcal: 32.4 }
};

function calculate() {
  const wt = parseFloat(document.getElementById("weight").value);
  const tf = parseFloat(document.getElementById("totalFluid").value);
  const dol = parseInt(document.getElementById("dol").value);
  const pnType = document.getElementById("pnType").value;
  const ivDex = parseFloat(document.getElementById("ivDextrose").value);
  const ivRate = parseFloat(document.getElementById("ivRate").value);

  const selectedPN = pnData[pnType];
  const totalPNVol = wt * tf;

  // Lipid calculation
  const lipid = lipidData[dol] || lipidData.default;
  const lipidVol = lipid.vol * wt;
  const lipidG = lipid.g * wt;
  const lipidKcal = lipid.kcal * wt;

  // PN totals
  const totalAA = selectedPN.aa * totalPNVol / 100;
  const totalGlucose = selectedPN.glucose * totalPNVol / 100;
  const totalNa = selectedPN.sodium * totalPNVol / 100;
  const totalP = selectedPN.phosphate * totalPNVol / 100;
  const totalK = selectedPN.potassium * totalPNVol / 100;
  const totalCa = selectedPN.calcium * totalPNVol / 100;
  const totalMg = selectedPN.magnesium * totalPNVol / 100;
  const totalCl = selectedPN.chloride * totalPNVol / 100;
  const totalAc = selectedPN.acetate * totalPNVol / 100;
  const totalTE = selectedPN.traceElements ? selectedPN.traceElements * totalPNVol / 100 : 0;
  const totalKcalPN = selectedPN.kcal * totalPNVol / 100;

  // GDR (mg/kg/min) = (Infusion rate x dextrose%) / (weight x 6)
  const gdrPN = ((totalPNVol / 24) * selectedPN.dextrosePercent) / (wt * 6);
  const gdrIV = (ivRate * ivDex) / (wt * 6);
  const totalGDR = gdrPN + gdrIV;

  // Calories
  const ivKcal = ivDex * ivRate * 0.0348 * 24; // kcal/day from IV
  const totalKcal = totalKcalPN + lipidKcal + ivKcal;

  // Fluid check
  const expectedTotal = totalPNVol + lipidVol + (ivRate * 24);
  const intendedTotal = wt * tf;
  const warning = expectedTotal < intendedTotal
    ? `<span style="color:red;">⚠️ Total fluid is ${expectedTotal.toFixed(1)} mL/day, below intended ${intendedTotal.toFixed(1)} mL/day</span>`
    : '';

  document.getElementById("results").innerHTML = `
    <h2>Results</h2>
    <b>PN Volume:</b> ${totalPNVol.toFixed(1)} mL/day<br>
    <b>Lipid Volume:</b> ${lipidVol.toFixed(1)} mL/day<br>
    <b>Lipid kcal:</b> ${lipidKcal.toFixed(1)} kcal/day<br>
    <b>IV Volume:</b> ${(ivRate * 24).toFixed(1)} mL/day<br><br>

    <b>Total Calories:</b> ${totalKcal.toFixed(1)} kcal/day<br>
    <b>GDR:</b> ${totalGDR.toFixed(2)} mg/kg/min<br><br>

    <b>Amino Acid:</b> ${totalAA.toFixed(2)} g/day (${(totalAA/wt).toFixed(2)} g/kg/day)<br>
    <b>Glucose:</b> ${totalGlucose.toFixed(2)} g/day (${(totalGlucose/wt).toFixed(2)} g/kg/day)<br>
    <b>Sodium:</b> ${totalNa.toFixed(2)} mmol/day (${(totalNa/wt).toFixed(2)} mmol/kg/day)<br>
    <b>Potassium:</b> ${totalK.toFixed(2)} mmol/day (${(totalK/wt).toFixed(2)} mmol/kg/day)<br>
    <b>Phosphate:</b> ${totalP.toFixed(2)} mmol/day (${(totalP/wt).toFixed(2)} mmol/kg/day)<br>
    <b>Calcium:</b> ${totalCa.toFixed(2)} mmol/day (${(totalCa/wt).toFixed(2)} mmol/kg/day)<br>
    <b>Magnesium:</b> ${totalMg.toFixed(2)} mmol/day (${(totalMg/wt).toFixed(2)} mmol/kg/day)<br>
    <b>Chloride:</b> ${totalCl.toFixed(2)} mmol/day (${(totalCl/wt).toFixed(2)} mmol/kg/day)<br>
    <b>Acetate:</b> ${totalAc.toFixed(2)} mmol/day (${(totalAc/wt).toFixed(2)} mmol/kg/day)<br>
    <b>Trace Elements:</b> ${totalTE.toFixed(2)} mL/day<br><br>
    ${warning}
  `;
}
