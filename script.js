function calculate() {
  const dob = new Date(document.getElementById('dob').value);
  const now = new Date(document.getElementById('now').value);
  const weight = parseFloat(document.getElementById('weight').value).toFixed(2);
  const fluid = parseFloat(document.getElementById('fluid').value);
  const proteinTarget = parseFloat(document.getElementById('protein').value);
  const pnType = document.getElementById('pnType').value;
  const ivRateInput = document.getElementById('ivRate').value;

  const nacl = document.getElementById('nacl').value;
  const kcl = document.getElementById('kcl').value;
  const dextrose = document.getElementById('dextrose').value;

  const warnings = [];
  let recommendation = "";

  if (ivRateInput === "") {
    document.getElementById('results').innerHTML = `<p class="warning">⚠️ IV drip rate is blank. If no IV drip is used, please enter <strong>0</strong>.</p>`;
    return;
  }

  const ivRate = parseFloat(ivRateInput);

  if (ivRate > 0 && (nacl === "" || kcl === "" || dextrose === "")) {
    document.getElementById('results').innerHTML = `<p class="warning">⚠️ All IV parameters (NaCl, KCl, Dextrose) are required when IV rate is above 0.</p>`;
    return;
  }

  const ageHours = ((now - dob) / (1000 * 60 * 60)).toFixed(1);
  const dol = Math.floor(ageHours / 24) + 1;
  const totalFluidPerDay = fluid * weight;
  const ivVolumePerDay = ivRate * 24;
  const remainingFluid = totalFluidPerDay - ivVolumePerDay;

  const pnData = {
    starter: {
      aa: 3.3, glucose: 10, na: 3, phos: 1.5, k: 0, ca: 1.4, mg: 0.25, cl: 0, ac: 0, te: 0, kcal: 53.2
    },
    maintenance: {
      aa: 3.0, glucose: 10, na: 3, phos: 1.5, k: 2, ca: 0.15, mg: 0.22, cl: 2, ac: 0, te: 0.74, kcal: 52
    },
    concentrated: {
      aa: 3.8, glucose: 12.5, na: 4, phos: 1.5, k: 2.7, ca: 0.15, mg: 0.25, cl: 2.7, ac: 1, te: 0.74, kcal: 65.2
    }
  }[pnType];

  if (proteinTarget > 4) warnings.push("⚠️ Protein target capped at 4 g/kg/day");

  const finalProteinTarget = Math.min(proteinTarget, 4);
  const aaConc = pnData.aa;
  let pnVolumePerDay = (finalProteinTarget * weight * 100) / aaConc;

  // 🔁 Auto-assign lipid based on DOL
  let lipidVolumeKg = dol === 1 ? 6 : (dol === 2 ? 12 : 18);
  let lipidGramsKg = dol === 1 ? 1.07 : (dol === 2 ? 2.13 : 3.2);
  let lipidKcalKg = lipidVolumeKg * 1.8;

  let lipidVolumePerDay = lipidVolumeKg * weight;
  let remainingFluidAfterLipid = remainingFluid - lipidVolumePerDay;

  if (pnVolumePerDay > remainingFluidAfterLipid) {
    pnVolumePerDay = remainingFluidAfterLipid;
  }

  const pnRate = pnVolumePerDay / 24;
  const lipidRate = lipidVolumePerDay / 24;

  const aaDelivered = (pnVolumePerDay * aaConc) / 100;
  const proteinPerKgDay = (aaDelivered / weight).toFixed(1);

  const pnGlucose = (pnVolumePerDay * pnData.glucose) / 100;
    const ivGlucose = ivRate > 0 ? ((parseFloat(dextrose) / 100) * ivRate * 24) : 0;
  const totalGlucose = pnGlucose + ivGlucose;

  // ✅ GDR using your center's formula
  const pnRateMlh = pnRate; // mL/hr
  const pnDextrose = pnData.glucose; // g/100 mL = %
  const pnGDR = (pnRateMlh * pnDextrose) / (weight * 6);
  const ivGDR = ivRate > 0 ? (ivRate * parseFloat(dextrose)) / (weight * 6) : 0;
  const totalGDR = (pnGDR + ivGDR).toFixed(1);

  // ✅ Calories
  const pnKcalKg = (pnData.kcal * pnVolumePerDay / 100 / weight).toFixed(1);
  const lipidKcalKgRounded = lipidKcalKg.toFixed(1);
  const ivKcalKg = ivGlucose > 0 ? ((ivGlucose / weight) * 3.4).toFixed(1) : "0.0";
  const totalKcal = (parseFloat(pnKcalKg) + parseFloat(lipidKcalKgRounded) + parseFloat(ivKcalKg)).toFixed(1);

  const totalDeliveredFluid = ((ivVolumePerDay + pnVolumePerDay + lipidVolumePerDay) / weight).toFixed(1);
  const fluidShortfall = (fluid - totalDeliveredFluid).toFixed(1);

  if (fluidShortfall > 0) {
    warnings.push(`⚠️ Total fluid delivered = ${totalDeliveredFluid} mL/kg/day is less than intended ${fluid} mL/kg/day due to protein cap`);
    const supplementRate = ((fluidShortfall * weight) / 24).toFixed(1);
    recommendation = `💡 Suggested IV drip rate to meet fluid goal: <strong>${supplementRate} mL/hr</strong>`;
  }

  function perKg(val) {
    return (val * pnVolumePerDay / 100 / weight).toFixed(1);
  }

  function total(val, iv) {
    return (parseFloat(val) + parseFloat(iv)).toFixed(1);
  }

  const ivNa = ivRate > 0 ? (parseFloat(nacl) * 154 * ivRate * 24 / 1000 / weight).toFixed(1) : "0.0";
  const ivK = ivRate > 0 ? (parseFloat(kcl) / 0.5 * ivRate * 24 / 1000 / weight).toFixed(1) : "0.0";

  document.getElementById('results').innerHTML = `
    <h2>Results</h2>
    <p><strong>Age:</strong> ${ageHours} hours (Day ${dol})</p>
    <p><strong>Weight:</strong> ${weight} kg</p>
    <p><strong>PN Rate:</strong> ${pnRate.toFixed(1)} mL/hr</p>
    <p><strong>Lipid Rate:</strong> ${lipidRate.toFixed(1)} mL/hr (Auto-assigned ${lipidVolumeKg} mL/kg/day)</p>
    <p><strong>GDR:</strong> ${totalGDR} mg/kg/min</p>

    <h3>Total Calories (kcal/kg/day)</h3>
    <ul>
      <li>PN: ${pnKcalKg}</li>
      <li>Lipid: ${lipidKcalKgRounded}</li>
      <li>IV Dextrose: ${ivKcalKg}</li>
      <li><strong>Total: ${totalKcal}</strong></li>
    </ul>

    <table>
      <tr><th>Component</th><th>From PN</th><th>From IV</th><th>Total (per kg/day)</th></tr>
      <tr><td>Amino Acid (g)</td><td>${proteinPerKgDay}</td><td>–</td><td>${proteinPerKgDay}</td></tr>
      <tr><td>Glucose (g)</td><td>${pnGlucose.toFixed(1)}</td><td>${ivGlucose.toFixed(1)}</td><td>${(totalGlucose / weight).toFixed(1)}</td></tr>
      <tr><td>Sodium (mmol)</td><td>${perKg(pnData.na)}</td><td>${ivNa}</td><td>${total(perKg(pnData.na), ivNa)}</td></tr>
      <tr><td>Potassium (mmol)</td><td>${perKg(pnData.k)}</td><td>${ivK}</td><td>${total(perKg(pnData.k), ivK)}</td></tr>
      <tr><td>Phosphate (mmol)</td><td>${perKg(pnData.phos)}</td><td>–</td><td>${perKg(pnData.phos)}</td></tr>
      <tr><td>Calcium (mmol)</td><td>${perKg(pnData.ca)}</td><td>–</td><td>${perKg(pnData.ca)}</td></tr>
      <tr><td>Magnesium (mmol)</td><td>${perKg(pnData.mg)}</td><td>–</td><td>${perKg(pnData.mg)}</td></tr>
      <tr><td>Chloride (mmol)</td><td>${perKg(pnData.cl)}</td><td>–</td><td>${perKg(pnData.cl)}</td></tr>
      <tr><td>Acetate (mmol)</td><td>${perKg(pnData.ac)}</td><td>–</td><td>${perKg(pnData.ac)}</td></tr>
      <tr><td>Trace Elements (mL)</td><td>${perKg(pnData.te)}</td><td>–</td><td>${perKg(pnData.te)}</td></tr>
    </table>

    ${warnings.length ? `<p class="warning">${warnings.join('<br>')}</p>` : ''}
    ${recommendation ? `<p class="warning">${recommendation}</p>` : ''}
  `;
}
